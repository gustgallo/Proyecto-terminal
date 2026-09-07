<?php
declare(strict_types=1);

function ragKeywords(string $question): array
{
    preg_match_all('/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]+/u', textLower($question), $matches);
    $ignored = [
        'para', 'como', 'qué', 'que', 'con', 'por', 'una', 'uno', 'unos', 'unas', 'del',
        'las', 'los', 'este', 'esta', 'esto', 'tengo', 'puedo', 'sobre', 'desde', 'donde',
        'cuál', 'cual', 'cuando', 'quien', 'quién', 'porque', 'pero', 'más', 'mas'
    ];
    $result = [];
    foreach ($matches[0] ?? [] as $word) {
        if (textLength($word) >= 4 && !in_array($word, $ignored, true)) {
            $result[] = $word;
        }
        if (count($result) >= 8) {
            break;
        }
    }
    return array_values(array_unique($result));
}

function ragContext(PDO $pdo, string $question): string
{
    $keywords = ragKeywords($question);
    $rows = [];

    if ($keywords) {
        $where = implode(' OR ', array_fill(0, count($keywords), 'content LIKE ?'));
        $params = array_map(static fn(string $w): string => '%' . $w . '%', $keywords);
        $rows = dbAll(
            $pdo,
            "SELECT content FROM rag_document_chunks WHERE {$where} ORDER BY created_at DESC LIMIT 5",
            $params
        );
    }

    if (!$rows) {
        $rows = dbAll($pdo, 'SELECT content FROM rag_document_chunks ORDER BY created_at DESC LIMIT 3');
    }

    if (!$rows) {
        return 'Documentación general de RRHH de Prodisa: horas extras, vacaciones, permisos y reglamento interior.';
    }

    return implode("\n---\n", array_map(static fn(array $row): string => (string) $row['content'], $rows));
}

function callAiService(array $config, string $question, int $userId, string $context): ?string
{
    $url = (string) $config['ai']['service_url'];
    if ($url === '') {
        return null;
    }

    $payload = json_encode([
        'question' => $question,
        'user_id' => $userId,
        'context' => $context,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if (!function_exists('curl_init')) {
        return null;
    }

    $curl = curl_init($url . '/api/v1/chat/query');
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => (int) $config['ai']['timeout_seconds'],
        CURLOPT_HTTPHEADER => array_values(array_filter([
            'Content-Type: application/json',
            ((string) ($config['ai']['shared_secret'] ?? '')) !== ''
                ? 'X-Prodisa-AI-Key: ' . (string) $config['ai']['shared_secret']
                : null,
        ])),
    ]);
    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($response === false || $status < 200 || $status >= 300) {
        return null;
    }

    $decoded = json_decode((string) $response, true);
    if (!is_array($decoded)) {
        return null;
    }
    return isset($decoded['answer']) ? trim((string) $decoded['answer']) : null;
}
