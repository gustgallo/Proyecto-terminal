import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
AI_SHARED_SECRET = os.getenv("AI_SHARED_SECRET", "")
AI_HOST = os.getenv("AI_HOST", "0.0.0.0")
AI_PORT = int(os.getenv("PORT", os.getenv("AI_PORT", "8000")))
