# PRODISA 3.1 - GoogieHost PHP + MariaDB + React

Esta versión elimina la dependencia obligatoria de Cloud Run para la API de datos. Está preparada para el plan gratuito de GoogieHost, donde MariaDB no acepta conexiones remotas por TCP/3306.

## Arquitectura

```text
Navegador
   |
   v
GoogieHost public_html
   |-- React/Vite
   |-- /api  PHP 8 + PDO
   |       |
   |       v
   |   MariaDB localhost/socket
   |
   `-- HTTPS --> Cohere API (chat + reranking semántico)
```

La API PHP y MariaDB se ejecutan en el mismo hosting. `DB_HOST=localhost` permite usar la conexión local que sí está disponible en GoogieHost.

## Cambios principales

- API Node/Express sustituida en producción por una API PHP compatible con GoogieHost.
- Se conservan las rutas `/api/v1/...` para evitar romper el frontend React.
- Acceso a MariaDB mediante PDO y `localhost`, sin Remote MySQL.
- JWT HMAC SHA-256 implementado en PHP para la intranet.
- Contraseñas con bcrypt compatibles con `password_verify()` y `password_hash()`.
- reCAPTCHA v3 integrado en:
  - inicio de sesión de intranet;
  - formulario de contacto;
  - modal de cotización.
- El chatbot RRHH usa un único pipeline desde PHP: recuperación documental local, filtro temático, reranking semántico opcional con Cohere y generación de respuesta con grounding estricto.
- El historial de conversación se usa solo para resolver referencias como "mis días" o "¿y con quién?", nunca como fuente de políticas.
- Si la documentación no contiene evidencia suficiente, el asistente se abstiene de inventar la respuesta.

## Estructura relevante

```text
apps/web/
├─ src/                       React + TypeScript
└─ public/
   ├─ .htaccess               SPA React
   └─ api/
      ├─ .htaccess            router API PHP
      ├─ index.php            front controller
      ├─ config/
      │  ├─ config.php
      │  ├─ config.local.php
      │  └─ config.local.php.example
      └─ src/
         ├─ Auth.php
         ├─ Database.php
         ├─ Http.php
         ├─ Jwt.php
         ├─ Rag.php
         └─ Recaptcha.php

database/
├─ schema.sql
└─ seeds.sql

services/ai/                  opcional, stateless
```

## 1. Preparar MariaDB en GoogieHost

En phpMyAdmin selecciona la base:

```text
bmosjhel_PRODISA_SWGRHP-IG
```

Importa en este orden:

```text
database/schema.sql
database/seeds.sql
```

Si la base ya había sido inicializada con la versión Node anterior, ejecuta además:

```text
database/migration_001_demo_passwords.sql
```

La API PHP también reconoce hashes bcrypt `$2b$` heredados de Node y los migra al formato nativo de PHP después de un inicio de sesión válido.

Las cuentas demo usan temporalmente:

```text

admin@prodisa.com.mx
rrhh@prodisa.com.mx
Contraseña: Admin123!


