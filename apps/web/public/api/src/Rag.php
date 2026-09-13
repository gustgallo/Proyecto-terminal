<?php
/**
 * ============================================================================
 * RAG RRHH PRODISA
 * ============================================================================
 * Objetivos de este módulo:
 * - Recuperar solo documentación realmente relacionada con la pregunta.
 * - Usar el historial únicamente para resolver referencias conversacionales.
 * - Distinguir entre "hay un documento relacionado" y "hay evidencia suficiente".
 * - Evitar completar datos, responsables, cantidades o procedimientos por inferencia.
 * - Generar respuestas breves y naturales, como un colaborador de RRHH.
 */

declare(strict_types=1);

const RAG_NO_EVIDENCE_TOKEN = '__NO_EVIDENCE__';

/** Normaliza texto para comparación léxica sin modificar el contenido fuente. */
function ragNormalize(string $value): string
{
    $value = textLower($value);
    $value = strtr($value, [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u',
        'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u', 'Ü' => 'u',
    ]);
    $value = preg_replace('/[^a-z0-9ñ\s]+/u', ' ', $value) ?? $value;
    return trim((string) preg_replace('/\s+/u', ' ', $value));
}

/**
 * Palabras útiles para recuperación. Se excluyen conectores y verbos genéricos
 * que provocaban falsos positivos como "solicitar" -> política de vacaciones.
 */
function ragKeywords(string $question): array
{
    preg_match_all('/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]+/u', ragNormalize($question), $matches);

    $ignored = [
        'para', 'como', 'que', 'con', 'por', 'una', 'uno', 'unos', 'unas', 'del', 'las',
        'los', 'este', 'esta', 'esto', 'tengo', 'puedo', 'sobre', 'desde', 'donde', 'cual',
        'cuantos', 'cuantas', 'quien', 'porque', 'pero', 'mas', 'aplica', 'hacer', 'saber',
        'dime', 'favor', 'debo', 'debe', 'me', 'mi', 'mis', 'se', 'es', 'son', 'un', 'al',
        'la', 'lo', 'y', 'o', 'en', 'ya', 'ser', 'sea', 'fue', 'hay', 'quiero', 'necesito',
        'solicitar', 'solicito', 'solicitud', 'procedimiento', 'proceso', 'pasos', 'forma',
        'manera', 'informacion', 'información', 'revisar', 'consultar', 'consulta', 'corresponde',
        'corresponden', 'toca', 'tocan', 'puede', 'podria', 'podría'
    ];

    $result = [];
    foreach ($matches[0] ?? [] as $word) {
        $word = ragNormalize((string) $word);
        if (textLength($word) >= 3 && !in_array($word, $ignored, true)) {
            $result[] = $word;
        }
        if (count($result) >= 16) {
            break;
        }
    }

    return array_values(array_unique($result));
}

/** Temas de negocio usados solo como señal de recuperación, nunca como hechos. */
function ragTopicGroups(): array
{
    return [
        'vacaciones' => ['vacacion', 'vacaciones', 'vacacional', 'descanso vacacional'],
        'horas_extra' => ['hora extra', 'horas extra', 'horas extras', 'tiempo extra', 'extraordinaria', 'extraordinarias'],
        'permisos' => ['permiso', 'permisos', 'ausencia', 'ausencias'],
        'nomina' => ['nomina', 'nómina', 'salario', 'sueldo', 'recibo de nomina', 'pago de nomina'],
        'materiales' => ['requisicion', 'requisición', 'material', 'materiales', 'insumo', 'insumos'],
        'bonificaciones' => ['bonificacion', 'bonificación', 'bonificaciones', 'bono', 'bonos'],
        'incapacidades' => ['incapacidad', 'incapacidades'],
    ];
}

function ragDetectTopics(string $text): array
{
    $normalized = ragNormalize($text);
    $topics = [];

    foreach (ragTopicGroups() as $topic => $aliases) {
        foreach ($aliases as $alias) {
            if (str_contains($normalized, ragNormalize($alias))) {
                $topics[] = $topic;
                break;
            }
        }
    }

    return array_values(array_unique($topics));
}

