<?php
declare(strict_types=1);

function base64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string|false
{
    $padding = strlen($data) % 4;
    if ($padding > 0) {
        $data .= str_repeat('=', 4 - $padding);
    }
    return base64_decode(strtr($data, '-_', '+/'), true);
}

function jwtSign(array $payload, string $secret, int $ttlSeconds): string
{
    if ($secret === '') {
        throw new RuntimeException('JWT_SECRET no está configurado.');
    }

    $now = time();
    $payload['iat'] = $now;
    $payload['exp'] = $now + max(300, $ttlSeconds);

    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $segments = [
        base64UrlEncode(json_encode($header, JSON_UNESCAPED_SLASHES)),
        base64UrlEncode(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)),
    ];
    $signature = hash_hmac('sha256', implode('.', $segments), $secret, true);
    $segments[] = base64UrlEncode($signature);
    return implode('.', $segments);
}

function jwtVerify(string $token, string $secret): ?array
{
    if ($secret === '') {
        return null;
    }

    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$headerB64, $payloadB64, $signatureB64] = $parts;
    $headerJson = base64UrlDecode($headerB64);
    $payloadJson = base64UrlDecode($payloadB64);
    $signature = base64UrlDecode($signatureB64);
    if ($headerJson === false || $payloadJson === false || $signature === false) {
        return null;
    }

    $header = json_decode($headerJson, true);
    $payload = json_decode($payloadJson, true);
    if (!is_array($header) || !is_array($payload) || ($header['alg'] ?? '') !== 'HS256') {
        return null;
    }

    $expected = hash_hmac('sha256', $headerB64 . '.' . $payloadB64, $secret, true);
    if (!hash_equals($expected, $signature)) {
        return null;
    }

    if (isset($payload['exp']) && (int) $payload['exp'] < time()) {
        return null;
    }

    return $payload;
}
