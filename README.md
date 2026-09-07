# PRODISA 3.0 - GoogieHost PHP + MariaDB + React

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
   `-- HTTPS opcional --> microservicio IA en Cloud Run --> Gemini
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
- El contexto RAG se consulta localmente en MariaDB desde PHP. El microservicio de IA ya no necesita conectarse a la base de GoogieHost.
- La API Node anterior se conserva en `legacy/api-node-cloudrun/` solo como referencia.

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
legacy/api-node-cloudrun/     backend anterior
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
Contraseña: Admin123!
```

Cámbiala después de validar la instalación.

## 2. Configurar la conexión local

Edita:

```text
apps/web/public/api/config/config.local.php
```

El host debe permanecer:

```php
'DB_HOST' => 'localhost',
```

Completa únicamente la contraseña real de MariaDB:

```php
'DB_PASSWORD' => 'TU_PASSWORD',
```

No uses la IP pública del servidor ni `cloud3.googiehost.com:3306` para esta API. En el plan gratuito el acceso remoto está bloqueado.

## 3. Activar Google reCAPTCHA v3

Crea o utiliza una clave reCAPTCHA v3 autorizada para el dominio donde publicarás PRODISA.

En `config.local.php` configura:

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

## Microservicio de IA opcional

`services/ai/` ya no se conecta directamente a MariaDB. La API PHP obtiene el contexto RAG desde GoogieHost y lo envía al microservicio mediante HTTPS.

Configura en `config.local.php`:

```php
'AI_SERVICE_URL' => 'https://TU-SERVICIO-AI.run.app',
'AI_SHARED_SECRET' => 'UN_VALOR_LARGO_Y_ALEATORIO',
```

Configura el mismo `AI_SHARED_SECRET` en Cloud Run. Si el servicio de IA no está configurado, el resto de la intranet sigue funcionando y el módulo de chat muestra un mensaje de contingencia.

## Seguridad

- `api/config/config.local.php` está protegido por `.htaccess` y debe conservarse fuera de Git.
- La Secret Key de reCAPTCHA nunca se envía a React.
- Las consultas SQL usan prepared statements de PDO.
- La intranet usa tokens JWT firmados.
- El acceso a las rutas administrativas valida roles del usuario.
- No vuelvas a incluir contraseñas reales dentro de `.env`, ZIP públicos o repositorios.

## Validación técnica

Consulta `docs/VALIDACION.md` para ver qué pruebas se realizaron y qué debe verificarse una vez publicado en GoogieHost.
