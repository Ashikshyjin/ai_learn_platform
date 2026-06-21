from typing import TypedDict, Dict, Any, List
from langgraph.graph import StateGraph, END
import google.generativeai as genai
from app.agents.tutor import tutor_agent
from app.agents.quiz import quiz_agent
from app.agents.planner import planner_agent
from app.config import DEFAULT_LLM_MODEL, GEMINI_API_KEY
import logging

logger = logging.getLogger(__name__)

# 1. State definition
class AgentState(TypedDict):
    message: str
    api_key: str
    next_agent: str
    response: str
    citations: List[Dict[str, Any]]
    agent_routed: str

# 2. Coordinator node (Intention Router)
def route_intent(state: AgentState) -> AgentState:
    message = state["message"].lower()
    key = state.get("api_key") or GEMINI_API_KEY
    
    # Simple check first for speed
    if "quiz" in message or "test me" in message or "question sheet" in message:
        state["next_agent"] = "quiz"
        return state
    elif "study plan" in message or "planner" in message or "schedule" in message or "roadmap" in message:
        state["next_agent"] = "planner"
        return state

    # If key is available, use Gemini for intelligent routing
    if key:
        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel(DEFAULT_LLM_MODEL)
            prompt = (
                "You are an AI Coordinator Routing Agent at The Gen Academy.\n"
                "Classify the student query into one of three destinations:\n"
                "1. 'quiz': If the user explicitly wants a quiz generated, wants to test their knowledge, or wants practice questions.\n"
                "2. 'planner': If the user explicitly wants a study plan, schedule, target completion roadmap, or learning planner.\n"
                "3. 'tutor': If the user is asking a general educational question, needs help explaining a concept, wants RAG retrieval, or anything else.\n\n"
                f"Student Query: \"{state['message']}\"\n\n"
                "Output ONLY the category name ('quiz', 'planner', or 'tutor') in lowercase. Do not include quotes, periods, or extra text."
            )
            response = model.generate_content(prompt)
            classification = response.text.strip().lower()
            if classification in ["quiz", "planner", "tutor"]:
                state["next_agent"] = classification
                return state
        except Exception as e:
            logger.error(f"Error in coordinator routing agent: {e}")
            
    # Default fallback
    state["next_agent"] = "tutor"
    return state

# 3. Agent execution nodes
def execute_tutor(state: AgentState) -> AgentState:
    tutor_response = tutor_agent.answer_question(state["message"], state.get("api_key"))
    state["response"] = tutor_response["response"]
    state["citations"] = tutor_response["citations"]
    state["agent_routed"] = "tutor"
    return state

def execute_quiz(state: AgentState) -> AgentState:
    # Extract topic from message if possible
    topic = state["message"].replace("quiz", "").replace("generate", "").replace("create", "").replace("test", "").strip()
    if not topic or len(topic) < 3:
        topic = "General Subject"
        
    quizzes = quiz_agent.generate_quiz(topic=topic, num_questions=3, api_key=state.get("api_key"))
    
    # Format quiz for chat window
    response_md = f"### 📝 Generated Quiz: {topic}\n\nI have generated a practice quiz for you on **{topic}**! "
    response_md += "Go to the **Quiz Maker** tab in the sidebar to configure and take this quiz, or test yourself with these sample questions here:\n\n"
    
    for idx, q in enumerate(quizzes):
        response_md += f"**Q{idx+1}: {q['question']}**\n"
        if q['options']:
            for opt in q['options']:
                response_md += f"- {opt}\n"
        response_md += f"*Correct Answer:* ||{q['correct_answer']}||\n"
        response_md += f"*Explanation:* {q['explanation']}\n\n"
        
    state["response"] = response_md
    state["citations"] = []
    state["agent_routed"] = "quiz"
    return state

def execute_planner(state: AgentState) -> AgentState:
    # Extract subject
    subject = state["message"].replace("study plan", "").replace("planner", "").replace("schedule", "").replace("roadmap", "").strip()
    if not subject or len(subject) < 3:
        subject = "General Curriculum"
        
    plan = planner_agent.generate_plan(
        subject=subject,
        exam_date="in 2 weeks",
        current_level="intermediate",
        daily_hours=2.0,
        api_key=state.get("api_key")
    )
    
    # Format plan for chat window
    response_md = f"### 📅 Study Plan Created: {subject}\n\n"
    response_md += f"**Overview:** {plan.get('overview', '')}\n\n"
    response_md += "Here is a 3-Day preview of your custom roadmap. You can edit dates and compile full multi-week planners under the **Study Planner** tab:\n\n"
    
    schedules = plan.get("daily_schedule", [])[:3]
    for s in schedules:
        response_md += f"#### 🗓️ {s.get('day')} - {s.get('topic')} ({s.get('duration')})\n"
        for t in s.get("tasks", []):
            response_md += f"- [ ] {t}\n"
        response_md += "\n"
        
    state["response"] = response_md
    state["citations"] = []
    state["agent_routed"] = "planner"
    return state

# 4. Routing condition
def router_edge(state: AgentState) -> str:
    return state["next_agent"]

# 5. Build Graph
builder = StateGraph(AgentState)

# Add nodes
builder.add_node("router", route_intent)
builder.add_node("tutor", execute_tutor)
builder.add_node("quiz", execute_quiz)
builder.add_node("planner", execute_planner)

# Set entry point
builder.set_entry_point("router")

# Add conditional edges
builder.add_conditional_edges(
    "router",
    router_edge,
    {
        "tutor": "tutor",
        "quiz": "quiz",
        "planner": "planner"
    }
)

# Connect execution nodes to end
builder.add_edge("tutor", END)
builder.add_edge("quiz", END)
builder.add_edge("planner", END)

# Compile graph
coordinator_graph = builder.compile()

class CoordinatorAgent:
    def chat(self, message: str, api_key: str = None) -> Dict[str, Any]:
        initial_state = {
            "message": message,
            "api_key": api_key,
            "next_agent": "",
            "response": "",
            "citations": [],
            "agent_routed": ""
        }
        
        try:
            result = coordinator_graph.invoke(initial_state)
            return {
                "response": result["response"],
                "citations": result["citations"],
                "agent_routed": result["agent_routed"]
            }
        except Exception as e:
            logger.error(f"Error executing LangGraph coordinator: {e}")
            # Fallback direct call to tutor
            tutor_response = tutor_agent.answer_question(message, api_key)
            return {
                "response": tutor_response["response"],
                "citations": tutor_response["citations"],
                "agent_routed": "tutor"
            }

coordinator_agent = CoordinatorAgent()
