import openai
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List, Dict
import PyPDF2
import docx
from io import BytesIO
from sentence_transformers import SentenceTransformer
import pdfplumber
from langchain_text_splitters import RecursiveCharacterTextSplitter

from models.document import Document
from core.config import Config
from models.embedding import Embedding
import re

class RAGService:
    def __init__(self, api_key: str, base_url: str):
        self.openai_client = openai.OpenAI(api_key=api_key, base_url=base_url)
        self.embedding_model = SentenceTransformer('BAAI/bge-m3')
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    def generate_embedding(self, text: str) -> List[float]:
        return self.embedding_model.encode(text, normalize_embeddings=True).tolist()

    def extract_text_from_file(self, file_content: bytes, file_type: str) -> str:
        if file_type.lower() == 'pdf':
            text = ""
            try:
                with pdfplumber.open(BytesIO(file_content)) as pdf:
                    for page_num, page in enumerate(pdf.pages):
                        page_text = page.extract_text()
                        if page_text:
                            text += f"\n--- Page {page_num + 1} ---\n"
                            text += page_text + "\n"
                        tables = page.extract_tables()
                        for table_num, table in enumerate(tables):
                            if table:
                                text += f"\n--- Tableau {table_num + 1} (Page {page_num + 1}) ---\n"
                                for row_num, row in enumerate(table):
                                    if row and any(cell for cell in row):
                                        clean_row = []
                                        for cell in row:
                                            if cell:
                                                clean_cell = str(cell).strip().replace('\n', ' ')
                                                clean_row.append(clean_cell)
                                            else:
                                                clean_row.append("")
                                        text += " | ".join(clean_row) + "\n"
                                text += "--- Fin tableau ---\n\n"
                return text
            except Exception as e:
                print(f"Erreur pdfplumber: {e}, fallback vers PyPDF2")
                pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text()
                return text
        elif file_type.lower() in ['docx', 'doc']:
            doc = docx.Document(BytesIO(file_content))
            return '\n'.join([paragraph.text for paragraph in doc.paragraphs])
        else:
            return file_content.decode('utf-8')
    
    def chunk_text(self, text: str) -> List[str]:
        return self.text_splitter.split_text(text)

    async def process_document(self, db: AsyncSession, tender_folder_id: int, document_id: int,
                               file_content: bytes, file_type: str):
        document_text = self.extract_text_from_file(file_content, file_type)
        chunks = self.chunk_text(document_text)
        for i, chunk in enumerate(chunks):
            if len(chunk.strip()) < 50:  
                continue
            embedding = self.generate_embedding(chunk)
            print(f"Inserting chunk {i} (len={len(chunk)}):", chunk[:80], "...")
            embedding_row = Embedding(
                tender_folder_id=tender_folder_id,
                document_id=document_id,
                embedding=embedding,  
                chunk_text=chunk,
                chunk_index=i,
                extra_data={"file_type": file_type, "chunk_length": len(chunk)}
            )
            db.add(embedding_row)
        await db.commit()

    async def search_similar_chunks(self, db: AsyncSession, tender_folder_id: int, 
                                    query: str, limit: int = 10) -> List[Dict]:
        query_embedding = self.generate_embedding(query)
        stmt = (
            select(
                Embedding.chunk_text,
                Embedding.extra_data,
                Document.filename,
                Embedding.embedding.l2_distance(query_embedding).label("distance")
            )
            .join(Document, Embedding.document_id == Document.id)
            .where(Embedding.tender_folder_id == tender_folder_id)
            .order_by("distance")
            .limit(limit)
        )
        result = await db.execute(stmt)
        return [
            {
                "text": row.chunk_text,
                "source": row.filename,
                "distance": float(row.distance),
                "extra_data": row.extra_data
            }
            for row in result
        ]
    
    async def generate_rag_response(self, db: AsyncSession, tender_folder_id: int, question: str) -> Dict:
        vector_chunks = await self.search_similar_chunks(db, tender_folder_id, question, limit=10)
        keyword_chunks = []
        if re.search(r'article\s+\d+', question.lower()):
            article_match = re.search(r'article\s+(\d+)', question.lower())
            if article_match:
                article_num = article_match.group(1)
                keyword_chunks = await self.search_by_keywords(db, tender_folder_id, f"article {article_num}", limit=10)
        all_chunks = keyword_chunks + vector_chunks
        seen_texts = set()
        relevant_chunks = []
        for chunk in all_chunks:
            if chunk['text'] not in seen_texts:
                relevant_chunks.append(chunk)
                seen_texts.add(chunk['text'])
                if len(relevant_chunks) >= 5: 
                    break
        if not relevant_chunks:
            return {
                "reponse": "Je n'ai pas trouvé d'informations pertinentes dans les documents de ce dossier.",
                "sources": []
            }
        context = "\n\n".join([
            f"Source: {chunk['source']}\n{chunk['text']}" 
            for chunk in relevant_chunks
        ])
        messages = [
            {
                "role": "system",
                "content": """Tu es un assistant spécialisé dans l'analyse d'appels d'offres. 
                Réponds précisément aux questions en te basant UNIQUEMENT sur les documents fournis.
                Cite toujours tes sources. Si l'information n'est pas dans les documents, dis-le clairement."""
            },
            {
                "role": "user",
                "content": f"""Question: {question}

                Contexte des documents:
                {context}

                Réponds en français de manière claire et structurée."""
            }
        ]
        response = self.openai_client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=messages,
            temperature=0.2
        )
        sources = list(set([chunk['source'] for chunk in relevant_chunks]))
        return {
            "reponse": response.choices[0].message.content,
            "sources": [{"document": source} for source in sources]
        }

    async def search_by_keywords(self, db: AsyncSession, tender_folder_id: int, keywords: str, limit: int = 10) -> List[Dict]:
        result = await db.execute(text("""
            SELECT 
                e.chunk_text,
                e.extra_data,
                d.filename,
                0.0 as distance
            FROM embeddings e
            JOIN documents d ON e.document_id = d.id
            WHERE e.tender_folder_id = :tender_folder_id
            AND e.chunk_text ILIKE :keywords
            LIMIT :limit
        """), {
            "tender_folder_id": tender_folder_id,
            "keywords": f"%{keywords}%",
            "limit": limit
        })
        return [
            {
                "text": row.chunk_text,
                "source": row.filename,
                "distance": 0.0,
                "metadata": row.extra_data
            }
            for row in result
        ]
    

rag_service = RAGService(
    api_key=Config.OPENROUTER_API_KEY,
    base_url=Config.OPENROUTER_BASE_URL
)
