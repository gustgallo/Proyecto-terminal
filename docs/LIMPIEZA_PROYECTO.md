# Limpieza del proyecto PRODISA

Este paquete se generó a partir de `Proyecto Prodisa 06092026.zip` y conserva las mejoras funcionales actuales del frontend y la API PHP.

## Excluido del paquete limpio

- `.git/`: historial y metadatos locales de Git. No forman parte del código fuente entregable.
- `apps/web/node_modules/`: dependencias instaladas. Se regeneran con `npm run install:web`.
- `apps/web/dist/`: build generado. Se regenera con `npm run build`.
- `apps/web/public/api/config/config.local.php`: configuración privada con secretos locales.
- `legacy/`: backend Node/Cloud Run anterior, ya sustituido por la API PHP de GoogieHost.
- `deploy/nginx/`: configuración de Nginx no utilizada por el despliegue actual en GoogieHost.
- `deploy/apache/`: plantilla duplicada; el `.htaccess` activo vive en `apps/web/public/`.
- Recursos gráficos sin referencias en el código actual.

## Correcciones de limpieza

- Se normalizaron nombres de imágenes que habían quedado codificados como `#U00f1` en lugar de `ñ`.
- Se conservó la gestión de usuarios/roles añadida en la versión actual.
- Se restauró el despliegue seguro: los secretos de producción pueden vivir fuera de `public_html` en `prodisa-config.php`.
- El build ejecuta `scripts/postbuild.mjs` para impedir que `config.local.php` termine en `dist`.
- reCAPTCHA v3 conserva límites de tiempo controlados para evitar esperas cercanas al timeout de Axios.

## Instalación de dependencias

Desde la raíz:

```powershell
npm run install:web
```

Después:

```powershell
npm run build
```

No copies `node_modules` entre equipos. Debe instalarse de nuevo con npm.
