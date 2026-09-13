"""
============================================================================
MOTOR RAG EN PYTHON (PRODISA AI SERVICE)
============================================================================
Procesa la pregunta junto con el contexto recuperado desde MariaDB. Un contexto
vacío significa que no existe respaldo documental suficiente, por lo que no se
completa la respuesta con conocimiento general.
"""

from app.cohere_client import NOT_FOUND_RESPONSE, generate_cohere_response


def query_rag_knowledge(question: str, context: str = "") -> str:
    """Procesa la consulta usando exclusivamente contexto institucional real."""
    safe_context = context.strip()
    if not safe_context:
        return NOT_FOUND_RESPONSE
    return generate_cohere_response(question, safe_context)
