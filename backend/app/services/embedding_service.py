import chromadb
import google.generativeai as genai
from app.config import CHROMA_DB_DIR, EMBEDDING_MODEL, GEMINI_API_KEY
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
        self.collection = self.chroma_client.get_or_create_collection(
            name="course_materials",
            metadata={"hnsw:space": "cosine"}
        )

    def _get_api_key(self, custom_api_key: str = None) -> str:
        key = custom_api_key or GEMINI_API_KEY
        if not key:
            # Fallback to check env again just in case
            import os
            key = os.getenv("GEMINI_API_KEY", "")
        return key

    def get_embeddings(self, texts: List[str], api_key: str = None) -> List[List[float]]:
        key = self._get_api_key(api_key)
        if not key:
            logger.warning("No Gemini API key provided. Using dummy embeddings.")
            # Generate dummy 768-dimensional embeddings for local testing
            import random
            random.seed(42)
            return [[random.uniform(-0.1, 0.1) for _ in range(768)] for _ in texts]
        
        try:
            genai.configure(api_key=key)
            result = genai.embed_content(
                model=EMBEDDING_MODEL,
                contents=texts,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Error calling Gemini Embedding API: {e}")
            # Fallback
            import random
            return [[random.uniform(-0.1, 0.1) for _ in range(768)] for _ in texts]

    def add_documents(self, documents: List[Dict[str, Any]], api_key: str = None):
        """
        documents: List of dicts, each with keys 'id', 'text', 'metadata'
        """
        if not documents:
            return

        texts = [doc['text'] for doc in documents]
        ids = [doc['id'] for doc in documents]
        metadatas = [doc['metadata'] for doc in documents]
        
        embeddings = self.get_embeddings(texts, api_key)

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )
        logger.info(f"Successfully added {len(documents)} chunks to ChromaDB.")

    def search(self, query: str, limit: int = 5, api_key: str = None) -> List[Dict[str, Any]]:
        key = self._get_api_key(api_key)
        
        # If API key is available, embed query, else dummy embed
        if key:
            try:
                genai.configure(api_key=key)
                query_result = genai.embed_content(
                    model=EMBEDDING_MODEL,
                    contents=query,
                    task_type="retrieval_query"
                )
                query_embedding = query_result['embedding']
            except Exception as e:
                logger.error(f"Error embedding search query: {e}")
                # fallback query embed
                import random
                query_embedding = [random.uniform(-0.1, 0.1) for _ in range(768)]
        else:
            import random
            query_embedding = [random.uniform(-0.1, 0.1) for _ in range(768)]

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=limit
        )

        formatted_results = []
        if results and 'documents' in results and results['documents']:
            docs = results['documents'][0]
            metas = results['metadatas'][0]
            distances = results['distances'][0]
            ids = results['ids'][0]

            for i in range(len(docs)):
                formatted_results.append({
                    "id": ids[i],
                    "text": docs[i],
                    "metadata": metas[i],
                    "score": 1 - distances[i]  # Convert distance to similarity score
                })

        return formatted_results

embedding_service = EmbeddingService()
