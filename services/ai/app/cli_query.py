#!/usr/bin/env python3
"""
============================================================================
EJECUTOR CLI DE PYTHON EN GOOGIEHOST (LOCAL PYTHON CHATBOT RAG)
============================================================================
Permite a la API PHP de GoogieHost ejecutar este script de Python localmente
mediante la función exec() / shell_exec() sin requerir puertos HTTP abiertos (8000)
ni servicios externos fuera de GoogieHost.

Uso en PHP:
  $cmd = 'python3 ' . escapeshellarg($pythonScriptPath) . ' ' . escapeshellarg($question) . ' ' . escapeshellarg($context);
  $output = shell_exec($cmd);

Comentado en español para desarrolladores Junior.
"""

import sys
import json
import os

# Asegura que el directorio raíz de services/ai esté en el path de Python
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.rag_engine import query_rag_knowledge

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Falta la pregunta del usuario"}))
        sys.exit(1)

    question = sys.argv[1]
    context = sys.argv[2] if len(sys.argv) > 2 else ""

    try:
        answer = query_rag_knowledge(question, context)
        print(json.dumps({
            "status": "success",
            "answer": answer,
            "engine": "Cohere AI Python Local Script (GoogieHost Exec)"
        }, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "error": str(e),
            "answer": f"Error procesando en Python: {str(e)}"
        }, ensure_ascii=False))

if __name__ == "__main__":
    main()
