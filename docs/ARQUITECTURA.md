# Arquitectura PRODISA 3.0

## Producción

```text
Cliente web
    |
    | HTTPS
    v
GoogieHost / public_html
    |
    +--> React SPA
    |
    +--> PHP API /api/v1
            |
            +--> PDO localhost/socket --> MariaDB GoogieHost
            |
            `--> HTTPS opcional --> Cloud Run AI --> Gemini
```

## Motivo del cambio

GoogieHost gratuito bloquea las conexiones externas a MariaDB. Por ello una API alojada en Cloud Run no puede abrir una sesión TCP hacia el puerto 3306 del hosting. La API PHP se ejecuta en el mismo servidor que MariaDB y utiliza la conexión local.

## Compatibilidad del frontend

Las rutas se mantuvieron iguales a la API Node anterior:

- `/api/v1/auth/login`
- `/api/v1/contact/quote`
- `/api/v1/projects`
- `/api/v1/overtime`
- `/api/v1/bonuses`
- `/api/v1/requisitions`
- `/api/v1/requests`
- `/api/v1/users`
- `/api/v1/notifications`
- `/api/v1/chat/query`

Esto permite conservar la mayor parte del frontend sin reescribir módulos.

## reCAPTCHA v3

Flujo:

1. React consulta `/api/v1/config/public`.
2. La API responde únicamente con la Site Key y el estado de reCAPTCHA.
3. React ejecuta `grecaptcha.execute()` con la acción correspondiente.
4. El token temporal se envía con el login o la cotización.
5. PHP verifica el token contra Google.
6. PHP comprueba `success`, `action` y `score`.
7. Solo después continúa con autenticación o INSERT.

Acciones:

```text
login
contact_quote
```

## IA

El microservicio de IA es stateless. Ya no abre conexiones a MariaDB. El contexto RAG se recupera desde PHP mediante la tabla `rag_document_chunks` y se envía al microservicio junto con la pregunta.
