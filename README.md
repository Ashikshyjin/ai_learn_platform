# AI Learning Copilot (Multi-Agent RAG System)

An advanced, student-focused **AI Learning Copilot** designed for **The Gen Academy**. The application features multi-agent routing (via LangGraph), semantic vector retrieval (via ChromaDB), personalized study planners, mock recruiters, and an automation workflow builder.

---

## 🏗️ Architecture Diagram

```
                User
                  │
               Frontend
               (React)
                  │
            FastAPI Backend
                  │
    ┌─────────────┼─────────────┐
RAG Agent    Quiz Agent    Planner Agent
    │              │             │
    └─────────────┼─────────────┘
                  │
              LangGraph
                  │
           Vector Database
              ChromaDB
                  │
          Course Documents
```

---

## ✨ Features Checklist

1. **Course Knowledge Base**: Upload PDFs, notes, and articles. The backend extracts text, segments it, embeds chunks using Gemini (`text-embedding-004`), and indices them in **ChromaDB**.
2. **Multi-Agent RAG Chatbot**: Students ask questions (e.g. *Explain Backpropagation*). A **LangGraph Coordinator Agent** routes the request. If it's a general question, the **Tutor Agent** queries the vector index, feeds relevant context to Gemini, and compiles answers with source citations.
3. **Voice Tutor Integration**: Toggles voice output (via browser `SpeechSynthesis`) and allows dictation of student queries or mock interview responses (via Web `SpeechRecognition`) with pulsing voice canvas states.
4. **Interactive Quiz Maker**: Generate MCQs, fill-in-the-blanks, and scenario-based challenge questions from course materials. Submit answers to get grading feedback and AI explanations.
5. **Study Planner**: Compile customized timelines leading up to exam completion dates. Paces workload according to skill level, timeline constraints, and daily hours.
6. **Mock Technical Recruiter**: Select job roles (e.g. *AI Engineer*) to initiate live telephone screens. Tutors ask technical questions one-by-one. Dictate responses and receive comprehensive, critique reviews on performance.
7. **Skill Gap Analyzer**: Paste target job roles and CV/resume text. Matches current competencies, lists missing key topics (e.g. *LangGraph, RAG*), and compiles customized learning paths.
8. **AI Workflow Builder**: Connect multiple modular nodes visually (e.g. *Selector -> Summarize -> Quiz -> Flashcards*). Run sequential pipelines to generate comprehensive study guides.

---

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy (SQLite out-of-the-box, compatible with PostgreSQL), LangGraph, LangChain, ChromaDB, Google Generative AI (Gemini).
- **Frontend**: React + Vite, Vanilla CSS (Glassmorphism, custom scrollbars, animations).
- **Deployment**: Docker, Docker Compose, ready for Railway / Render.

---

## 🚀 Setup & Launch Guide

### Option 1: Direct Local Setup

#### Prerequisites
- Python 3.11+
- Node.js 18+

#### 1. Start FastAPI Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run FastAPI Dev Server on port 8000
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Open backend Swagger docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### 2. Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
- Open browser: [http://localhost:5173](http://localhost:5173)

---

### Option 2: Docker Compose Setup
Make sure you have Docker running locally. Spin up both containers concurrently:
```bash
docker-compose up --build
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ⚙️ Configuration (Gemini API Key)
The app runs in **Demo Mode** out-of-the-box if no API Key is provided, serving simulated answers and structures. To connect live:
1. Copy your Gemini API Key from Google AI Studio.
2. In the React application, click the **Settings Cog** in the bottom-left sidebar.
3. Paste your API Key and click **Save Configuration**. The key is stored securely in your browser's local storage and sent in request headers to your local API backend.
4. Alternatively, export `GEMINI_API_KEY` in your terminal environment prior to running the backend.
