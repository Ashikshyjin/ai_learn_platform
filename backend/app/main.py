import os
import uuid
import json
from fastapi import FastAPI, Depends, UploadFile, File, Form, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app import models, schemas
from app.database import get_db, engine
from app.config import UPLOAD_DIR
from app.services.document_service import document_service
from app.services.workflow_service import workflow_service
from app.agents.coordinator import coordinator_agent
from app.agents.quiz import quiz_agent
from app.agents.planner import planner_agent
from app.agents.interview import interview_agent
from app.agents.resume import resume_agent

# Initialize database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Learning Copilot API", version="1.0.0")

# CORS middleware config to allow React dev server to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_api_key_header(x_gemini_api_key: Optional[str] = Header(None)) -> Optional[str]:
    return x_gemini_api_key

# ----------------- KNOWLEDGE BASE ENDPOINTS -----------------

@app.post("/api/upload", response_model=schemas.DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    api_key: Optional[str] = Depends(get_api_key_header)
):
    # Create unique filename to prevent collisons
    file_id = str(uuid.uuid4())[:8]
    original_filename = file.filename
    filename = f"{file_id}_{original_filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    try:
        # Save file to uploads folder
        with open(filepath, "wb") as f:
            content = await file.read()
            f.write(content)

        # Parse and Index (extract, chunk, generate summary, embed, store in Chroma)
        db_doc = document_service.process_and_index_document(
            db=db,
            filepath=filepath,
            filename=original_filename,
            api_key=api_key
        )
        return db_doc
    except Exception as e:
        # Clean up file if failed
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process uploaded file: {str(e)}"
        )

