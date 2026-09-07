<?php
declare(strict_types=1);

/**
 * Configuración central de la API PHP de PRODISA.
 * Los secretos reales deben ir en config.local.php, que está bloqueado por .htaccess.
 */

$local = [];
$localFile = __DIR__ . '/config.local.php';
if (is_file($localFile)) {
    $loaded = require $localFile;
    if (is_array($loaded)) {
        $local = $loaded;
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
    // Fallback estable para hosting compartido. Puede sustituirse con JWT_SECRET explícito.
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
    ],
    'db' => [
        // En GoogieHost debe permanecer localhost para usar el socket local de MariaDB.
        'host' => (string) $get('DB_HOST', 'localhost'),
        'port' => (int) $get('DB_PORT', 3306),
        'socket' => trim((string) $get('DB_SOCKET', '')),
        'name' => (string) $get('DB_NAME', 'bmosjhel_PRODISA_SWGRHP-IG'),
        'user' => (string) $get('DB_USER', 'bmosjhel_PRODISA_SWGRHP-IG'),
        'password' => $dbPassword,
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
    ],
    'ai' => [
        // URL opcional del microservicio de IA. Puede ser Cloud Run.
        'service_url' => rtrim((string) $get('AI_SERVICE_URL', ''), '/'),
        'shared_secret' => trim((string) $get('AI_SHARED_SECRET', '')),
        'timeout_seconds' => (int) $get('AI_TIMEOUT_SECONDS', 20),
    ],
    'cors' => [
        // Mismo dominio no necesita CORS. Para desarrollo se pueden añadir orígenes separados por coma.
        'origins' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) $get('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000'))
        ))),
    ],
];