function ragTopicsMatchCandidate(array $topics, string $candidateText): bool
{
    if (!$topics) {
        return true;
    }

    $normalized = ragNormalize($candidateText);
    $groups = ragTopicGroups();
    foreach ($topics as $topic) {
        foreach ($groups[$topic] ?? [] as $alias) {
            if (str_contains($normalized, ragNormalize($alias))) {
                return true;
            }
        }
    }

    return false;
}

/** Detecta preguntas que probablemente continúan el tema previo. */
function ragIsFollowup(string $question): bool
{
    $q = trim(ragNormalize($question));
    if ($q === '') {
        return false;
    }

    if (textLength($q) <= 48 && count(ragKeywords($q)) <= 3) {
        return true;
    }

    foreach (['entonces', 'en ese caso', 'eso', 'esa', 'ese', 'tambien', 'cuanto', 'cuando', 'con quien', 'y si', 'y para'] as $marker) {
        if (str_starts_with($q, $marker . ' ') || $q === $marker) {
            return true;
        }
    }

    return false;
}

/**
 * El historial sirve para resolver "mis días", "¿y con quién?", etc. No se
 * considera evidencia institucional y nunca sustituye documentos RAG.
 */
function ragBuildRetrievalQuestion(string $question, array $history): string
{
    $question = trim($question);
    if (!$history || !ragIsFollowup($question)) {
        return $question;
    }

    $previousUserMessages = [];
    foreach (array_reverse($history) as $item) {
        if (($item['sender'] ?? '') !== 'USER') {
            continue;
        }
        $content = trim((string) ($item['content'] ?? ''));
        if ($content !== '') {
            $previousUserMessages[] = $content;
        }
        if (count($previousUserMessages) >= 2) {
            break;
        }
    }

    return trim(implode(' ', array_reverse($previousUserMessages)) . ' ' . $question);
}

/** Identifica registros heredados que solo guardaban metadatos del archivo. */
function ragIsMetadataPlaceholder(string $content): bool
{
    $lower = ragNormalize($content);
    $mentionsFileMetadata = str_contains($lower, 'tamano') || str_contains($lower, 'bytes');
    $looksLikeOldStub = str_contains($lower, 'archivo cargado por')
        || str_contains($lower, 'documento oficial de')
        || str_contains($lower, 'extracto del documento institucional');

    return $mentionsFileMetadata && $looksLikeOldStub && textLength($content) < 800;
}

/**
 * Fragmenta respetando párrafos y secciones, con solapamiento pequeño. Evita
 * cortar cada 800 caracteres sin importar el significado del documento.
 */
