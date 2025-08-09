import os, shutil, pytesseract
from PIL import Image
import openai
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from typing import List, Dict
import docx
from io import BytesIO
from sentence_transformers import SentenceTransformer
import pdfplumber
from langchain_text_splitters import RecursiveCharacterTextSplitter

from models.document import Document
from core.config import Config
from models.embedding import Embedding
import re
import fitz 
import tiktoken


def _pdf_is_scanned(file_bytes: bytes, min_chars_per_page: int = 40) -> bool:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    try:
        pages_with_text = 0
        for p in doc:
            t = p.get_text("text")
            if t and len(t.strip()) >= min_chars_per_page:
                pages_with_text += 1
        return pages_with_text < max(1, int(0.3 * len(doc)))
    finally:
        doc.close()


def _ocr_pdf_bytes(file_bytes: bytes, lang: str = "fra") -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    out_parts = []
    
    try:
        zoom = 4.0
        mat = fitz.Matrix(zoom, zoom)

        for i, page in enumerate(doc, start=1):
            try:
                pix = page.get_pixmap(matrix=mat, alpha=False)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

                try:
                    txt = pytesseract.image_to_string(img, lang=lang)
                    txt = _clean_text(txt)
                    if txt.strip(): 
                        out_parts.append(f"\n--- Page {i} ---\n{txt}\n")
                except pytesseract.TesseractNotFoundError:
                    raise RuntimeError("Tesseract introuvable dans le conteneur. Installe tesseract-ocr (+ tesseract-ocr-fra).")
                except Exception as ocr_error:
                    print(f"Erreur OCR page {i}: {ocr_error}")
                    continue
                    
            except Exception as page_error:
                print(f"Erreur traitement page {i}: {page_error}")
                continue

    finally:
        doc.close()
        
    result = "".join(out_parts)
    return _clean_text(result)

def _tiktoken_len(text: str) -> int:
    enc = tiktoken.get_encoding("cl100k_base")
    return len(enc.encode(text))


def _clean_text(s: str) -> str:
    if not s:
        return ""
    
    # 1. Supprimer les caractères nuls et autres caractères de contrôle problématiques
    s = s.replace('\x00', '')  # Supprime les octets nuls
    s = s.replace('\ufffd', '')  # Supprime les caractères de remplacement Unicode
    
    # 2. Supprimer tous les caractères de contrôle sauf les sauts de ligne et tabulations
    import unicodedata
    s = ''.join(char for char in s if unicodedata.category(char)[0] != 'C' or char in '\n\t\r')
    
    # 3. Déhypénation simple (mots coupés en fin de ligne)
    s = re.sub(r'(\w)-\n(\w)', r'\1\2', s)
    
    # 4. Normalisation des espaces
    s = re.sub(r'[ \t]+', ' ', s)  # Plusieurs espaces/tabs → un seul espace
    s = re.sub(r'\n{3,}', '\n\n', s)  # Plus de 2 sauts de ligne → 2 sauts de ligne
    
    # 5. Supprimer les espaces en début/fin de lignes
    lines = s.split('\n')
    lines = [line.strip() for line in lines]
    s = '\n'.join(lines)
    
    # 6. Normalisation Unicode (décomposition puis recomposition)
    s = unicodedata.normalize('NFKC', s)
    
    return s.strip()


