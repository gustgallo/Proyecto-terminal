<?php
declare(strict_types=1);

/**
 * Configuración central de la API PHP de PRODISA.
 *
 * Producción GoogieHost:
 *   El archivo de secretos debe vivir FUERA de public_html como:
 *   dirname($_SERVER['DOCUMENT_ROOT']) . '/prodisa-config.php'
 *
 * Desarrollo local:
 *   Puede usarse api/config/config.local.php, pero el build lo elimina de dist.
 */

$local = [];
$configSource = 'environment';

$candidates = [];
$explicitConfig = trim((string) getenv('PRODISA_CONFIG_FILE'));
if ($explicitConfig !== '') {
    $candidates[] = ['path' => $explicitConfig, 'source' => 'explicit'];
}

$documentRoot = trim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''));
if ($documentRoot !== '') {
    $domainPrivateConfig = dirname(rtrim($documentRoot, '/\\')) . DIRECTORY_SEPARATOR . 'prodisa-config.php';
    $candidates[] = ['path' => $domainPrivateConfig, 'source' => 'domain-private'];
}

$home = trim((string) getenv('HOME'));
if ($home !== '') {
    $candidates[] = ['path' => rtrim($home, '/\\') . DIRECTORY_SEPARATOR . 'prodisa-config.php', 'source' => 'home-private'];
}

// Fallback solo para desarrollo local o migración de instalaciones anteriores.
$candidates[] = ['path' => __DIR__ . '/config.local.php', 'source' => 'local-fallback'];

foreach ($candidates as $candidate) {
    $path = (string) $candidate['path'];
    if (!is_file($path) || !is_readable($path)) {
        continue;
    }

    $loaded = require $path;
    if (is_array($loaded)) {
        $local = $loaded;
        $configSource = (string) $candidate['source'];
        break;
    }
}

$get = static function (string $key, mixed $default = null) use ($local): mixed {
    $env = getenv($key);
    if ($env !== false && $env !== '') {
        return $env;
    }
    return array_key_exists($key, $local) ? $local[$key] : $default;
};

$toBool = static function (mixed $value, bool $default = false): bool {
    if ($value === null || $value === '') {
        return $default;
    }
    if (is_bool($value)) {
        return $value;
    }
    return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on', 'si', 'sí'], true);
};

$dbPassword = (string) $get('DB_PASSWORD', '');
$jwtSecret = trim((string) $get('JWT_SECRET', ''));
if ($jwtSecret === '' && $dbPassword !== '') {
    $jwtSecret = hash('sha256', 'prodisa-swgrhp-ig|' . $dbPassword . '|jwt');
}

$recaptchaSiteKey = trim((string) $get('RECAPTCHA_SITE_KEY', ''));
$recaptchaSecretKey = trim((string) $get('RECAPTCHA_SECRET_KEY', ''));
$recaptchaEnabled = $toBool(
    $get('RECAPTCHA_ENABLED', $recaptchaSiteKey !== '' && $recaptchaSecretKey !== ''),
    false
);

return [
    'app' => [
        'name' => 'PRODISA SWGRHP-IG API',
        'environment' => (string) $get('APP_ENV', 'production'),
        'debug' => $toBool($get('APP_DEBUG', false), false),
        'timezone' => (string) $get('APP_TIMEZONE', 'America/Mexico_City'),
        'config_source' => $configSource,
    ],
    'db' => [
        'host' => (string) $get('DB_HOST', 'localhost'),
        'port' => (int) $get('DB_PORT', 3306),
        'socket' => trim((string) $get('DB_SOCKET', '/var/lib/mysql/mysql.sock')),
        'name' => (string) $get('DB_NAME', 'bmosjhel_PRODISA_SWGRHP-IG'),
        'user' => (string) $get('DB_USER', 'bmosjhel_PRODISA_SWGRHP-IG'),
        'password' => $dbPassword,
        'connect_timeout_seconds' => (int) $get('DB_CONNECT_TIMEOUT_SECONDS', 5),
    ],
    'jwt' => [
        'secret' => $jwtSecret,
        'ttl_seconds' => (int) $get('JWT_TTL_SECONDS', 86400),
    ],
    'recaptcha' => [
        'enabled' => $recaptchaEnabled,
        'site_key' => $recaptchaSiteKey,
        'secret_key' => $recaptchaSecretKey,
        'min_score' => (float) $get('RECAPTCHA_MIN_SCORE', 0.5),
        'connect_timeout_seconds' => (int) $get('RECAPTCHA_CONNECT_TIMEOUT_SECONDS', 3),
        'timeout_seconds' => (int) $get('RECAPTCHA_TIMEOUT_SECONDS', 6),
    ],
    'ai' => [
        // La API web usa un único pipeline de IA: recuperación RAG + Cohere v2.
        // La clave debe vivir en prodisa-config.php fuera de public_html o en una variable de entorno.
        'cohere_api_key' => trim((string) $get('COHERE_API_KEY', '')),
        'cohere_chat_model' => trim((string) $get('COHERE_CHAT_MODEL', 'command-r-plus')),
        'cohere_rerank_model' => trim((string) $get('COHERE_RERANK_MODEL', 'rerank-v3.5')),
        'cohere_rerank_enabled' => $toBool($get('COHERE_RERANK_ENABLED', true), true),
        'cohere_rerank_min_score' => (float) $get('COHERE_RERANK_MIN_SCORE', 0.16),
        'service_url' => rtrim((string) $get('AI_SERVICE_URL', ''), '/'),
        'shared_secret' => trim((string) $get('AI_SHARED_SECRET', '')),
        'timeout_seconds' => (int) $get('AI_TIMEOUT_SECONDS', 20),
    ],
    'cors' => [
        'origins' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) $get('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000'))
        ))),
    ],
];