function ragChunkDocument(string $content, int $targetChars = 1200, int $overlapChars = 180): array
{
    $content = str_replace(["\r\n", "\r"], "\n", trim($content));
    $content = preg_replace('/[ \t]+/u', ' ', $content) ?? $content;
    $blocks = preg_split('/\n{2,}/u', $content) ?: [];

    $chunks = [];
    $current = '';

    $flush = static function () use (&$chunks, &$current, $overlapChars): void {
        $trimmed = trim($current);
        if ($trimmed === '') {
            $current = '';
            return;
        }
        $chunks[] = $trimmed;
        if ($overlapChars > 0 && textLength($trimmed) > $overlapChars) {
            $current = function_exists('mb_substr')
                ? trim((string) mb_substr($trimmed, -$overlapChars, null, 'UTF-8'))
                : trim((string) substr($trimmed, -$overlapChars));
        } else {
            $current = '';
        }
    };

    foreach ($blocks as $block) {
        $block = trim((string) $block);
        if ($block === '') {
            continue;
        }

        // Un párrafo excepcionalmente largo se divide por oraciones antes de acumularse.
        $parts = textLength($block) > $targetChars
            ? (preg_split('/(?<=[.!?;:])\s+/u', $block) ?: [$block])
            : [$block];

        foreach ($parts as $part) {
            $part = trim((string) $part);
            if ($part === '') {
                continue;
            }

            $candidate = $current === '' ? $part : $current . "\n\n" . $part;
            if ($current !== '' && textLength($candidate) > $targetChars) {
                $flush();
                $candidate = $current === '' ? $part : $current . "\n\n" . $part;
            }

            // Si una sola oración sigue siendo enorme, se corta por palabras.
            if (textLength($candidate) > $targetChars * 2) {
                $words = preg_split('/\s+/u', $part) ?: [];
                foreach ($words as $word) {
                    $wordCandidate = trim($current . ' ' . $word);
                    if ($current !== '' && textLength($wordCandidate) > $targetChars) {
                        $flush();
                    }
                    $current = trim($current . ' ' . $word);
                }
            } else {
                $current = $candidate;
            }
        }
    }

    if (trim($current) !== '') {
        $chunks[] = trim($current);
    }

    $unique = [];
    foreach ($chunks as $chunk) {
        if (textLength($chunk) < 20) {
            continue;
        }
        $key = hash('sha256', $chunk);
        $unique[$key] = $chunk;
    }

    return array_values($unique);
}

/** Puntuación léxica con mayor peso en título/categoría y términos temáticos. */
function ragLexicalScore(array $row, array $queryTerms, array $topics, string $retrievalQuestion): array
{
    $title = ragNormalize((string) ($row['title'] ?? ''));
    $category = ragNormalize((string) ($row['category'] ?? ''));
    $content = ragNormalize((string) ($row['content'] ?? ''));
    $combined = trim($title . ' ' . $category . ' ' . $content);

    if ($content === '' || !ragTopicsMatchCandidate($topics, $combined)) {
        return ['score' => 0.0, 'coverage' => 0.0, 'matched' => 0];
    }

    $score = 0.0;
    $matched = 0;
    foreach ($queryTerms as $term) {
        $term = ragNormalize((string) $term);
        if ($term === '') {
            continue;
        }
        $termMatched = false;
        if (str_contains($title, $term)) {
            $score += 4.0;
            $termMatched = true;
        }
        if (str_contains($category, $term)) {
            $score += 2.6;
            $termMatched = true;
        }
        if (str_contains($content, $term)) {
            $score += 1.6;
            $termMatched = true;
        }
        if ($termMatched) {
            $matched++;
        }
    }

    $termCount = max(1, count($queryTerms));
    $coverage = $matched / $termCount;
    $score += $coverage * 4.0;

    // Frases relevantes frecuentes obtienen un bono si aparecen completas.
    $normalizedQuestion = ragNormalize($retrievalQuestion);
    foreach (['horas extras', 'dias de vacaciones', 'saldo de vacaciones', 'requisicion de materiales', 'permiso de ausencia'] as $phrase) {
        if (str_contains($normalizedQuestion, $phrase) && str_contains($combined, $phrase)) {
            $score += 5.0;
        }
    }

    if ($topics) {
        // Una coincidencia temática fuerte permite recuperar sinónimos como
        // "horas extras" vs. "horas extraordinarias" antes del reranking.
        $score += 5.0;
    }

    return ['score' => $score, 'coverage' => $coverage, 'matched' => $matched];
}

