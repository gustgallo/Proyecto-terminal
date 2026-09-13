"""
============================================================================
MICROSERVICIO PYTHON FASTAPI CON COHERE AI & RAG (PRODISA AI SERVICE)
============================================================================
Servicio REST en Python (FastAPI / Uvicorn) que recibe consultas del Chatbot RRHH
y procesa la generación de respuestas mediante Cohere AI API v2 (`command-r-plus`).

Endpoints principales:
  - GET  /health : Verificación de salud del microservicio Python.
  - POST /api/v1/chat/query : Procesa la consulta RAG y retorna la respuesta de Cohere.

Comentado en español para desarrolladores Junior.
"""

import hmac
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from app.rag_engine import query_rag_knowledge
from app.config import AI_HOST, AI_PORT, AI_SHARED_SECRET

app = FastAPI(
    title="Prodisa Cohere RAG AI Python Service",
    description=(
        "Microservicio en Python para el Chatbot de Recursos Humanos de PRODISA. "
        "Utiliza la API oficial de Cohere AI con el token institucional."
    ),
    version="2.1.0",
)


class QueryRequest(BaseModel):
    question: str
    user_id: int = 1
    context: str = ""


class QueryResponse(BaseModel):
    answer: str
    status: str
    engine: str = "Cohere AI (Python Service)"


@app.get("/health")
def health_check():
    """Verifica que el servicio Python FastAPI esté operativo."""
    return {
        "status": "healthy",
        "service": "Prodisa Cohere AI Python Microservice",
        "engine": "Cohere command-r-plus API",
    }


@app.post("/api/v1/chat/query", response_model=QueryResponse)
def handle_chat_query(
    req: QueryRequest,
    x_prodisa_ai_key: str | None = Header(default=None),
):
    """
    Endpoint principal consumido por la intranet para procesar consultas con Cohere AI.
    """
    if AI_SHARED_SECRET:
        supplied = x_prodisa_ai_key or ""
        if not hmac.compare_digest(supplied, AI_SHARED_SECRET):
            raise HTTPException(status_code=401, detail="No autorizado")

    if not req.question or req.question.strip() == "":
        raise HTTPException(status_code=400, detail="La pregunta no puede estar vacía")

    answer = query_rag_knowledge(req.question, req.context)
    return QueryResponse(answer=answer, status="success", engine="Cohere AI (Python Service)")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=AI_HOST, port=AI_PORT, reload=True)
