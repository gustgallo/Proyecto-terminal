"""
============================================================================
CLIENTE DE IA (MIGRADO A COHERE AI)
============================================================================
Redirige la generación de respuestas hacia el motor oficial de Cohere AI en Python.

Comentado en español para desarrolladores Junior.
"""

from app.cohere_client import generate_cohere_response

def generate_gemini_response(prompt: str, context: str = "") -> str:
    """Delegación al motor de Cohere AI en Python."""
    return generate_cohere_response(prompt, context)
