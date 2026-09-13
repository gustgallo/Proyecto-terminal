# Despliegue estable en GoogieHost

## Regla principal

Los secretos de producción NO viven dentro de `public_html` ni dentro de `apps/web/public`.
Así un nuevo `npm run build` y una nueva subida de `dist` no pueden borrar la contraseña de MariaDB, JWT o reCAPTCHA.

## Primera configuración, una sola vez

1. En DirectAdmin abre el directorio del dominio, el nivel inmediatamente superior a `public_html`.
2. Copia `deploy/googiehost/prodisa-config.php.example` con el nombre `prodisa-config.php`.
3. Completa ahí DB_PASSWORD, JWT_SECRET y las claves reCAPTCHA.
4. No subas ese archivo a Git ni a `public_html`.

La API busca automáticamente:

`dirname($_SERVER['DOCUMENT_ROOT']) . '/prodisa-config.php'`

En DirectAdmin normalmente se verá como:

`/home/TU_USUARIO/domains/TU_DOMINIO/prodisa-config.php`

## Cada deploy

```powershell
npm run build
```

Sube el contenido de `apps/web/dist/` a `public_html/`.

El build ejecuta `scripts/postbuild.mjs`, que elimina cualquier `config.local.php` que haya podido copiar Vite a `dist`.

Puedes reemplazar todos los archivos dentro de `public_html` sin tocar `prodisa-config.php`, porque éste se encuentra fuera del directorio público.

## Pruebas después de desplegar

- `/api/health`
- `/api/health/db`
- `/api/config/public`
- `/intranet/login`

## reCAPTCHA

La verificación del servidor tiene límites de tiempo de 3 s para conexión y 6 s en total. Si GoogieHost no puede contactar Google, la API devolverá un error controlado antes del timeout de Axios de 15 s.
