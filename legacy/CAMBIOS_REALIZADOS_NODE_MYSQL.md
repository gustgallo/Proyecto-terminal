# Cambios realizados

## Arquitectura

- `apps/web`: frontend React/Vite.
- `apps/api`: única API Node/Express.
- `services/ai`: microservicio FastAPI/Gemini.
- `database`: esquema y semillas MySQL.
- `deploy`: configuraciones de referencia para Apache y Nginx.
- `docs`: documentación técnica.

## Migración MySQL GoogieHost

- Sustituido PostgreSQL por MySQL en toda la API.
- Sustituido `pg` por `mysql2`.
- Sustituido `psycopg2` por `mysql-connector-python` en IA.
- Eliminada la dependencia de `pgvector`.
- Convertido el esquema a InnoDB, `AUTO_INCREMENT`, `TINYINT(1)`, `DATETIME` y `TIMESTAMP`.
- Convertidas consultas con `$1`, `$2` a parámetros `?`.
- Eliminado `RETURNING` y sustituido por `insertId` más consulta posterior cuando se requiere devolver el registro.
- Sustituida concatenación SQL `||` por `CONCAT_WS`.
- Parametrizados filtros que antes interpolaban IDs directamente en SQL.
- Agregado manejo de transacciones MySQL en requisiciones.
- Agregado pool de conexiones y verificación de conectividad al iniciar la API.
- Base predeterminada configurada como `bmosjhel_PRODISA_SWGRHP-IG`.
- Puerto MySQL predeterminado configurado como `3306`.

## RAG

- Los fragmentos RAG permanecen en la base principal MySQL.
- Se agregó índice FULLTEXT sobre el contenido.
- La recuperación actual funciona sin extensiones propietarias de PostgreSQL.
- `embedding_json` permite conservar una ruta de evolución para embeddings.

## Despliegue y seguridad

- El frontend conserva `VITE_API_URL` para producción.
- CORS continúa limitado por `CORS_ORIGINS`.
- `.env.example` contiene los campos requeridos de GoogieHost sin contraseñas reales.
- El `.env` de trabajo contiene marcadores para que el usuario coloque sus credenciales reales.
- El frontend incluye `.htaccess` para React Router en Apache.