/** Reranking semántico opcional mediante Cohere. Si falla, conserva el ranking local. */
function ragCohereRerank(array $config, string $query, array $candidates): array
{
    $apiKey = trim((string) ($config['ai']['cohere_api_key'] ?? ''));
    $enabled = (bool) ($config['ai']['cohere_rerank_enabled'] ?? true);
    if (!$enabled || $apiKey === '' || !function_exists('curl_init') || count($candidates) < 2) {
        return $candidates;
    }

    $documents = array_map(static function (array $item): string {
        return trim((string) ($item['title'] ?? '') . "\n" . (string) ($item['category'] ?? '') . "\n" . (string) ($item['content'] ?? ''));
    }, $candidates);

    $payload = json_encode([
        'model' => (string) ($config['ai']['cohere_rerank_model'] ?? 'rerank-v3.5'),
        'query' => $query,
        'documents' => $documents,
        'top_n' => min(12, count($documents)),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $ch = curl_init('https://api.cohere.com/v2/rerank');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => (int) ($config['ai']['timeout_seconds'] ?? 15),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
    ]);
    $response = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $status < 200 || $status >= 300) {
        return $candidates;
    }

    $decoded = json_decode((string) $response, true);
    $results = $decoded['results'] ?? null;
    if (!is_array($results)) {
        return $candidates;
    }

    $reranked = [];
    foreach ($results as $result) {
        $index = (int) ($result['index'] ?? -1);
        if (!isset($candidates[$index])) {
            continue;
        }
        $item = $candidates[$index];
        $semantic = (float) ($result['relevance_score'] ?? 0.0);
        $item['semantic_score'] = $semantic;
        $item['combined_score'] = ((float) ($item['lexical_score'] ?? 0.0)) + ($semantic * 12.0);
        $reranked[] = $item;
    }

    if (!$reranked) {
        return $candidates;
    }

    usort($reranked, static fn(array $a, array $b): int => ($b['combined_score'] ?? 0) <=> ($a['combined_score'] ?? 0));
    return $reranked;
}


/**
 * Amplía un fragmento con sus vecinos inmediatos. Esto mejora documentos que
 * fueron indexados por versiones anteriores con cortes mecánicos de 800 caracteres.
 */
function ragExpandChunkContext(PDO $pdo, array $item): string
{
    $documentId = (int) ($item['document_id'] ?? 0);
    $chunkIndex = (int) ($item['chunk_index'] ?? 0);
    if ($documentId <= 0) {
        return trim((string) ($item['content'] ?? ''));
    }

    $neighbors = dbAll(
        $pdo,
        "SELECT chunk_index, content
         FROM rag_document_chunks
         WHERE document_id = ? AND chunk_index BETWEEN ? AND ?
         ORDER BY chunk_index ASC",
        [$documentId, max(0, $chunkIndex - 1), $chunkIndex + 1]
    );

    if (!$neighbors) {
        return trim((string) ($item['content'] ?? ''));
    }

    $parts = [];
    foreach ($neighbors as $neighbor) {
        $text = trim((string) ($neighbor['content'] ?? ''));
        if ($text !== '' && !ragIsMetadataPlaceholder($text)) {
            $parts[] = $text;
        }
    }

    return trim(implode("\n\n", array_values(array_unique($parts))));
}

/**
 * Recupera evidencia documental. No usa documentos recientes como relleno.
 * Devuelve metadatos de confianza para separar "relacionado" de "suficiente".
 */
