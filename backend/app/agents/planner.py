import json
import re
import google.generativeai as genai
from app.config import DEFAULT_LLM_MODEL, GEMINI_API_KEY
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class PlannerAgent:
    def generate_plan(
        self,
        subject: str,
        exam_date: str,
        current_level: str,
        daily_hours: float,
        api_key: str = None
    ) -> Dict[str, Any]:
        key = api_key or GEMINI_API_KEY
        
        prompt = (
            "You are an AI Study Planner at The Gen Academy. Your task is to generate "
            f"a customized, comprehensive study plan for the subject '{subject}'.\n"
            f"- Current Student Skill Level: {current_level}\n"
            f"- Available study time: {daily_hours} hours per day\n"
            f"- Target completion / Exam date: {exam_date}\n\n"
            "Create a realistic timeline. Structure the study plan strictly as a JSON object inside a code block. "
            "The JSON must have this schema:\n"
            "{\n"
            "  \"subject\": \"Name of subject\",\n"
            "  \"overview\": \"High level overview of study approach and timeline milestones.\",\n"
            "  \"weekly_goals\": [\n"
            "    { \"week\": 1, \"goal\": \"Main goal for this week\", \"description\": \"Short detail\" }\n"
            "  ],\n"
            "  \"daily_schedule\": [\n"
            "    {\n"
            "      \"day\": \"Day 1\",\n"
            "      \"topic\": \"Topic to learn\",\n"
            "      \"duration\": \"Estimated time in hours\",\n"
            "      \"tasks\": [\n"
            "        \"Read/Review: Topic details\",\n"
            "        \"Practice: Coding exercise or problem solving\",\n"
            "        \"Quiz: Test knowledge\"\n"
            "      ]\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "Provide exactly 7 days of daily schedule for the first week to show as a roadmap, followed by subsequent weekly goals. "
            "Ensure the JSON is completely valid, has double quotes, and does not contain syntax errors. Do not output any other text before or after the JSON code block."
        )

        if not key:
            return self._get_dummy_plan(subject, exam_date, current_level, daily_hours)

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
            logger.error(f"Error generating study plan: {e}")
            return self._get_dummy_plan(subject, exam_date, current_level, daily_hours)

    def _get_dummy_plan(self, subject: str, exam_date: str, level: str, hours: float) -> Dict[str, Any]:
        return {
            "subject": subject,
            "overview": f"This is a preview study plan for '{subject}' targeting {exam_date} at '{level}' level (Demo Mode). Please configure a Gemini API key for fully customized schedules.",
            "weekly_goals": [
                {
                    "week": 1,
                    "goal": f"Establish core concepts of {subject}",
                    "description": "Cover primary components, vocabulary, and simple configurations."
                },
                {
                    "week": 2,
                    "goal": "Build intermediate implementations",
                    "description": "Combine concepts to build fully operational workflows and solve challenges."
                },
                {
                    "week": 3,
                    "goal": "Mock testing and revisions",
                    "description": "Engage in mock exams, review weak subjects, and optimize speed."
                }
            ],
            "daily_schedule": [
                {
                    "day": "Day 1",
                    "topic": "Fundamental Architecture",
                    "duration": f"{hours} hrs",
                    "tasks": [
                        f"Review basic definition of {subject} for 1 hour",
                        "Draw block diagrams of fundamental components",
                        "Complete the introductory quiz in Knowledge Base"
                    ]
                },
                {
                    "day": "Day 2",
                    "topic": "Key Implementation Mechanics",
                    "duration": f"{hours} hrs",
                    "tasks": [
                        "Examine step-by-step code samples of the subject",
                        "Set up a local test environment or mock project",
                        "Verify package setups and connections"
                    ]
                },
                {
                    "day": "Day 3",
                    "topic": "Troubleshooting & Debugging",
                    "duration": f"{hours} hrs",
                    "tasks": [
                        "Intentionally break configs to inspect error logs",
                        "Write unit tests to capture edge cases",
                        "Discuss common pitfalls in community notes"
                    ]
                },
                {
                    "day": "Day 4",
                    "topic": "Hands-on Practical Challenge",
                    "duration": f"{hours} hrs",
                    "tasks": [
                        "Implement a mini project incorporating first 3 days of learnings",
                        "Conduct code reviews or optimize algorithms",
                        "Log outstanding questions for Tutor Chat"
                    ]
                },
                {
                    "day": "Day 5",
                    "topic": "Advanced Extensions",
                    "duration": f"{hours} hrs",
                    "tasks": [
                        "Investigate scaling patterns or third-party integrations",
                        "Optimize memory consumption or latency",
                        "Read modern articles/documentation pages"
                    ]
                },
                {
                    "day": "Day 6",
                    "topic": "Weekly Goal Review",
                    "duration": f"{hours} hrs",
                    "tasks": [
                        "Synthesize notes from Day 1 to Day 5 into a single summary sheet",
                        "Re-take failed quizzes or practice problems",
                        "Configure next week's schedule parameters"
                    ]
                },
                {
                    "day": "Day 7",
                    "topic": "Rest & Reflection",
                    "duration": "0 hrs",
                    "tasks": [
                        "Take a walk, read articles on future trends in the industry",
                        "Prepare questions for the mock interview prep agent"
                    ]
                }
            ]
        }

planner_agent = PlannerAgent()
