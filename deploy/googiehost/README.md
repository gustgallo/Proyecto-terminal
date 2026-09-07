# Despliegue en GoogieHost

1. Importa `database/schema.sql` y `database/seeds.sql` en phpMyAdmin.
2. Edita `apps/web/public/api/config/config.local.php`.
3. Ejecuta `npm run build`.
4. Sube todo el contenido de `apps/web/dist/` a `public_html/`.
5. Verifica `/api/health` y `/api/health/db`.
6. Verifica `/intranet/login`.

La API debe usar `DB_HOST=localhost`.