function ragRetrieveEvidence(PDO $pdo, string $question, array $history = [], array $config = []): array
{
    $retrievalQuestion = ragBuildRetrievalQuestion($question, $history);
    $queryTerms = ragKeywords($retrievalQuestion);
    $topics = ragDetectTopics($retrievalQuestion);

    if (!$queryTerms && !$topics) {
        return ['context' => '', 'sources' => [], 'confidence' => 0.0, 'retrieval_query' => $retrievalQuestion];
    }

    // Para una base documental de RRHH el volumen esperado es pequeño/mediano.
    // Recuperamos candidatos activos y aplicamos ranking local + rerank semántico.
    $rows = dbAll(
        $pdo,
        "SELECT c.id AS chunk_id, c.chunk_index, c.content, d.id AS document_id, d.title, d.category
         FROM rag_document_chunks c
         INNER JOIN rag_documents d ON d.id = c.document_id
         WHERE d.is_active = 1
         ORDER BY d.id DESC, c.chunk_index ASC
         LIMIT 1500"
    );

    $candidates = [];
    foreach ($rows as $row) {
        $content = trim((string) ($row['content'] ?? ''));
        if ($content === '' || ragIsMetadataPlaceholder($content)) {
            continue;
        }

        $metrics = ragLexicalScore($row, $queryTerms, $topics, $retrievalQuestion);
        $score = (float) ($metrics['score'] ?? 0.0);
        $coverage = (float) ($metrics['coverage'] ?? 0.0);

        // Rechaza coincidencias demasiado débiles. En preguntas temáticas se exige
        // menos cobertura porque el tema ya actúa como filtro fuerte.
        $minScore = $topics ? 4.5 : 5.8;
        $minCoverage = $topics ? 0.0 : (count($queryTerms) <= 2 ? 0.5 : 0.28);
        if ($score < $minScore || $coverage < $minCoverage) {
            continue;
        }

        $row['lexical_score'] = $score;
        $row['coverage'] = $coverage;
        $row['combined_score'] = $score;
        $candidates[] = $row;
    }

    if (!$candidates) {
        return ['context' => '', 'sources' => [], 'confidence' => 0.0, 'retrieval_query' => $retrievalQuestion];
    }

    usort($candidates, static fn(array $a, array $b): int => ($b['lexical_score'] ?? 0) <=> ($a['lexical_score'] ?? 0));
    $candidates = array_slice($candidates, 0, 30);
    $candidates = ragCohereRerank($config, $retrievalQuestion, $candidates);

    $semanticThreshold = (float) ($config['ai']['cohere_rerank_min_score'] ?? 0.16);
    $selected = [];
    $seenDocuments = [];

    foreach ($candidates as $item) {
        if (isset($item['semantic_score']) && (float) $item['semantic_score'] < $semanticThreshold) {
            continue;
        }

        $docId = (int) ($item['document_id'] ?? 0);
        $perDoc = $seenDocuments[$docId] ?? 0;
        if ($perDoc >= 3) {
            continue;
        }

        $selected[] = $item;
        $seenDocuments[$docId] = $perDoc + 1;
        if (count($selected) >= 6) {
            break;
        }
    }

    if (!$selected) {
        return ['context' => '', 'sources' => [], 'confidence' => 0.0, 'retrieval_query' => $retrievalQuestion];
    }

    $contextParts = [];
    $sources = [];
    foreach ($selected as $item) {
        $title = trim((string) ($item['title'] ?? 'Documento institucional'));
        $category = trim((string) ($item['category'] ?? 'RRHH'));
        $content = ragExpandChunkContext($pdo, $item);
        if ($content === '') {
            continue;
        }
        $contextParts[] = "[Fuente: {$title} | Categoría: {$category}]\n{$content}";
        $sources[$title] = ['title' => $title, 'category' => $category];
    }

    $top = $selected[0];
    $confidence = isset($top['semantic_score'])
        ? min(1.0, max(0.0, (float) $top['semantic_score']))
        : min(1.0, ((float) ($top['coverage'] ?? 0.0)) * 0.7 + min(0.3, ((float) ($top['lexical_score'] ?? 0.0)) / 40));

    return [
        'context' => implode("\n\n---\n\n", $contextParts),
        'sources' => array_values($sources),
        'confidence' => $confidence,
        'retrieval_query' => $retrievalQuestion,
    ];
}

/** Detecta preguntas que necesitan saldo, antigüedad o estatus personal. */
function ragQuestionNeedsPersonalData(string $question): bool
{
    $q = ragNormalize($question);
    $personalMarkers = ['mi saldo', 'mis dias', 'me corresponden', 'me tocan', 'ya puedo', 'mi solicitud', 'mi estatus', 'mi antiguedad', 'tengo disponibles'];
    foreach ($personalMarkers as $marker) {
        if (str_contains($q, $marker)) {
            return true;
        }
    }
    return false;
}

