# Mejoras del Asistente RRHH Prodisa

## Objetivo

Evitar respuestas irrelevantes o inventadas y hacer que el asistente se comporte como un colaborador de Recursos Humanos que consulta documentación institucional antes de responder.

## Cambios implementados

1. La recuperación ya no depende de coincidencias SQL simples con `LIKE` y palabras genéricas como "solicitar".
2. Se agregó filtro temático para evitar cruces incorrectos, por ejemplo horas extras contra políticas de vacaciones.
3. Se agregó reranking semántico opcional con Cohere sobre los fragmentos candidatos.
4. El sistema distingue entre un documento relacionado y evidencia suficiente para contestar la pregunta concreta.
5. El prompt obliga a abstenerse cuando falta el dato exacto solicitado.
6. El historial reciente de conversación se conserva y se usa solo para resolver referencias conversacionales.
7. Las preguntas que requieren saldo, antigüedad, autorización o estatus personal se identifican y no se responden como si el asistente tuviera acceso a esos datos.
8. Se eliminó del flujo web la cascada de motores Python, microservicio, Cohere v2 y Cohere v1. La API web usa un único pipeline de respuesta.
9. Los fallbacks ya no contienen respuestas de negocio escritas manualmente sobre vacaciones, horas extras o materiales.
10. Los documentos nuevos se fragmentan por párrafos y secciones con solapamiento, en lugar de cortarse mecánicamente cada 800 caracteres.
11. La clave de Cohere dejó de estar escrita en `Rag.php`. Se lee desde la configuración privada.
12. La administración de fuentes documentales solo se muestra dentro de `Asistente RRHH Prodisa` y únicamente a los roles autorizados.
13. La interfaz ya no muestra términos técnicos como RAG, MariaDB o Cohere al empleado durante la conversación.
14. La conversación actual se conserva durante la sesión del navegador y puede reiniciarse con `Nueva conversación`.

## Regla de seguridad de respuestas

El historial sirve para entender el contexto de la conversación, pero no es una fuente de hechos. Solo la documentación recuperada puede respaldar políticas, fechas, cantidades, requisitos, responsables y procedimientos.
