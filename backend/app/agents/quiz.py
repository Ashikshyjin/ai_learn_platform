import json
import re
import google.generativeai as genai
from app.services.embedding_service import embedding_service
from app.config import DEFAULT_LLM_MODEL, GEMINI_API_KEY
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class QuizAgent:
    def generate_quiz(
        self, 
        topic: Optional[str] = None, 
        document_ids: Optional[List[int]] = None, 
        num_questions: int = 5,
        api_key: str = None
    ) -> List[Dict[str, Any]]:
        key = api_key or GEMINI_API_KEY
        
        # 1. Retrieve context if documents are specified
        context_str = ""
        if document_ids:
            try:
                # Retrieve some chunks matching the topic or general content
                search_query = topic or "general summary"
                chunks = embedding_service.search(query=search_query, limit=10, api_key=key)
                # Filter chunks belonging to requested document_ids
                filtered_chunks = [c for c in chunks if c['metadata'].get('document_id') in document_ids]
                context_str = "\n".join([f"Context: {c['text']}" for c in filtered_chunks])
            except Exception as e:
                logger.error(f"Error getting context for quiz: {e}")

        # 2. Build Prompt
        prompt = (
            "You are an AI Quiz Generator at The Gen Academy. Generate a quiz containing "
            f"exactly {num_questions} questions about '{topic or 'Course Materials'}' "
            "based on the provided context (if any).\n\n"
        )
        if context_str:
            prompt += f"--- CONTEXT ---\n{context_str}\n\n"
            
        prompt += (
            "Each question MUST be one of these types:\n"
            "- 'mcq' (Multiple Choice Question, with 4 choices in 'options' and 'correct_answer' matching the exact string choice)\n"
            "- 'fill_blank' (Fill in the blanks, with 'correct_answer' being the missing word(s))\n"
            "- 'scenario' (Scenario-based application question, with 4 choice options and correct_answer)\n\n"
            "Output your answer as a JSON array inside a code block. Example format:\n"
            "[\n"
            "  {\n"
            "    \"id\": 1,\n"
            "    \"type\": \"mcq\",\n"
            "    \"question\": \"Which optimizer is commonly used in Deep Learning?\",\n"
            "    \"options\": [\"Adam\", \"SGD\", \"RMSprop\", \"All of the above\"],\n"
            "    \"correct_answer\": \"All of the above\",\n"
            "    \"explanation\": \"Adam, SGD, and RMSprop are all popular optimization algorithms.\"\n"
            "  }\n"
            "]\n"
            "Ensure the JSON is completely valid, has double quotes, and does not contain syntax errors. Do not output any other text before or after the JSON code block."
        )

        # 3. Handle Demo Mode
        if not key:
            return self._get_dummy_quiz(topic or "General RAG & AI")

        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel(DEFAULT_LLM_MODEL)
            response = model.generate_content(prompt)
            
            # Extract JSON from Markdown code blocks if present
            raw_text = response.text.strip()
            json_match = re.search(r"(\[.*\])", raw_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                return json.loads(json_str)
            else:
                # Try raw parse
                return json.loads(raw_text)
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            return self._get_dummy_quiz(topic or "General RAG & AI")

    def _get_dummy_quiz(self, topic: str) -> List[Dict[str, Any]]:
        return [
            {
                "id": 1,
                "type": "mcq",
                "question": f"What is the main goal of '{topic}' in modern AI applications?",
                "options": [
                    "To generate content without training data",
                    "To ground AI generation in specific knowledge source material",
                    "To make neural networks train faster",
                    "To write code snippets automatically"
                ],
                "correct_answer": "To ground AI generation in specific knowledge source material",
                "explanation": "Retrieval-Augmented Generation (RAG) retrieves relevant documents to ground the LLM's answers, minimizing hallucinations."
            },
            {
                "id": 2,
                "type": "fill_blank",
                "question": "In a RAG system, the vector database stores _____ representing chunks of document text.",
                "options": None,
                "correct_answer": "embeddings",
                "explanation": "Text chunks are converted to high-dimensional vector embeddings and stored in database indices like ChromaDB."
            },
            {
                "id": 3,
                "type": "scenario",
                "question": "You are building an AI chatbot for customer service and need to ensure it only answers using the company's FAQ PDF. Which framework is most appropriate?",
                "options": [
                    "Standard GPT-4 API call without arguments",
                    "RAG using vector search with the FAQ text chunked and indexed",
                    "Fine-tuning the LLM on the FAQ text",
                    "Re-training a Llama-3 model from scratch"
                ],
                "correct_answer": "RAG using vector search with the FAQ text chunked and indexed",
                "explanation": "RAG is fast, cheap, easily updatable, and guarantees the answers can be grounded and cited back to the customer FAQ PDF."
            }
        ]

quiz_agent = QuizAgent()
