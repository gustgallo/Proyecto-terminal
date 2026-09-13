<?php
declare(strict_types=1);

function recaptchaPublicConfig(array $config): array
{
    $recaptcha = $config['recaptcha'];
    return [
        'enabled' => (bool) $recaptcha['enabled'],
        'siteKey' => (bool) $recaptcha['enabled'] ? (string) $recaptcha['site_key'] : '',
        'minScore' => (float) $recaptcha['min_score'],
    ];
}

function verifyRecaptchaV3(array $config, string $token, string $expectedAction): array
{
    $recaptcha = $config['recaptcha'];
    if (!(bool) $recaptcha['enabled']) {
        return ['ok' => true, 'disabled' => true];
    }

    if (trim((string) $recaptcha['site_key']) === '' || trim((string) $recaptcha['secret_key']) === '') {
        return ['ok' => false, 'message' => 'reCAPTCHA v3 está habilitado pero sus claves no están configuradas.'];
    }

    if (trim($token) === '') {
        return ['ok' => false, 'message' => 'No fue posible obtener el token de reCAPTCHA v3. Recarga la página e inténtalo nuevamente.'];
    }

    $postData = http_build_query([
        'secret' => (string) $recaptcha['secret_key'],
        'response' => $token,
        'remoteip' => clientIp(),
    ]);

    $connectTimeout = max(1, (int) ($recaptcha['connect_timeout_seconds'] ?? 3));
    $totalTimeout = max($connectTimeout, (int) ($recaptcha['timeout_seconds'] ?? 6));
    $response = false;

    if (function_exists('curl_init')) {
        $curl = curl_init('https://www.google.com/recaptcha/api/siteverify');
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => $connectTimeout,
            CURLOPT_TIMEOUT => $totalTimeout,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        ]);
        $response = curl_exec($curl);
        if ($response === false) {
            error_log('PRODISA reCAPTCHA cURL: ' . curl_error($curl));
        }
        curl_close($curl);
    } elseif (ini_get('allow_url_fopen')) {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
                'content' => $postData,
                'timeout' => $totalTimeout,
                'ignore_errors' => true,
            ],
        ]);
        $response = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $context);
    }

    if ($response === false || trim((string) $response) === '') {
        return ['ok' => false, 'message' => 'No fue posible comunicarse con Google reCAPTCHA. Inténtalo nuevamente.'];
    }

    $data = json_decode((string) $response, true);
    if (!is_array($data) || empty($data['success'])) {
        return [
            'ok' => false,
            'message' => 'La verificación reCAPTCHA v3 no fue válida.',
            'errorCodes' => is_array($data) ? ($data['error-codes'] ?? []) : [],
        ];
    }

    $action = (string) ($data['action'] ?? '');
    $score = (float) ($data['score'] ?? 0.0);
    if ($action !== $expectedAction) {
        return ['ok' => false, 'message' => 'La acción de reCAPTCHA no corresponde al formulario enviado.'];
    }
    if ($score < (float) $recaptcha['min_score']) {
        return [
            'ok' => false,
            'message' => 'La verificación de seguridad no alcanzó el nivel requerido. Inténtalo nuevamente.',
            'score' => $score,
        ];
    }

    return [
        'ok' => true,
        'score' => $score,
        'action' => $action,
        'hostname' => (string) ($data['hostname'] ?? ''),
    ];
}
