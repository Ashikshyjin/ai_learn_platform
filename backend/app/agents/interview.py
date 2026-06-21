import json
import re
import google.generativeai as genai
from app.config import DEFAULT_LLM_MODEL, REASONING_LLM_MODEL, GEMINI_API_KEY
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class InterviewAgent:
    def generate_questions(self, role: str, num_questions: int = 4, api_key: str = None) -> List[str]:
        key = api_key or GEMINI_API_KEY
        if not key:
            return [
                "Explain the difference between supervised and unsupervised learning.",
                "How do you address overfitting in neural networks?",
                "What is retrieval-augmented generation (RAG) and why is it useful?",
                "Describe a project you built using Python and machine learning."
            ]

        prompt = (
            f"You are a Senior Technical Recruiter at The Gen Academy interviewing a candidate for a '{role}' role.\n"
            f"Generate exactly {num_questions} technical and scenario-based interview questions appropriate for this role.\n"
            "Output your result ONLY as a JSON list of strings inside a code block. Example:\n"
            "[\n"
            "  \"Question 1?\",\n"
            "  \"Question 2?\"\n"
            "]\n"
            "Ensure the JSON is completely valid, has double quotes, and does not contain syntax errors. Do not output any other text before or after the JSON code block."
        )

        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel(DEFAULT_LLM_MODEL)
            response = model.generate_content(prompt)
            
            raw_text = response.text.strip()
            json_match = re.search(r"(\[.*\])", raw_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                return json.loads(json_str)
            else:
                return json.loads(raw_text)
        except Exception as e:
            logger.error(f"Error generating interview questions: {e}")
            return [
                f"Can you explain the basic pipeline of a {role} project?",
                "How do you debug a model that exhibits high variance?",
                "What is your experience with vector search and indexing?",
                "Explain a time you optimized a slow algorithm or API endpoint."
            ]

    def evaluate_interview(self, role: str, transcript: List[Dict[str, str]], api_key: str = None) -> str:
        key = api_key or GEMINI_API_KEY
        if not key:
            return (
                "### Mock Interview Feedback (Demo Mode)\n\n"
                "**Assessment Summary:**\n"
                "- Candidate responses recorded successfully.\n"
                "- Structure is solid, covers key requirements.\n"
                "- Paste a valid Gemini API key in Settings to receive comprehensive, LLM-driven performance reviews, score ratings, and suggestions."
            )

        transcript_str = ""
        for turn in transcript:
            speaker = turn.get("speaker", "Candidate")
            text = turn.get("text", "")
            transcript_str += f"{speaker}: {text}\n"

        prompt = (
            f"You are an expert Technical Interviewer evaluating a candidate applying for the '{role}' position.\n"
            "Review the mock interview transcript below and write a constructive, detailed feedback report.\n\n"
            "--- Interview Transcript ---\n"
            f"{transcript_str}\n"
            "----------------------------\n\n"
            "Your report must include:\n"
            "1. **Overall Performance Rating** (e.g., Strong Pass, Pass, Borderline, Fail).\n"
            "2. **Strengths**: Concrete points of what the candidate answered well.\n"
            "3. **Areas for Improvement**: Specific topics or answers where details were missing or incorrect.\n"
            "4. **Actionable Study Items**: Specific concepts or resources to learn next to ace this interview.\n\n"
            "Write the report in a friendly, encouraging, yet professional tone using markdown."
        )

        try:
            genai.configure(api_key=key)
            # Use reasoning model (pro) if possible for feedback
            model = genai.GenerativeModel(REASONING_LLM_MODEL)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error evaluating interview: {e}")
            try:
                # Fallback to flash
                model = genai.GenerativeModel(DEFAULT_LLM_MODEL)
                response = model.generate_content(prompt)
                return response.text
            except Exception:
                return f"Interview evaluation failed to generate: {str(e)}"

interview_agent = InterviewAgent()