/** Respuesta segura y menos robótica cuando no existe evidencia suficiente. */
function ragNoDocumentationResponse(string $question = ''): string
{
    $q = ragNormalize($question);

    if (str_contains($q, 'quien') || str_contains($q, 'con quien')) {
        return 'No encuentro documentado quién debe atender esa consulta. Prefiero no indicarte un responsable sin respaldo en la información de RRHH.';
    }

    if (ragQuestionNeedsPersonalData($question)) {
        return 'Puedo explicarte la política general, pero con la información disponible no puedo confirmar tu saldo, antigüedad o estatus personal. Prefiero no darte un dato que no esté respaldado por RRHH.';
    }

    if (str_contains($q, 'procedimiento') || str_contains($q, 'proceso') || str_contains($q, 'solicitar') || str_contains($q, 'como')) {
        return 'No tengo documentado ese procedimiento en la información disponible de RRHH. Para no darte pasos incorrectos, prefiero no asumir cómo debe realizarse.';
    }

    if (str_contains($q, 'cuantos') || str_contains($q, 'cuantas') || str_contains($q, 'dias') || str_contains($q, 'monto')) {
        return 'No encuentro información suficiente para determinar esa cantidad con seguridad. Prefiero no darte un número que no esté respaldado por la documentación de RRHH.';
    }

    return 'No encuentro esa información en la documentación disponible de RRHH. Para evitar darte una respuesta incorrecta, prefiero no asumirla.';
}

/** Limpia encabezados Markdown antes de mostrar un fallback local. */
function ragCleanSourceText(string $text): string
{
    $text = preg_replace('/\[Fuente:.*?\]\s*/u', '', $text) ?? $text;
    $text = preg_replace('/(^|\s)#{1,6}\s*/u', '$1', $text) ?? $text;
    $text = str_replace(['---', '**', '__'], ' ', $text);
    return trim((string) preg_replace('/\s+/u', ' ', $text));
}

/**
 * Fallback local conservador. Solo resume frases con cobertura razonable; si no,
 * se abstiene en vez de repetir un fragmento irrelevante.
 */
function formatNaturalRagResponse(string $question, string $rawContext): string
{
    if (trim($rawContext) === '') {
        return ragNoDocumentationResponse($question);
    }

    $clean = ragCleanSourceText($rawContext);
    $keywords = ragKeywords($question);
    $sentences = preg_split('/(?<=[.!?;:])\s+/u', $clean) ?: [];
    $scored = [];

    foreach ($sentences as $index => $sentence) {
        $sentence = trim((string) $sentence, " \t\n\r\0\x0B-•");
        if (textLength($sentence) < 20) {
            continue;
        }
        $normalized = ragNormalize($sentence);
        $score = 0;
        foreach ($keywords as $keyword) {
            if (str_contains($normalized, ragNormalize($keyword))) {
                $score++;
            }
        }
        if ($score >= max(1, min(2, count($keywords)))) {
            $scored[] = ['score' => $score, 'index' => $index, 'text' => $sentence];
        }
    }

    if (!$scored) {
        return ragNoDocumentationResponse($question);
    }

    usort($scored, static fn(array $a, array $b): int => $b['score'] <=> $a['score']);
    $picked = array_slice($scored, 0, 2);
    usort($picked, static fn(array $a, array $b): int => $a['index'] <=> $b['index']);
    $extract = trim(implode(' ', array_map(static fn(array $item): string => $item['text'], $picked)));

    if ($extract === '') {
        return ragNoDocumentationResponse($question);
    }

    return 'La información disponible indica lo siguiente: ' . $extract;
}

/** Historial visible al modelo solo para continuidad de conversación. */
function ragFormatConversationHistory(array $history): string
{
    $lines = [];
    foreach (array_slice($history, -6) as $item) {
        $sender = (string) ($item['sender'] ?? '');
        $content = trim((string) ($item['content'] ?? ''));
        if ($content === '') {
            continue;
        }
        $label = $sender === 'USER' ? 'Empleado' : 'Asistente';
        $lines[] = $label . ': ' . $content;
    }
    return implode("\n", $lines);
}