visualizacion react npm --prefix apps/web run dev
```

Cámbiala después de validar la instalación.

## 2. Configurar la conexión

### Producción en GoogieHost

Los secretos deben permanecer fuera de `public_html`. Copia:

```text
deploy/googiehost/prodisa-config.php.example
```

como `prodisa-config.php` en el nivel inmediatamente superior a `public_html`, y completa ahí las credenciales reales. La API lo detecta automáticamente.

El host debe permanecer:

```php
'DB_HOST' => 'localhost',
```

No uses la IP pública del servidor ni `cloud3.googiehost.com:3306`.

### Desarrollo local

Puedes copiar:

```text
apps/web/public/api/config/config.local.php.example
```

como `config.local.php`. Este archivo está ignorado por Git y el postbuild lo elimina de `dist`.

## 3. Activar Google reCAPTCHA v3

Crea o utiliza una clave reCAPTCHA v3 autorizada para el dominio donde publicarás PRODISA.

En `prodisa-config.php` de producción, o en `config.local.php` solo para desarrollo, configura:

```php
'RECAPTCHA_ENABLED' => true,
'RECAPTCHA_SITE_KEY' => 'TU_SITE_KEY',
'RECAPTCHA_SECRET_KEY' => 'TU_SECRET_KEY',
'RECAPTCHA_MIN_SCORE' => 0.5,
```

La Secret Key permanece únicamente del lado PHP. El frontend obtiene solo la Site Key mediante `/api/v1/config/public`.

No reutilices una clave registrada para otro dominio a menos que ese dominio de PRODISA esté autorizado en la consola de reCAPTCHA.

## 4. Instalar y compilar

Desde la raíz:

```bash
npm run install:web
npm run check:php
npm run build
```

Resultado:

```text
apps/web/dist/
```

Vite copia automáticamente la carpeta `public/api/` al build. Por lo tanto `dist/` contiene tanto React como la API PHP.

## 5. Publicar en GoogieHost

Sube el contenido de:

```text
apps/web/dist/
```

a:

```text
public_html/
```

La estructura final debe incluir:

```text
public_html/
├─ index.html
├─ .htaccess
├─ assets/
└─ api/
   ├─ index.php
   ├─ .htaccess
   ├─ config/
   └─ src/
```

## 6. Pruebas después de publicar

Prueba en el navegador:

```text
https://TU_DOMINIO/api/health
https://TU_DOMINIO/api/health/db
```

El segundo endpoint debe devolver:

```json
{
  "status": "OK",
  "database": "MariaDB/MySQL",
  "connected": true,
  "connectionMode": "local/socket"
}
```

Después prueba:

```text
https://TU_DOMINIO/intranet/login
```

## Desarrollo local

Terminal 1, API PHP:

```bash
npm run dev:api
```

Terminal 2, React:

```bash
npm run dev:web
```

React queda en `http://localhost:3000` y Vite reenvía `/api` a PHP en `http://127.0.0.1:8081`.

Para desarrollo local puedes dejar `RECAPTCHA_ENABLED=false` hasta registrar `localhost` en una clave de prueba.

## IA del Asistente RRHH

El chatbot web utiliza un único pipeline en la API PHP. La clave de Cohere debe permanecer fuera de `public_html`, dentro de `prodisa-config.php`, o como variable de entorno.

```php
'COHERE_API_KEY' => 'TU_COHERE_API_KEY',
'COHERE_CHAT_MODEL' => 'command-r-plus',
'COHERE_RERANK_MODEL' => 'rerank-v3.5',
'COHERE_RERANK_ENABLED' => true,
'COHERE_RERANK_MIN_SCORE' => 0.16,
```

`services/ai/` se conserva únicamente como servicio opcional para pruebas o integraciones futuras. La interfaz web del Asistente RRHH no alterna entre varios motores de respuesta.

## Seguridad

- En producción, `prodisa-config.php` permanece fuera de `public_html`. `config.local.php` se reserva para desarrollo local y no se incluye en Git ni en `dist`.
- La Secret Key de reCAPTCHA nunca se envía a React.
- Las consultas SQL usan prepared statements de PDO.
- La intranet usa tokens JWT firmados.
- El acceso a las rutas administrativas valida roles del usuario.
- No vuelvas a incluir contraseñas reales dentro de `.env`, ZIP públicos o repositorios.

## Validación técnica

Consulta `docs/VALIDACION.md` para ver qué pruebas se realizaron y qué debe verificarse una vez publicado en GoogieHost.


## Despliegues repetibles sin perder secretos

Las credenciales de producción deben guardarse fuera de `public_html` en `prodisa-config.php`. El comando `npm run build` ejecuta `scripts/postbuild.mjs`, que elimina cualquier `config.local.php` del resultado antes de publicar. Consulta `deploy/googiehost/README.md`.
