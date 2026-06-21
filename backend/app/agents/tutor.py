import google.generativeai as genai
from app.services.embedding_service import embedding_service
from app.config import DEFAULT_LLM_MODEL, GEMINI_API_KEY
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class TutorAgent:
    def answer_question(self, question: str, api_key: str = None) -> Dict[str, Any]:
        key = api_key or GEMINI_API_KEY
        
        # 1. Search ChromaDB for relevant chunks
        try:
            chunks = embedding_service.search(query=question, limit=4, api_key=key)
        except Exception as e:
            logger.error(f"Failed to query ChromaDB: {e}")
            chunks = []

        # 2. Compile context and citations
        context_parts = []
        citations = []
        
        for idx, chunk in enumerate(chunks):
            text = chunk['text']
            filename = chunk['metadata'].get('filename', 'Unknown Source')
            context_parts.append(f"Source [{filename}] (Result {idx+1}):\n{text}\n")
            citations.append({
                "filename": filename,
                "snippet": text[:150] + "..." if len(text) > 150 else text
            })

        context_str = "\n".join(context_parts)

        # 3. Create prompt for LLM
        if chunks:
            prompt = (
                "You are an AI Learning Copilot tutor at The Gen Academy. Your task is to answer "
                "the student's question accurately using ONLY the provided course material context. "
                "If the context doesn't contain the answer, answer based on your general knowledge but clearly state that the provided course material does not mention it.\n\n"
                "Structure your answer beautifully with markdown: use bold text, bullet points, and code formatting where necessary to make it easy to learn.\n"
                "Ensure your answers contain citations referencing the source filename (e.g., 'As shown in [file.pdf]...').\n\n"
                f"--- Course Material Context ---\n{context_str}\n"
                f"--- Student Question ---\n{question}\n"
            )
        else:
            prompt = (
                "You are an AI Learning Copilot tutor at The Gen Academy. Since there are currently "
                "no uploaded course materials in the knowledge base, answer the student's question "
                "using your general knowledge of computer science, AI, and programming. "
                "Make sure your response is engaging, detailed, and formatted beautifully in markdown. "
                "Politely remind the student that they can upload their course materials to ground your answers in their specific lectures.\n\n"
                f"--- Student Question ---\n{question}\n"
            )

        # 4. Generate answer
        if not key:
            # Fake/Simulated output for testing without API keys
            simulated_response = (
                f"### Explanation of '{question}' (Demo Mode)\n\n"
                "This is a simulated response because no Gemini API key is configured. To enable full AI replies:\n"
                "1. Set `GEMINI_API_KEY` in your environment or paste it in Settings.\n"
                "2. Try uploading PDFs in the **Knowledge Base** tab to search and cite them.\n\n"
                "**Mock Answer Overview:**\n"
                "- Educational materials are retrieved via semantic vector search in ChromaDB.\n"
                "- This RAG (Retrieval-Augmented Generation) flow ensures factual answers with citations.\n"
                "- Voice toggle in the bottom right uses browser SpeechSynthesis to read this text."
            )
            return {
                "response": simulated_response,
                "citations": []
            }

        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel(DEFAULT_LLM_MODEL)
            response = model.generate_content(prompt)
            return {
                "response": response.text,
                "citations": citations
            }
        except Exception as e:
            logger.error(f"Error generating tutor content: {e}")
            return {
                "response": f"Sorry, I encountered an error answering your question: {str(e)}",
                "citations": []
            }

tutor_agent = TutorAgent()
