import os
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.models import Document
from app.services.embedding_service import embedding_service
from app.config import DEFAULT_LLM_MODEL, GEMINI_API_KEY
import logging

logger = logging.getLogger(__name__)

class DocumentService:
    def extract_text(self, filepath: str) -> str:
        ext = os.path.splitext(filepath)[1].lower()
        if ext == ".pdf":
            try:
                reader = PdfReader(filepath)
                text = ""
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                return text
            except Exception as e:
                logger.error(f"Error reading PDF {filepath}: {e}")
                raise ValueError(f"Failed to parse PDF file: {e}")
        elif ext in [".txt", ".md", ".json"]:
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Error reading text file {filepath}: {e}")
                raise ValueError(f"Failed to parse text file: {e}")
        else:
            raise ValueError(f"Unsupported file extension: {ext}")

    def generate_summary(self, text: str, api_key: str = None) -> str:
        key = api_key or GEMINI_API_KEY
        if not key:
            return "No Gemini API key provided. Summary generation skipped."
        
        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel(DEFAULT_LLM_MODEL)
            # Limit text size to prevent token limit errors during summary
            preview_text = text[:15000]
            prompt = (
                "Summarize the following educational material. Provide a clear, concise overview "
                "of the key topics covered, suitable for a student's reference. Keep it under 250 words:\n\n"
                f"{preview_text}"
            )
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return f"Summary generation failed: {str(e)}"

    def process_and_index_document(self, db: Session, filepath: str, filename: str, api_key: str = None) -> Document:
        # 1. Extract text
        text = self.extract_text(filepath)
        char_count = len(text)
        
        if char_count == 0:
            raise ValueError("Document has no readable text content.")

        # 2. Generate summary
        summary = self.generate_summary(text, api_key)

        # 3. Create document record in DB
        db_doc = Document(
            filename=filename,
            filepath=filepath,
            char_count=char_count,
            summary=summary
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)

        # 4. Chunk text
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150
        )
        chunks = text_splitter.split_text(text)

        # 5. Insert chunks into ChromaDB
        chroma_docs = []
        for idx, chunk in enumerate(chunks):
            chroma_docs.append({
                "id": f"doc_{db_doc.id}_chunk_{idx}",
                "text": chunk,
                "metadata": {
                    "document_id": db_doc.id,
                    "filename": filename,
                    "chunk_index": idx
                }
            })

        embedding_service.add_documents(chroma_docs, api_key)

        return db_doc

document_service = DocumentService()
