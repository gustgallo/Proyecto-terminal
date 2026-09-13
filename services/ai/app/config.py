"""
============================================================================
CONFIGURACIÓN DEL MICROSERVICIO DE IA EN PYTHON PARA PRODISA
============================================================================
Carga la clave API oficial de Cohere AI y configuraciones del servidor FastAPI.

Comentado en español para desarrolladores Junior.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Clave API oficial de Cohere AI
COHERE_API_KEY = os.getenv("COHERE_API_KEY", "")
AI_SHARED_SECRET = os.getenv("AI_SHARED_SECRET", "")
AI_HOST = os.getenv("AI_HOST", "0.0.0.0")
AI_PORT = int(os.getenv("PORT", os.getenv("AI_PORT", "8000")))
