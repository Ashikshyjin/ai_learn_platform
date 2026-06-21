import json
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.models import WorkflowRun, Document
from app.services.document_service import document_service
from app.agents.quiz import quiz_agent
from app.config import DEFAULT_LLM_MODEL, GEMINI_API_KEY
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class WorkflowService:
    def generate_flashcards(self, text_content: str, api_key: str = None) -> List[Dict[str, str]]:
        key = api_key or GEMINI_API_KEY
        if not key:
            return [
                {"front": "RAG", "back": "Retrieval-Augmented Generation: Grounding LLM answers in external databases."},
                {"front": "ChromaDB", "back": "An open-source vector database used to store and query embeddings."},
                {"front": "LangGraph", "back": "A library for building stateful, multi-actor applications with LLMs."}
            ]

        prompt = (
            "You are an AI Study Assistant at The Gen Academy. Read the course context below "
            "and generate a list of exactly 5 flashcards for core terms and concepts.\n\n"
            f"--- Course Context ---\n{text_content[:10000]}\n\n"
            "Output your response ONLY as a JSON list of objects containing 'front' (term/question) "
            "and 'back' (definition/answer). Example:\n"
            "[\n"
            "  { \"front\": \"Term\", \"back\": \"Definition\" }\n"
            "]\n"
            "Ensure the JSON is completely valid, has double quotes, and does not contain syntax errors. Do not output any other text before or after the JSON code block."
        )

        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel(DEFAULT_LLM_MODEL)
            response = model.generate_content(prompt)
            
            raw_text = response.text.strip()
            # Extract JSON
            import re
            json_match = re.search(r"(\[.*\])", raw_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            else:
                return json.loads(raw_text)
        except Exception as e:
            logger.error(f"Error generating flashcards: {e}")
            return [
                {"front": "Error Term", "back": f"Flashcard generation failed: {str(e)}"}
            ]

    def execute_workflow(
        self,
        db: Session,
        name: str,
        steps: List[str],
        document_id: Optional[int] = None,
        api_key: str = None
    ) -> WorkflowRun:
        # 1. Create run record
        run = WorkflowRun(
            name=name,
            status="running",
            logs="Initializing workflow execution...\n"
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        try:
            output_data = {}
            doc_text = ""
            doc_filename = ""
            
            if document_id:
                doc = db.query(Document).filter(Document.id == document_id).first()
                if doc:
                    doc_filename = doc.filename
                    run.logs += f"Loaded target document: {doc_filename}\n"
                    # Read text from file
                    try:
                        doc_text = document_service.extract_text(doc.filepath)
                    except Exception as e:
                        run.logs += f"Failed to extract document text: {e}\n"
                else:
                    run.logs += f"Warning: Document ID {document_id} not found. Running general topic mode.\n"

            for step in steps:
                step = step.strip().lower()
                run.logs += f"Running step: '{step}'...\n"
                db.commit()

                if step == "summarize":
                    if doc_text:
                        summary = document_service.generate_summary(doc_text, api_key)
                        output_data["summary"] = summary
                        run.logs += "Successfully generated summary.\n"
                    else:
                        output_data["summary"] = "No document text available to summarize."
                        run.logs += "Skipped summarize: no document text loaded.\n"

                elif step == "quiz":
                    topic = doc_filename or "General Topic"
                    doc_ids = [document_id] if document_id else None
                    quizzes = quiz_agent.generate_quiz(
                        topic=topic,
                        document_ids=doc_ids,
                        num_questions=5,
                        api_key=api_key
                    )
                    output_data["quiz"] = quizzes
                    run.logs += f"Successfully generated {len(quizzes)} quiz questions.\n"

                elif step == "flashcards":
                    if doc_text:
                        flashcards = self.generate_flashcards(doc_text, api_key)
                    else:
                        flashcards = self.generate_flashcards("AI and RAG systems engineering", api_key)
                    output_data["flashcards"] = flashcards
                    run.logs += f"Successfully generated {len(flashcards)} flashcards.\n"

                else:
                    run.logs += f"Unknown step '{step}' skipped.\n"

            run.status = "completed"
            run.logs += "Workflow completed successfully.\n"
            run.output_data = json.dumps(output_data)
            db.commit()

        except Exception as e:
            logger.error(f"Error executing workflow: {e}")
            run.status = "failed"
            run.logs += f"Workflow execution failed: {str(e)}\n"
            db.commit()

        db.refresh(run)
        return run

workflow_service = WorkflowService()