/**
 * Único generador usado por la API web. Cohere v2 es el motor principal y el
 * fallback local aplica exactamente las mismas reglas de grounding.
 */
function callCohereAiService(array $config, string $question, array $evidence, array $history = []): string
{
    $context = trim((string) ($evidence['context'] ?? ''));
    if ($context === '') {
        return ragNoDocumentationResponse($question);
    }

    $apiKey = trim((string) ($config['ai']['cohere_api_key'] ?? ''));
    if ($apiKey === '' || !function_exists('curl_init')) {
        return formatNaturalRagResponse($question, $context);
    }

    $historyText = ragFormatConversationHistory($history);
    $needsPersonalData = ragQuestionNeedsPersonalData($question) ? 'SÍ' : 'NO';

    $systemPrompt = <<<PROMPT
Eres el Asistente de Recursos Humanos de PRODISA. Debes responder como una persona de RRHH: claro, natural, directo, amable y profesional, sin sonar como un buscador de documentos.

REGLAS DE EVIDENCIA
1. La única fuente válida para hechos, cantidades, fechas, requisitos, responsables y procedimientos es el CONTEXTO DOCUMENTAL.
2. El HISTORIAL sirve únicamente para entender referencias como "mis días", "eso" o "¿y con quién?". Nunca lo uses como fuente de hechos.
3. Antes de responder, verifica internamente que el contexto contenga evidencia directa para lo que pregunta el empleado.
4. Encontrar un documento relacionado NO significa que contenga la respuesta. Si falta el dato exacto solicitado, no lo completes por conocimiento general ni por prácticas comunes.
5. Si el contexto es relacionado pero insuficiente para contestar la pregunta concreta, responde exactamente con el token: __NO_EVIDENCE__
6. Si la consulta requiere datos personales del empleado, como saldo, antigüedad, autorización o estatus, y esos datos no aparecen expresamente en el contexto, no afirmes el resultado personal. Puedes explicar la regla general documentada y aclarar qué dato falta.
7. Conserva exactamente números, plazos, condiciones y responsables que sí estén documentados.

ESTILO
8. Responde primero la pregunta. No empieces con frases repetitivas como "Según la documentación disponible" salvo que realmente ayude a aclarar una limitación.
9. No copies encabezados Markdown, títulos completos ni fragmentos largos del reglamento. Interpreta y resume.
10. Usa lenguaje cotidiano de RRHH. Normalmente uno o dos párrafos. Usa viñetas solo para pasos concretos.
11. No menciones Cohere, RAG, prompts, ranking, base de datos ni procesos internos.
12. No inventes el nombre de un área o responsable si no aparece en la evidencia.

LA PREGUNTA PARECE REQUERIR DATOS PERSONALES: {$needsPersonalData}

HISTORIAL RECIENTE (solo para contexto conversacional, no es evidencia):
{$historyText}

CONTEXTO DOCUMENTAL AUTORIZADO:
{$context}
PROMPT;

    $payload = json_encode([
        'model' => (string) ($config['ai']['cohere_chat_model'] ?? 'command-r-plus'),
        'temperature' => 0.15,
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $question],
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $curl = curl_init('https://api.cohere.com/v2/chat');
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => (int) ($config['ai']['timeout_seconds'] ?? 20),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
    ]);
    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($response === false || $status < 200 || $status >= 300) {
        return formatNaturalRagResponse($question, $context);
    }

    $decoded = json_decode((string) $response, true);
    $answer = trim((string) ($decoded['message']['content'][0]['text'] ?? ''));
    if ($answer === '') {
        return formatNaturalRagResponse($question, $context);
    }

    if (str_contains($answer, RAG_NO_EVIDENCE_TOKEN)) {
        return ragNoDocumentationResponse($question);
    }

    // Defensa final para impedir que el token interno llegue al usuario.
    $answer = str_replace(RAG_NO_EVIDENCE_TOKEN, '', $answer);
    return trim($answer) !== '' ? trim($answer) : ragNoDocumentationResponse($question);
}
