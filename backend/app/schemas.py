from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Document Schemas
class DocumentBase(BaseModel):
    filename: str
    char_count: int
    summary: Optional[str] = None

class DocumentCreate(DocumentBase):
    filepath: str

class DocumentResponse(DocumentBase):
    id: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Chat Schemas
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class Citation(BaseModel):
    filename: str
    snippet: str

class ChatResponse(BaseModel):
    response: str
    citations: List[Citation] = []
    agent_routed: str  # e.g., tutor, quiz, planner

# Quiz Schemas
class QuizQuestion(BaseModel):
    id: int
    type: str  # mcq, fill_blank, scenario
    question: str
    options: Optional[List[str]] = None  # for MCQs
    correct_answer: str
    explanation: str

class QuizGenerateRequest(BaseModel):
    topic: Optional[str] = None
    document_ids: Optional[List[int]] = None
    num_questions: int = 5

class QuizSubmitRequest(BaseModel):
    quiz_title: str
    answers: Dict[str, str]  # question_id -> user_answer
    questions: List[Dict[str, Any]] # Original questions for validation

class QuizResultResponse(BaseModel):
    id: int
    quiz_title: str
    score: int
    total_questions: int
    weak_topics: List[str]
    taken_at: datetime
    detailed_feedback: List[Dict[str, Any]]  # question, user_answer, correct_answer, is_correct, explanation

    class Config:
        from_attributes = True

# Study Planner Schemas
class StudyPlanRequest(BaseModel):
    subject: str
    exam_date: str
    current_level: str  # beginner, intermediate, advanced
    available_hours_per_day: float

class StudyPlanResponse(BaseModel):
    id: int
    subject: str
    target_date: str
    current_level: str
    daily_hours: float
    plan_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

# Mock Interview Schemas
class InterviewStartRequest(BaseModel):
    role: str

class InterviewAnswerSubmit(BaseModel):
    session_id: int
    answer: str

class InterviewSessionResponse(BaseModel):
    id: int
    role: str
    status: str
    current_question: Optional[str] = None
    is_finished: bool
    feedback: Optional[str] = None
    transcript: List[Dict[str, str]] = []

# Resume to Learning Roadmap Schemas
class ResumeAnalyzeRequest(BaseModel):
    text_content: str
    target_role: str

class ResumeAnalyzeResponse(BaseModel):
    current_skills: List[str]
    missing_skills: List[str]
    learning_roadmap: List[Dict[str, Any]]

# Workflow Schemas
class WorkflowRunRequest(BaseModel):
    workflow_name: str
    steps: List[str]  # e.g. ["upload", "summarize", "quiz", "flashcards"]
    document_id: Optional[int] = None

class WorkflowRunResponse(BaseModel):
    id: int
    name: str
    status: str
    output_data: Optional[Dict[str, Any]] = None
    logs: str
    created_at: datetime

    class Config:
        from_attributes = True
