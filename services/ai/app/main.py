import hmac
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from app.rag_engine import query_rag_knowledge
from app.config import AI_HOST, AI_PORT, AI_SHARED_SECRET

app = FastAPI(
    title="Prodisa Gemini RAG AI Service",
    description=(
        "Microservicio stateless para Chatbot RRHH. El contexto RAG se obtiene "
        "en GoogieHost y se envía por HTTPS a este servicio."
    ),
    version="2.0.0",
)


class QueryRequest(BaseModel):
    question: str
    user_id: int
    context: str = ""


class QueryResponse(BaseModel):
    answer: str
    status: str


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Prodisa AI Microservice",
        "database": "none-stateless",
    }


@app.post("/api/v1/chat/query", response_model=QueryResponse)
def handle_chat_query(
    req: QueryRequest,
    x_prodisa_ai_key: str | None = Header(default=None),
):
    if AI_SHARED_SECRET:
        supplied = x_prodisa_ai_key or ""
        if not hmac.compare_digest(supplied, AI_SHARED_SECRET):
            raise HTTPException(status_code=401, detail="No autorizado")

    if not req.question or req.question.strip() == "":
        raise HTTPException(status_code=400, detail="La pregunta no puede estar vacía")

    answer = query_rag_knowledge(req.question, req.context)
    return QueryResponse(answer=answer, status="success")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=AI_HOST, port=AI_PORT, reload=True)