@app.get("/api/documents", response_model=List[schemas.DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    return db.query(models.Document).order_by(models.Document.uploaded_at.desc()).all()

@app.delete("/api/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        if os.path.exists(doc.filepath):
            os.remove(doc.filepath)
        db.delete(doc)
        db.commit()
        return {"detail": "Document successfully deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------- CHAT / RAG ROUTING ENDPOINTS -----------------

@app.post("/api/chat", response_model=schemas.ChatResponse)
def chat_interaction(
    request: schemas.ChatRequest,
    api_key: Optional[str] = Depends(get_api_key_header)
):
    try:
        result = coordinator_agent.chat(request.message, api_key)
        return schemas.ChatResponse(
            response=result["response"],
            citations=result["citations"],
            agent_routed=result["agent_routed"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------- QUIZ ENDPOINTS -----------------

@app.post("/api/quiz/generate", response_model=List[schemas.QuizQuestion])
def generate_quiz(
    request: schemas.QuizGenerateRequest,
    api_key: Optional[str] = Depends(get_api_key_header)
):
    try:
        questions = quiz_agent.generate_quiz(
            topic=request.topic,
            document_ids=request.document_ids,
            num_questions=request.num_questions,
            api_key=api_key
        )
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quiz/submit", response_model=schemas.QuizResultResponse)
def submit_quiz(
    request: schemas.QuizSubmitRequest,
    db: Session = Depends(get_db)
):
    try:
        answers = request.answers
        questions = request.questions
        
        score = 0
        total = len(questions)
        detailed_feedback = []
        weak_topics = set()

        for q in questions:
            q_id = str(q.get("id"))
            user_ans = answers.get(q_id, "").strip()
            correct_ans = q.get("correct_answer", "").strip()
            
            is_correct = user_ans.lower() == correct_ans.lower()
            if is_correct:
                score += 1
            else:
                # Deduce topic or keywords for weak topics
                explanation = q.get("explanation", "")
                # Simple extraction: add explanation keywords or question subject
                words = q.get("question", "").split()
                # Focus nouns
                keywords = [w.strip("?,.:;()").capitalize() for w in words if len(w) > 5 and w.lower() not in ["explain", "describe", "which", "what", "where", "should"]]
                if keywords:
                    weak_topics.add(keywords[0])
                else:
                    weak_topics.add(request.quiz_title)

            detailed_feedback.append({
                "id": q.get("id"),
                "type": q.get("type"),
                "question": q.get("question"),
                "options": q.get("options"),
                "correct_answer": correct_ans,
                "user_answer": user_ans,
                "is_correct": is_correct,
                "explanation": q.get("explanation", "")
            })

        # Save to database
        weak_topics_list = list(weak_topics)[:3]  # Max 3
        db_result = models.QuizResult(
            quiz_title=request.quiz_title,
            score=score,
            total_questions=total,
            weak_topics=json.dumps(weak_topics_list)
        )
        db.add(db_result)
        db.commit()
        db.refresh(db_result)

        # Assemble full response schema
        return schemas.QuizResultResponse(
            id=db_result.id,
            quiz_title=db_result.quiz_title,
            score=db_result.score,
            total_questions=db_result.total_questions,
            weak_topics=weak_topics_list,
            taken_at=db_result.taken_at,
            detailed_feedback=detailed_feedback
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/quiz/history", response_model=List[schemas.QuizResultResponse])
def get_quiz_history(db: Session = Depends(get_db)):
    results = db.query(models.QuizResult).order_by(models.models.QuizResult.taken_at.desc()).all()
    # Format schemas manually due to JSON loads properties
    output = []
    for r in results:
        output.append({
            "id": r.id,
            "quiz_title": r.quiz_title,
            "score": r.score,
            "total_questions": r.total_questions,
            "weak_topics": r.weak_topics_list,
            "taken_at": r.taken_at,
            "detailed_feedback": []  # Historical detail not stored in full for simplicity
        })
    return output


# ----------------- STUDY PLANNER ENDPOINTS -----------------

@app.post("/api/study-plan/generate", response_model=schemas.StudyPlanResponse)
def generate_study_plan(
    request: schemas.StudyPlanRequest,
    db: Session = Depends(get_db),
    api_key: Optional[str] = Depends(get_api_key_header)
):
    try:
        plan_dict = planner_agent.generate_plan(
            subject=request.subject,
            exam_date=request.exam_date,
            current_level=request.current_level,
            daily_hours=request.available_hours_per_day,
            api_key=api_key
        )
        
        db_plan = models.StudyPlan(
            subject=request.subject,
            target_date=request.exam_date,
            current_level=request.current_level,
            daily_hours=request.available_hours_per_day,
            plan_json=json.dumps(plan_dict)
        )
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        
        return schemas.StudyPlanResponse(
            id=db_plan.id,
            subject=db_plan.subject,
            target_date=db_plan.target_date,
            current_level=db_plan.current_level,
            daily_hours=db_plan.daily_hours,
            plan_data=plan_dict,
            created_at=db_plan.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/study-plans", response_model=List[schemas.StudyPlanResponse])
def get_study_plans(db: Session = Depends(get_db)):
    plans = db.query(models.StudyPlan).order_by(models.StudyPlan.created_at.desc()).all()
    output = []
    for p in plans:
        output.append({
            "id": p.id,
            "subject": p.subject,
            "target_date": p.target_date,
            "current_level": p.current_level,
            "daily_hours": p.daily_hours,
            "plan_data": p.plan_data,
            "created_at": p.created_at
        })
    return output


# ----------------- MOCK INTERVIEW ENDPOINTS -----------------

@app.post("/api/interview/start", response_model=schemas.InterviewSessionResponse)
def start_interview(
    request: schemas.InterviewStartRequest,
    db: Session = Depends(get_db),
    api_key: Optional[str] = Depends(get_api_key_header)
):
    try:
        questions = interview_agent.generate_questions(request.role, num_questions=4, api_key=api_key)
        
        db_session = models.InterviewSession(
            role=request.role,
            status="in_progress",
            current_question_index=0,
            questions_json=json.dumps(questions),
            transcript_json=json.dumps([])
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)

        return schemas.InterviewSessionResponse(
            id=db_session.id,
            role=db_session.role,
            status=db_session.status,
            current_question=questions[0] if questions else "No questions generated",
            is_finished=False,
            transcript=[]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/interview/answer", response_model=schemas.InterviewSessionResponse)
def submit_interview_answer(
    request: schemas.InterviewAnswerSubmit,
    db: Session = Depends(get_db),
    api_key: Optional[str] = Depends(get_api_key_header)
):
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Interview session is already finished")

    try:
        # 1. Update transcript with previous question and answer
        questions = session.questions
        current_idx = session.current_question_index
        current_q = questions[current_idx] if current_idx < len(questions) else "Question"
        
        transcript = session.transcript
        transcript.append({"speaker": "Interviewer", "text": current_q})
        transcript.append({"speaker": "Candidate", "text": request.answer})
        
        # 2. Advance index
        next_idx = current_idx + 1
        session.current_question_index = next_idx
        
        # 3. Check if completed
        is_finished = next_idx >= len(questions)
        next_q = None
        feedback = None
        
        if is_finished:
            session.status = "completed"
            # Evaluate the transcript
            feedback = interview_agent.evaluate_interview(session.role, transcript, api_key)
            session.feedback = feedback
        else:
            next_q = questions[next_idx]

        session.transcript_json = json.dumps(transcript)
        db.commit()
        db.refresh(session)

        return schemas.InterviewSessionResponse(
            id=session.id,
            role=session.role,
            status=session.status,
            current_question=next_q,
            is_finished=is_finished,
            feedback=feedback,
            transcript=transcript
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------- RESUME ANALYZER ENDPOINTS -----------------

@app.post("/api/resume/analyze", response_model=schemas.ResumeAnalyzeResponse)
def analyze_resume(
    request: schemas.ResumeAnalyzeRequest,
    api_key: Optional[str] = Depends(get_api_key_header)
):
    try:
        analysis = resume_agent.analyze_resume(
            text_content=request.text_content,
            target_role=request.target_role,
            api_key=api_key
        )
        return schemas.ResumeAnalyzeResponse(
            current_skills=analysis.get("current_skills", []),
            missing_skills=analysis.get("missing_skills", []),
            learning_roadmap=analysis.get("learning_roadmap", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------- WORKFLOW BUILDER ENDPOINTS -----------------

@app.post("/api/workflow/run", response_model=schemas.WorkflowRunResponse)
def run_workflow(
    request: schemas.WorkflowRunRequest,
    db: Session = Depends(get_db),
    api_key: Optional[str] = Depends(get_api_key_header)
):
    try:
        db_run = workflow_service.execute_workflow(
            db=db,
            name=request.workflow_name,
            steps=request.steps,
            document_id=request.document_id,
            api_key=api_key
        )
        
        # Deserialize output_data
        output = None
        if db_run.output_data:
            output = json.loads(db_run.output_data)

        return schemas.WorkflowRunResponse(
            id=db_run.id,
            name=db_run.name,
            status=db_run.status,
            output_data=output,
            logs=db_run.logs,
            created_at=db_run.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workflow/runs", response_model=List[schemas.WorkflowRunResponse])
def get_workflow_runs(db: Session = Depends(get_db)):
    runs = db.query(models.WorkflowRun).order_by(models.WorkflowRun.created_at.desc()).all()
    output = []
    for r in runs:
        out_data = None
        if r.output_data:
            try:
                out_data = json.loads(r.output_data)
            except Exception:
                pass
        output.append({
            "id": r.id,
            "name": r.name,
            "status": r.status,
            "output_data": out_data,
            "logs": r.logs,
            "created_at": r.created_at
        })
    return output


# ----------------- DASHBOARD / AGGREGATED STATS -----------------

@app.get("/api/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    try:
        total_docs = db.query(models.Document).count()
        total_quizzes = db.query(models.QuizResult).count()
        
        # Calc average quiz score
        avg_score = 0.0
        quiz_results = db.query(models.QuizResult).all()
        if quiz_results:
            total_score = sum([r.score / r.total_questions for r in quiz_results if r.total_questions > 0])
            avg_score = round((total_score / len(quiz_results)) * 100, 1)

        # Aggregate weak topics
        weak_topics_freq = {}
        for r in quiz_results:
            topics = r.weak_topics_list
            for t in topics:
                weak_topics_freq[t] = weak_topics_freq.get(t, 0) + 1
        
        # Sort and get top 4
        sorted_weak = sorted(weak_topics_freq.items(), key=lambda x: x[1], reverse=True)
        weak_topics_list = [item[0] for item in sorted_weak[:4]]

        # Get recent plans
        recent_plans = db.query(models.StudyPlan).order_by(models.StudyPlan.created_at.desc()).limit(3).all()
        plans_list = [{"id": p.id, "subject": p.subject, "target_date": p.target_date, "current_level": p.current_level} for p in recent_plans]

        # Get recent documents
        recent_docs = db.query(models.Document).order_by(models.Document.uploaded_at.desc()).limit(3).all()
        docs_list = [{"id": d.id, "filename": d.filename, "char_count": d.char_count} for d in recent_docs]

        return {
            "total_documents": total_docs,
            "total_quizzes_taken": total_quizzes,
            "average_quiz_score": avg_score,
            "weak_topics": weak_topics_list,
            "recent_plans": plans_list,
            "recent_docs": docs_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