class RAGService:
    def __init__(self, api_key: str, base_url: str):
        tess_cmd = os.getenv("TESSERACT_CMD") or shutil.which("tesseract") or "/usr/bin/tesseract"
        pytesseract.pytesseract.tesseract_cmd = tess_cmd
        self.openai_client = openai.OpenAI(api_key=api_key, base_url=base_url)
        self.embedding_model = SentenceTransformer('BAAI/bge-m3')
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,          # ~bonne taille pour bge/LLMs
            chunk_overlap=120,
            length_function=_tiktoken_len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    def generate_embedding(self, text: str, is_query: bool = False) -> List[float]:
        if is_query:
            text = "query: " + text.strip()
        else:
            text = "passage: " + text.strip()
        return self.embedding_model.encode(text, normalize_embeddings=True).tolist()


    def extract_text_from_file(self, file_content: bytes, file_type: str) -> str:
        """
        Extrait le texte d'un fichier avec gestion robuste des caractères problématiques.
        """
        try:
            if file_type.lower() == 'pdf':
                try:
                    # 1) Si le PDF est scanné → OCR
                    if _pdf_is_scanned(file_content):
                        text = _ocr_pdf_bytes(file_content, lang="fra")
                        return _clean_text(text)
                        
                    # 2) Sinon PDF natif → texte + tableaux avec pdfplumber
                    text = ""
                    with pdfplumber.open(BytesIO(file_content)) as pdf:
                        for page_num, page in enumerate(pdf.pages, start=1):
                            page_text = page.extract_text() or ""
                            if page_text.strip():
                                cleaned_page_text = _clean_text(page_text)
                                text += f"\n--- Page {page_num} ---\n{cleaned_page_text}\n"
                                
                            # Extraction des tableaux
                            tables = page.extract_tables() or []
                            for table_num, table in enumerate(tables, start=1):
                                if table:
                                    text += f"\n--- Tableau {table_num} (Page {page_num}) ---\n"
                                    for row in table:
                                        if row and any(cell for cell in row):
                                            clean_row = [
                                                _clean_text(str(cell)) if cell else "" 
                                                for cell in row
                                            ]
                                            text += " | ".join(clean_row) + "\n"
                                    text += "--- Fin tableau ---\n\n"
                                    
                    # Si pas de texte extrait, fallback sur OCR
                    if not text.strip():
                        text = _ocr_pdf_bytes(file_content, lang="fra")
                        
                    return _clean_text(text)
                    
                except Exception as e:
                    print(f"Erreur extraction PDF: {e} → fallback OCR")
                    text = _ocr_pdf_bytes(file_content, lang="fra")
                    return _clean_text(text)

            elif file_type.lower() in ['docx', 'doc']:
                doc = docx.Document(BytesIO(file_content))
                text = '\n'.join(p.text for p in doc.paragraphs)
                return _clean_text(text)

            else:
                # Gestion robuste des fichiers texte avec différents encodages
                text = ""
                encodings_to_try = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
                
                for encoding in encodings_to_try:
                    try:
                        text = file_content.decode(encoding)
                        break
                    except (UnicodeDecodeError, UnicodeError):
                        continue
                        
                # Si aucun encodage n'a fonctionné, utiliser utf-8 avec ignore
                if not text:
                    text = file_content.decode('utf-8', errors='ignore')
                    
                return _clean_text(text)
                
        except Exception as e:
            print(f"Erreur lors de l'extraction de texte: {e}")
            # En dernier recours, essayer de décoder en ignorant les erreurs
            try:
                text = file_content.decode('utf-8', errors='ignore')
                return _clean_text(text)
            except:
                return "Erreur lors de l'extraction du texte du fichier."

    
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
        query_embedding = self.generate_embedding(query, is_query=True)

        stmt = (
            select(
                Embedding.chunk_text,
                Embedding.extra_data,
                Document.filename,
                Embedding.embedding.cosine_distance(query_embedding).label("distance")
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
                "content": "Tu es un assistant expert en rédaction de documents administratifs et techniques pour les appels d'offres publics.\n\n"
                    "Ta mission :\n- Répondre de manière claire, utile et professionnelle aux questions de l'utilisateur.\n"
                    "- Utiliser exclusivement les informations trouvées dans les documents SI elles sont présentes.\n"
                    "- Si une information n'est pas trouvée explicitement, tu peux proposer une réponse générique structurée, en précisant que certains éléments doivent être complétés.\n"
                    "- Toujours répondre en français et rester factuel."
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


    async def generate_llm_response(self, db: AsyncSession, tender_folder_id: int, question: str) -> Dict:
            stmt = (select(Document).where(Document.tender_folder_id == tender_folder_id).options(selectinload(Document.embeddings)))
            result = await db.execute(stmt)
            documents = result.scalars().all()
            if not documents:
                return { 'reponse': 'Aucun document trouvé pour ce dossier.', 'sources': [] }

            full_text = ''
            for doc in documents:
                full_text += f"\n--- {doc.filename} ---\n"
                chunks = sorted(doc.embeddings, key=lambda e: e.chunk_index or 0)
                for chunk in chunks:
                    full_text += chunk.chunk_text + "\n"

            messages = [
                { 'role': 'system', 'content': (
                    "Tu es un assistant expert en rédaction de documents administratifs et techniques pour les appels d'offres publics.\n\n"
                    "Ta mission :\n- Répondre de manière claire, utile et professionnelle aux questions de l'utilisateur.\n"
                    "- Utiliser exclusivement les informations trouvées dans les documents SI elles sont présentes.\n"
                    "- Si une information n'est pas trouvée explicitement, tu peux proposer une réponse générique structurée, en précisant que certains éléments doivent être complétés.\n"
                    "- Toujours répondre en français et rester factuel."
                )},
                { 'role': 'user', 'content': f"Voici les documents à ta disposition :\n{full_text}\n\nQuestion posée :\n{question}\n\nRéponds maintenant de manière professionnelle, en te basant sur ces documents.\nS'ils ne suffisent pas, propose un exemple type ou un guide clair pour aider l'utilisateur à avancer." }
            ]
            response = self.openai_client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=messages,
                temperature=0.2
            )
            return { 'reponse': response.choices[0].message.content, 'sources': [{ 'document': d.filename } for d in documents] }
    

rag_service = RAGService(
    api_key=Config.OPENROUTER_API_KEY,
    base_url=Config.OPENROUTER_BASE_URL
)