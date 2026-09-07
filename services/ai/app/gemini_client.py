import os
import json
import urllib.request
from app.config import GEMINI_API_KEY

def generate_embedding(text: str) -> list[float]:
    """Genera embedding vectorial usando la API oficial de Google Gemini."""
    if not GEMINI_API_KEY:
        # Retorna vector cero simulación de 768 dimensiones si no hay API Key configurada
        return [0.0] * 768
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={GEMINI_API_KEY}"
    payload = {
        "model": "models/text-embedding-004",
        "content": {"parts": [{"text": text}]}
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get("embedding", {}).get("values", [0.0] * 768)
    except Exception as e:
        print(f"Error generando embedding con Gemini: {e}")
        return [0.0] * 768

def generate_gemini_response(prompt: str, context: str = "") -> str:
    """Genera respuesta usando Gemini 2.5 Flash / 1.5 Flash."""
    if not GEMINI_API_KEY:
        return f"Respuesta contextualizada (Simulación sin GEMINI_API_KEY): De acuerdo con las políticas internas de Prodisa, {context[:150]}..."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    system_instruction = (
        "Eres el Asistente Virtual de Recursos Humanos de Comercializadora Prodisa. "
        "Responde con precisión, cortesía y profesionalismo basándote en el contexto interno proporcionado."
    )
    
    full_prompt = f"{system_instruction}\n\nContexto de documentos internos:\n{context}\n\nPregunta del empleado:\n{prompt}"
    
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}]
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            candidates = result.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "No se pudo generar texto.")
            return "No se pudo obtener respuesta de Gemini."
    except Exception as e:
        print(f"Error al llamar a Gemini generateContent: {e}")
        return f"Error en la API de Gemini. Respuesta basada en contexto disponible: {context[:200]}"
