import json
import re
import google.generativeai as genai
from app.config import DEFAULT_LLM_MODEL, GEMINI_API_KEY
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ResumeAgent:
    def analyze_resume(self, text_content: str, target_role: str, api_key: str = None) -> Dict[str, Any]:
        key = api_key or GEMINI_API_KEY
        
        prompt = (
            f"You are a Skills Gap & Career Alignment Agent at The Gen Academy.\n"
            f"Analyze the following candidate resume text for a target role of '{target_role}'.\n\n"
            f"--- Resume Text ---\n{text_content}\n\n"
            "Perform these tasks:\n"
            "1. Extract the current technical skills matching the resume.\n"
            "2. Identify the critical skills missing or under-represented in the resume that are crucial for a senior/competent role in the target job.\n"
            "3. Create a step-by-step learning roadmap to acquire the missing skills.\n\n"
            "Output your findings STRICTLY as a JSON object inside a code block. Schema:\n"
            "{\n"
            "  \"current_skills\": [\"Skill 1\", \"Skill 2\"],\n"
            "  \"missing_skills\": [\"Skill 3\", \"Skill 4\"],\n"
            "  \"learning_roadmap\": [\n"
            "    {\n"
            "      \"phase\": \"Phase 1: Core Technologies\",\n"
            "      \"topics\": [\"Topic A\", \"Topic B\"],\n"
            "      \"duration\": \"2 weeks\",\n"
            "      \"resources\": [\"Suggested book, course, or doc link\"]\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "Ensure the JSON is completely valid, has double quotes, and does not contain syntax errors. Do not output any other text before or after the JSON code block."
        )

        if not key:
            return self._get_dummy_analysis(text_content, target_role)

        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel(DEFAULT_LLM_MODEL)
            response = model.generate_content(prompt)
            
            raw_text = response.text.strip()
            json_match = re.search(r"(\{.*\})", raw_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                return json.loads(json_str)
            else:
                return json.loads(raw_text)
        except Exception as e:
            logger.error(f"Error analyzing resume: {e}")
            return self._get_dummy_analysis(text_content, target_role)

    def _get_dummy_analysis(self, resume_text: str, role: str) -> Dict[str, Any]:
        return {
            "current_skills": ["Python", "Flask", "Machine Learning", "NLP", "Pandas", "SQL"],
            "missing_skills": ["LangGraph", "LangChain", "Vector Databases (ChromaDB)", "Retrieval-Augmented Generation (RAG)"],
            "learning_roadmap": [
                {
                    "phase": "Phase 1: RAG & Vector Foundations",
                    "topics": [
                        "Vector representations of text (embeddings)",
                        "Semantic search algorithms",
                        "ChromaDB local setups & indexing configurations"
                    ],
                    "duration": "1 week",
                    "resources": [
                        "ChromaDB Official Documentation (docs.trychroma.com)",
                        "OpenAI/Gemini Embedding Guides"
                    ]
                },
                {
                    "phase": "Phase 2: RAG Frameworks (LangChain)",
                    "topics": [
                        "LangChain document loaders & text splitters",
                        "ChromaDB integration in LangChain workflows",
                        "Designing prompt templates for retrieval grounding"
                    ],
                    "duration": "1 week",
                    "resources": [
                        "LangChain Introduction Tutorials (python.langchain.com)",
                        "DeepLearning.AI: LangChain for LLM Application Development"
                    ]
                },
                {
                    "phase": "Phase 3: Multi-Agent Choreography (LangGraph)",
                    "topics": [
                        "Stateful multi-actor systems",
                        "Configuring graph nodes, edges, and cycles",
                        "Routing queries dynamically based on agent intent"
                    ],
                    "duration": "2 weeks",
                    "resources": [
                        "LangGraph Tutorials (langchain-ai.github.io/langgraph)",
                        "AI Agentic Workflows by Andrew Ng"
                    ]
                }
            ]
        }

resume_agent = ResumeAgent()
