import datetime
import json
from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), index=True)
    filepath = Column(String(512))
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    char_count = Column(Integer)
    summary = Column(Text, nullable=True)

class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    quiz_title = Column(String(255))
    score = Column(Integer)
    total_questions = Column(Integer)
    weak_topics = Column(Text)  # Comma-separated or JSON list of weak topics
    taken_at = Column(DateTime, default=datetime.datetime.utcnow)

    @property
    def weak_topics_list(self):
        try:
            return json.loads(self.weak_topics) if self.weak_topics else []
        except Exception:
            return [x.strip() for x in self.weak_topics.split(",") if x.strip()] if self.weak_topics else []

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(255))
    target_date = Column(String(100))
    current_level = Column(String(100))
    daily_hours = Column(Float)
    plan_json = Column(Text)  # Detailed JSON representing calendar/tasks
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    @property
    def plan_data(self):
        try:
            return json.loads(self.plan_json) if self.plan_json else {}
        except Exception:
            return {}

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(255))
    status = Column(String(50), default="in_progress")  # in_progress, completed
    current_question_index = Column(Integer, default=0)
    questions_json = Column(Text)  # JSON list of generated questions
    transcript_json = Column(Text)  # JSON list of [{"speaker": "AI/User", "text": "..."}]
    feedback = Column(Text, nullable=True)  # Overall feedback once finished
    taken_at = Column(DateTime, default=datetime.datetime.utcnow)

    @property
    def questions(self):
        try:
            return json.loads(self.questions_json) if self.questions_json else []
        except Exception:
            return []

    @property
    def transcript(self):
        try:
            return json.loads(self.transcript_json) if self.transcript_json else []
        except Exception:
            return []

class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    status = Column(String(50))  # running, completed, failed
    logs = Column(Text, default="")
    output_data = Column(Text, nullable=True)  # JSON output: {summary: ..., quiz: ..., flashcards: ...}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
