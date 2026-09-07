from app.gemini_client import generate_gemini_response


def query_rag_knowledge(question: str, context: str = "") -> str:
    """
    El contexto RAG ya fue recuperado localmente por la API PHP en GoogieHost.
    Este servicio no se conecta directamente a MariaDB, por lo que puede ejecutarse en Cloud Run.
    """
    safe_context = context.strip() or (
        "Documentación general de RRHH de Prodisa: horas extras, vacaciones, "
        "permisos y reglamento interior."
    )
    return generate_gemini_response(question, safe_context)
