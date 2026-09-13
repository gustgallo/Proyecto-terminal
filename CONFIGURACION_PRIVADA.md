# Configuración privada no incluida

Por seguridad, este paquete no incluye credenciales reales ni archivos privados.

Conserva tu archivo de producción `prodisa-config.php` fuera de `public_html` y agrega estas claves si todavía no existen:

```php
'COHERE_API_KEY' => 'TU_CLAVE_REAL',
'COHERE_CHAT_MODEL' => 'command-r-plus',
'COHERE_RERANK_MODEL' => 'rerank-v3.5',
'COHERE_RERANK_ENABLED' => true,
'COHERE_RERANK_MIN_SCORE' => 0.16,
```

Para desarrollo local puedes copiar `apps/web/public/api/config/config.local.php.example` como `config.local.php` y completar los valores privados.
