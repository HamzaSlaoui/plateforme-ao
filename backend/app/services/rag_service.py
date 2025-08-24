import os
import shutil
import re
from io import BytesIO
from typing import List, Dict

import openai
import docx
import fitz
import pdfplumber
import pytesseract
import tiktoken
from PIL import Image
from sentence_transformers import SentenceTransformer
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from langchain_text_splitters import RecursiveCharacterTextSplitter

from models.document import Document
from core.config import Config
from models.embedding import Embedding


def _tiktoken_len(text: str) -> int:
    enc = tiktoken.get_encoding("cl100k_base")
    return len(enc.encode(text))



def _clean_text(s: str) -> str:
    if not s:
        return ""
    s = s.replace("\x00", "").replace("\ufffd", "")
    import unicodedata
    s = "".join(ch for ch in s if unicodedata.category(ch)[0] != "C" or ch in "\n\t\r")
    s = re.sub(r"(\w)-\n(\w)", r"\1\2", s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    s = "\n".join(line.strip() for line in s.split("\n"))
    s = unicodedata.normalize("NFKC", s)
    return s.strip()



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


def _ocr_pdf_bytes(file_bytes: bytes, lang: str) -> str:
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
                    txt = pytesseract.image_to_string(img, lang=lang) or ""
                    txt = _clean_text(txt)
                    if txt.strip():
                        out_parts.append(f"\n--- Page {i} ---\n{txt}\n")
                except pytesseract.TesseractNotFoundError:
                    raise RuntimeError("Tesseract introuvable. Installe tesseract-ocr (+ packs fra/eng).")
                except Exception as ocr_error:
                    print(f"[OCR] Erreur page {i}: {ocr_error}")
            except Exception as page_error:
                print(f"[OCR] Rendu page {i} échoué: {page_error}")
    finally:
        doc.close()
    return _clean_text("".join(out_parts))


class RAGService:
    def __init__(self, api_key: str, base_url: str):
        tess_cmd = os.getenv("TESSERACT_CMD") or shutil.which("tesseract") or "/usr/bin/tesseract"
        pytesseract.pytesseract.tesseract_cmd = tess_cmd
        self.openai_client = openai.OpenAI(api_key=api_key, base_url=base_url)
        self.embedding_model = SentenceTransformer("BAAI/bge-m3")
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=120,
            length_function=_tiktoken_len,
            separators=["\n\n", "\n", " ", ""]
        )

    def generate_embedding(self, text: str, is_query: bool = False) -> List[float]:
        prefix = "query: " if is_query else "passage: "
        return self.embedding_model.encode(prefix + text.strip(), normalize_embeddings=True).tolist()

    def extract_text_from_file(self, file_content: bytes, file_type: str) -> str:
        try:
            ftype = (file_type or "").lower()
            ocr_langs = os.getenv("RAG_LANGS", "fra+eng")

            if ftype == "pdf":
                path = "native"
                try:
                    if _pdf_is_scanned(file_content):
                        path = "ocr"
                        print(f"[EXTRACT] PDF détecté scanné → OCR lang={ocr_langs}")
                        text = _ocr_pdf_bytes(file_content, lang=ocr_langs)
                        print(f"[EXTRACT] OCR terminé, chars={len(text)}")
                        return _clean_text(text)

                    text = ""
                    with pdfplumber.open(BytesIO(file_content)) as pdf:
                        for page_num, page in enumerate(pdf.pages, start=1):
                            page_text = page.extract_text() or ""
                            if page_text.strip():  
                                text += f"\n--- Page {page_num} ---\n{_clean_text(page_text)}\n"
                            tables = page.extract_tables() or []
                            for tnum, table in enumerate(tables, start=1):
                                if table:
                                    text += f"\n--- Tableau {tnum} (Page {page_num}) ---\n"
                                    for row in table:
                                        if row and any(cell for cell in row):
                                            text += " | ".join(_clean_text(str(c)) if c else "" for c in row) + "\n"
                                    text += "--- Fin tableau ---\n\n"
                    if not text.strip():
                        path = "ocr-fallback"
                        print(f"[EXTRACT] PDF natif vide → fallback OCR lang={ocr_langs}")
                        text = _ocr_pdf_bytes(file_content, lang=ocr_langs)
                    print(f"[EXTRACT] méthode={path}, chars={len(text)}")
                    return _clean_text(text)
                except Exception as e:
                    print(f"[EXTRACT] Erreur PDF ({e}) → fallback OCR lang={ocr_langs}")
                    text = _ocr_pdf_bytes(file_content, lang=ocr_langs)
                    print(f"[EXTRACT] OCR fallback, chars={len(text)}")
                    return _clean_text(text)

            if ftype in {"docx", "doc"}:
                d = docx.Document(BytesIO(file_content))
                text = "\n".join(p.text for p in d.paragraphs)
                print(f"[EXTRACT] DOCX/DOC chars={len(text)}")
                return _clean_text(text)

            if ftype in {"txt", "csv"}:
                text = ""
                for enc in ["utf-8", "latin-1", "cp1252", "iso-8859-1"]:
                    try:
                        text = file_content.decode(enc)
                        break
                    except Exception:
                        continue
                if not text:
                    text = file_content.decode("utf-8", errors="ignore")
                print(f"[EXTRACT] {ftype.upper()} chars={len(text)}")
                return _clean_text(text)

            print(f"[EXTRACT] Format non supporté: {ftype}")
            return ""

        except Exception as e:
            print(f"[EXTRACT] Erreur extraction générique: {e}")
            try:
                text = file_content.decode("utf-8", errors="ignore")
                return _clean_text(text)
            except Exception:
                return ""


    def chunk_text(self, text: str) -> List[str]:
        return self.text_splitter.split_text(text)

    async def process_document(self, db: AsyncSession, tender_folder_id: int, document_id: int,
                               file_content: bytes, file_type: str):
        document_text = self.extract_text_from_file(file_content, file_type)
        print(f"[INGEST] doc_id={document_id} total_chars={len(document_text)}")
        chunks = self.chunk_text(document_text)
        if not chunks:
            chunks = [document_text]  
        inserted = 0
        for i, chunk in enumerate(chunks):
            if len(chunk.strip()) < 50 and i > 0:
                continue
            emb = self.generate_embedding(chunk)
            db.add(Embedding(
                tender_folder_id=tender_folder_id,
                document_id=document_id,
                embedding=emb,
                chunk_text=chunk,
                chunk_index=i,
                extra_data={"file_type": file_type, "chunk_length": len(chunk)}
            ))
            inserted += 1
        await db.commit()
        print(f"[INGEST] inserted_embeddings={inserted} for doc_id={document_id}")

    async def search_similar_chunks(self, db: AsyncSession, tender_folder_id: int, query: str, limit: int = 10) -> List[Dict]:
        q_emb = self.generate_embedding(query, is_query=True)
        stmt = (
            select(
                Embedding.chunk_text,
                Embedding.extra_data,
                Document.filename,
                Embedding.embedding.cosine_distance(q_emb).label("distance")
            )
            .join(Document, Embedding.document_id == Document.id)
            .where(Embedding.tender_folder_id == tender_folder_id)
            .order_by("distance")
            .limit(limit)
        )
        result = await db.execute(stmt)
        return [{
            "text": row.chunk_text,
            "source": row.filename,
            "distance": float(row.distance),
            "extra_data": row.extra_data
        } for row in result]

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
        return [{
            "text": row.chunk_text,
            "source": row.filename,
            "distance": 0.0,
            "metadata": row.extra_data
        } for row in result]


    async def generate_rag_response(self, db: AsyncSession, tender_folder_id: int, question: str) -> Dict:
        vector_chunks = await self.search_similar_chunks(db, tender_folder_id, question, limit=10)
        keyword_chunks = []
        m = re.search(r"article\s+(\d+)", question.lower())
        if m:
            keyword_chunks = await self.search_by_keywords(db, tender_folder_id, f"article {m.group(1)}", limit=10)
        all_chunks = keyword_chunks + vector_chunks
        seen, relevant = set(), []
        for ch in all_chunks:
            if ch['text'] not in seen:
                relevant.append(ch)
                seen.add(ch['text'])
                if len(relevant) >= 5:
                    break
        if not relevant:
            return {"reponse": "Je n'ai pas trouvé d'informations pertinentes dans les documents de ce dossier.", "sources": []}
        context = "\n\n".join([f"Source: {c['source']}\n{c['text']}" for c in relevant])
        messages = [
            {"role": "system", "content": (
                "Tu es un assistant expert en rédaction de documents administratifs et techniques pour les appels d'offres publics.\n\n"
                "Ta mission :\n- Répondre de manière claire, utile et professionnelle aux questions de l'utilisateur.\n"
                "- Utiliser exclusivement les informations trouvées dans les documents SI elles sont présentes.\n"
                "- Si une information n'est pas trouvée explicitement, tu peux proposer une réponse générique structurée, en précisant que certains éléments doivent être complétés.\n"
                "- Toujours répondre en français et rester factuel."
                "- À la fin de chaque réponse, suggérer une question pertinente et naturelle qui prolonge la discussion, en lien direct avec la réponse donnée, sans supposer d'informations absentes ou incertaines."
            )},
            {"role": "user", "content": f"Question: {question}\n\nContexte des documents:\n{context}\n\nRéponds en français de manière claire et structurée."}
        ]
        resp = self.openai_client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=messages,
            temperature=0.2
        )
        sources = list({c['source'] for c in relevant})
        return {"reponse": resp.choices[0].message.content, "sources": [{"document": s} for s in sources]}

    async def generate_llm_response(self, db: AsyncSession, tender_folder_id: int, question: str) -> Dict:
        stmt = (
            select(Document)
            .where(Document.tender_folder_id == tender_folder_id)
            .options(selectinload(Document.embeddings))
        )
        result = await db.execute(stmt)
        documents = result.scalars().all()
        if not documents:
            return {"reponse": "Aucun document trouvé pour ce dossier.", "sources": []}

        full_text = ""
        for doc in documents:
            full_text += f"\n--- {doc.filename} ---\n"
            chunks = sorted(doc.embeddings, key=lambda e: e.chunk_index or 0)
            for chunk in chunks:
                full_text += chunk.chunk_text + "\n"

        messages = [
            {"role": "system", "content": (
                "Tu es un assistant expert en rédaction de documents administratifs et techniques pour les appels d'offres publics.\n\n"
                "Ta mission :\n- Répondre de manière claire, utile et professionnelle aux questions de l'utilisateur.\n"
                "- Utiliser exclusivement les informations trouvées dans les documents SI elles sont présentes.\n"
                "- Si une information n'est pas trouvée explicitement, tu peux proposer une réponse générique structurée, en précisant que certains éléments doivent être complétés.\n"
                "- Toujours répondre en français et rester factuel."
                "- À la fin de chaque réponse, suggérer une question pertinente et naturelle qui prolonge la discussion, en lien direct avec la réponse donnée, sans supposer d'informations absentes ou incertaines."
            )},
            {"role": "user", "content": f"Voici les documents à ta disposition :\n{full_text}\n\nQuestion posée :\n{question}\n\nRéponds maintenant de manière professionnelle, en te basant sur ces documents.\nS'ils ne suffisent pas, propose un exemple type ou un guide clair pour aider l'utilisateur à avancer."}
        ]
        response = self.openai_client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=messages,
            temperature=0.2
        )
        return {"reponse": response.choices[0].message.content, "sources": [{"document": d.filename} for d in documents]}

