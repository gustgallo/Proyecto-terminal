# Validación de la versión 3.1

## Comprobado durante la preparación

- Sintaxis PHP de toda la API: OK.
- Router PHP: `/api/health` responde correctamente.
- Configuración pública: `/api/v1/config/public` responde correctamente.
- `/api/health/db` devuelve 503 de forma controlada mientras `DB_PASSWORD` esté vacío.
- Sintaxis TS/TSX del frontend: sin errores de parseo.
- Sintaxis Python del microservicio de IA: OK.
- El paquete limpio no incluye `config.local.php`, credenciales reales, `node_modules`, `.git` ni el backend Node anterior.

## Validación que debe hacerse en GoogieHost

La conexión real a MariaDB no puede comprobarse fuera del hosting porque el plan gratuito bloquea TCP/3306. Después de configurar `prodisa-config.php` fuera de `public_html` y publicar, verifica:

```text
/api/health
/api/health/db
/intranet/login
```

`/api/health/db` debe indicar `connected: true` y `connectionMode: local/socket`.

## Build frontend

El proyecto incluye `package-lock.json`. Ejecuta en un entorno con acceso a npm:

```bash
npm run install:web
npm run build
```

La carpeta a publicar será `apps/web/dist/`.
