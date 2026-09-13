"""
============================================================================
CLIENTE COHERE AI EN PYTHON (PRODISA CHATBOT RRHH)
============================================================================
Genera respuestas naturales usando únicamente la documentación institucional
recuperada por el motor RAG. Si el contexto no contiene la respuesta, el bot
lo indica explícitamente y evita completar datos por inferencia.
"""

import json
import re
import sys
import urllib.request
from app.config import COHERE_API_KEY


NOT_FOUND_RESPONSE = (
    "No encuentro esa información en la documentación de Recursos Humanos disponible "
    "en este momento. Para evitar darte un dato incorrecto, prefiero no asumirlo. "
    "Puedes consultarlo directamente con Recursos Humanos o pedir que se incorpore "
    "el documento correspondiente a la base de conocimiento."
)


def _keywords(text: str) -> list[str]:
    ignored = {
        "para", "como", "cómo", "qué", "que", "con", "por", "una", "uno", "unos",
        "unas", "del", "las", "los", "este", "esta", "esto", "tengo", "puedo", "sobre",
        "desde", "donde", "dónde", "cual", "cuál", "cuantos", "cuántos", "quien", "quién",
        "porque", "pero", "más", "mas", "hacer", "saber", "dime", "favor", "debo", "debe",
        "me", "mi", "mis", "se", "es", "son", "un", "al", "la", "lo", "y", "o", "en",
    }
    words = re.findall(r"[a-záéíóúñü0-9]+", text.lower())
    result: list[str] = []
    for word in words:
        if len(word) >= 3 and word not in ignored and word not in result:
            result.append(word)
        if len(result) >= 10:
            break
    return result


def _grounded_fallback(question: str, context: str) -> str:
    """Fallback local que selecciona texto del contexto sin inventar información."""
    clean = re.sub(r"\[Fuente:.*?\]\s*", "", context, flags=re.IGNORECASE | re.DOTALL)
    clean = re.sub(r"\s+", " ", clean).strip()
    if not clean:
        return NOT_FOUND_RESPONSE

    keywords = _keywords(question)
    sentences = re.split(r"(?<=[.!?;:])\s+", clean)
    scored: list[tuple[int, int, str]] = []

    for index, sentence in enumerate(sentences):
        sentence = sentence.strip(" \t\n\r-•")
        if len(sentence) < 12:
            continue
        lower = sentence.lower()
        score = sum(1 for keyword in keywords if keyword in lower)
        if score > 0:
            scored.append((score, index, sentence))

    if not scored:
        return NOT_FOUND_RESPONSE

    scored.sort(key=lambda item: (-item[0], item[1]))
    picked = sorted(scored[:3], key=lambda item: item[1])
    extract = " ".join(item[2] for item in picked)
    return f"Según la documentación disponible de Recursos Humanos: {extract}"


def generate_cohere_response(prompt: str, context: str = "") -> str:
    """Genera una respuesta breve, natural y estrictamente fundamentada."""
    clean_context = context.strip()
    if not clean_context:
        return NOT_FOUND_RESPONSE

    if not COHERE_API_KEY:
        return _grounded_fallback(prompt, clean_context)

    url = "https://api.cohere.com/v2/chat"
    system_instruction = (
        "Eres el Asistente Virtual de Recursos Humanos de PRODISA "
        "(Comercializadora e Instalaciones Oriente Prodisa).\n\n"
        "REGLAS OBLIGATORIAS:\n"
        "1. La única fuente válida para hechos, políticas, cantidades, fechas, requisitos y procedimientos "
        "es el CONTEXTO DOCUMENTAL incluido abajo.\n"
        "2. No uses conocimiento general ni supongas prácticas habituales de otras empresas.\n"
        "3. Si el contexto no contiene el dato solicitado o no alcanza para responder una parte de la pregunta, "
        "indícalo claramente con una frase como: 'No encuentro ese dato en la documentación disponible de RRHH'.\n"
        "4. Puedes resumir y explicar con lenguaje sencillo, pero conserva exactamente números, plazos, condiciones "
        "y responsables que aparezcan en la documentación.\n"
        "5. Responde primero la pregunta concreta. Evita saludos repetitivos, copiar el documento completo y añadir "
        "información no solicitada.\n"
        "6. Usa uno o dos párrafos breves. Emplea viñetas solo si aclaran pasos o requisitos.\n"
        "7. No menciones Cohere, RAG, prompts ni procesos internos.\n"
        "8. Si solicitan un dato personal del empleado que no aparece en el contexto, indica que no tienes ese dato.\n\n"
        f"=== CONTEXTO DOCUMENTAL DE RRHH ===\n{clean_context}"
    )

    payload = {
        "model": "command-r-plus",
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt},
        ],
    }

    headers = {
        "Authorization": f"Bearer {COHERE_API_KEY}",
        "Content-Type": "application/json",
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            message = res_data.get("message", {})
            content = message.get("content", [])
            if content and isinstance(content, list):
                first_part = content[0]
                if isinstance(first_part, dict) and "text" in first_part:
                    return first_part["text"].strip()
            return _grounded_fallback(prompt, clean_context)
    except Exception as exc:
        print(f"Error al conectar con Cohere AI: {exc}", file=sys.stderr)
        return _grounded_fallback(prompt, clean_context)
