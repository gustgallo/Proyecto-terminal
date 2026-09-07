<?php
declare(strict_types=1);

$config = require __DIR__ . '/config/config.php';
date_default_timezone_set((string) $config['app']['timezone']);

require_once __DIR__ . '/src/Http.php';
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/Jwt.php';
require_once __DIR__ . '/src/Auth.php';
require_once __DIR__ . '/src/Recaptcha.php';
require_once __DIR__ . '/src/Rag.php';

header_remove('X-Powered-By');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-store');

$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin !== '' && in_array($origin, $config['cors']['origins'], true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
}

if (requestMethod() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = requestMethod();
$path = requestPath();

function validateEmailValue(mixed $value): ?string
{
    $email = trim((string) $value);
    return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
}

function mysqlDateTime(string $value): ?string
{
    try {
        $date = new DateTime($value);
        return $date->format('Y-m-d H:i:s');
    } catch (Throwable) {
        return null;
    }
}

function boolValue(mixed $value): bool
{
    return $value === true || $value === 1 || $value === '1' || strtolower((string) $value) === 'true';
}

try {
    // Health checks sin depender de /api/v1.
    if ($method === 'GET' && ($path === '/health' || $path === '/')) {
        jsonResponse([
            'status' => 'OK',
            'system' => $config['app']['name'],
            'database' => 'MariaDB/MySQL local GoogieHost',
            'environment' => $config['app']['environment'],
            'time' => date(DATE_ATOM),
        ]);
    }

    if ($method === 'GET' && $path === '/health/db') {
        try {
            $pdo = Database::connection($config);
            $row = dbOne($pdo, 'SELECT DATABASE() AS db_name, VERSION() AS db_version');
            jsonResponse([
                'status' => 'OK',
                'database' => 'MariaDB/MySQL',
                'connected' => true,
                'databaseName' => $row['db_name'] ?? null,
                'version' => $row['db_version'] ?? null,
                'connectionMode' => strtolower((string) $config['db']['host']) === 'localhost' ? 'local/socket' : 'tcp',
            ]);
        } catch (Throwable $e) {
            jsonResponse([
                'status' => 'ERROR',
                'database' => 'MariaDB/MySQL',
                'connected' => false,
                'configured' => trim((string) $config['db']['password']) !== '',
            ], 503);
        }
    }

    if ($method === 'GET' && $path === '/config/public') {
        jsonResponse([
            'recaptcha' => recaptchaPublicConfig($config),
            'api' => ['version' => '3.0.0-php-googiehost'],
        ]);
    }

    // A partir de aquí se requiere base de datos.
    $pdo = Database::connection($config);

    // AUTH LOGIN + reCAPTCHA v3.
    if ($method === 'POST' && $path === '/auth/login') {
        $body = requestJson();
        $email = validateEmailValue($body['email'] ?? null);
        $password = (string) ($body['password'] ?? '');
        if ($email === null || strlen($password) < 6) {
            jsonResponse(['error' => 'Datos de ingreso inválidos'], 400);
        }

        $captcha = verifyRecaptchaV3($config, (string) ($body['recaptchaToken'] ?? ''), 'login');
        if (empty($captcha['ok'])) {
            jsonResponse(['error' => $captcha['message'] ?? 'Verificación de seguridad inválida.'], 400);
        }

        $user = dbOne(
            $pdo,
            "SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone, u.department, u.is_active,
                    r.code AS role_code, r.name AS role_name, r.user_type
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE u.email = ?
             LIMIT 1",
            [$email]
        );

        if (!$user || !boolValue($user['is_active'] ?? false)) {
            jsonResponse(['error' => $user ? 'Usuario desactivado. Contacta a administración.' : 'Credenciales inválidas.'], $user ? 403 : 401);
        }
        if (!verifyPasswordCompat($password, (string) $user['password_hash'])) {
            jsonResponse(['error' => 'Credenciales inválidas.'], 401);
        }

        // Migra automáticamente hashes bcrypt heredados de Node al formato nativo de PHP.
        if (shouldRehashPassword((string) $user['password_hash'])) {
            $newHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
            dbExecute($pdo, 'UPDATE users SET password_hash = ? WHERE id = ?', [$newHash, (int) $user['id']]);
        }

        $permissionsRows = [];
        if (!empty($user['role_code'])) {
            $permissionsRows = dbAll(
                $pdo,
                "SELECT p.code
                 FROM permissions p
                 JOIN role_permissions rp ON p.id = rp.permission_id
                 JOIN roles r ON rp.role_id = r.id
                 WHERE r.code = ?",
                [$user['role_code']]
            );
        }
        $permissions = array_values(array_map(static fn(array $r): string => (string) $r['code'], $permissionsRows));

        $token = jwtSign([
            'id' => (int) $user['id'],
            'email' => (string) $user['email'],
            'roleCode' => (string) ($user['role_code'] ?? ''),
            'userType' => (string) ($user['user_type'] ?? ''),
            'permissions' => $permissions,
        ], (string) $config['jwt']['secret'], (int) $config['jwt']['ttl_seconds']);

        jsonResponse([
            'message' => 'Inicio de sesión exitoso',
            'token' => $token,
            'user' => [
                'id' => (int) $user['id'],
                'email' => $user['email'],
                'firstName' => $user['first_name'],
                'lastName' => $user['last_name'],
                'phone' => $user['phone'],
                'department' => $user['department'],
                'roleCode' => $user['role_code'],
                'roleName' => $user['role_name'],
                'userType' => $user['user_type'],
                'permissions' => $permissions,
            ],
        ]);
    }

    // CONTACTO / COTIZACIONES + reCAPTCHA v3.
    if ($method === 'POST' && $path === '/contact/quote') {
        $body = requestJson();
        $fullName = trim((string) ($body['fullName'] ?? ''));
        $companyName = trim((string) ($body['companyName'] ?? ''));
        $email = validateEmailValue($body['email'] ?? null);
        $privacyAccepted = boolValue($body['privacyAccepted'] ?? false);

        if (textLength($fullName) < 2 || textLength($companyName) < 2 || $email === null || !$privacyAccepted) {
            jsonResponse(['error' => 'Datos de cotización inválidos'], 400);
        }

        $captcha = verifyRecaptchaV3($config, (string) ($body['recaptchaToken'] ?? ''), 'contact_quote');
        if (empty($captcha['ok'])) {
            jsonResponse(['error' => $captcha['message'] ?? 'Verificación de seguridad inválida.'], 400);
        }

        $stmt = $pdo->prepare(
            "INSERT INTO leads_cotizaciones
             (full_name, company_name, email, phone, solution_type, project_description, privacy_accepted)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $fullName,
            $companyName,
            $email,
            trim((string) ($body['phone'] ?? '')) ?: null,
            trim((string) ($body['solutionType'] ?? '')) ?: 'General B2B',
            trim((string) ($body['projectDescription'] ?? '')) ?: null,
            1,
        ]);
        $lead = dbOne($pdo, 'SELECT * FROM leads_cotizaciones WHERE id = ?', [(int) $pdo->lastInsertId()]);
        jsonResponse([
            'message' => 'Solicitud de cotización recibida con éxito. Un ejecutivo comercial se pondrá en contacto pronto.',
            'lead' => $lead,
        ], 201);
    }

    if ($method === 'GET' && $path === '/contact/leads') {
        $user = requireAuth($config);
        requireRole($user, ['ADMIN_GLOBAL', 'ADMIN_RRHH', 'MESA_CONTROL']);
        jsonResponse(['leads' => dbAll($pdo, 'SELECT * FROM leads_cotizaciones ORDER BY created_at DESC')]);
    }

    // PROYECTOS: acceso autenticado; el frontend público no consume esta ruta.
    if ($method === 'GET' && $path === '/projects') {
        requireAuth($config);
        $rows = dbAll(
            $pdo,
            "SELECT p.*, CONCAT_WS(' ', u.first_name, u.last_name) AS creator_name
             FROM projects p
             LEFT JOIN users u ON p.created_by = u.id
             ORDER BY p.created_at DESC"
        );
        jsonResponse(['projects' => $rows]);
    }

    if ($method === 'POST' && $path === '/projects') {
        $user = requireAuth($config);
        requireRole($user, ['ADMIN_GLOBAL', 'PRODUCCION', 'MESA_CONTROL']);
        $body = requestJson();
        $code = trim((string) ($body['code'] ?? ''));
        $name = trim((string) ($body['name'] ?? ''));
        $clientName = trim((string) ($body['clientName'] ?? ''));
        $status = (string) ($body['status'] ?? 'PLANIFICACION');
        $allowedStatus = ['PLANIFICACION', 'EN_PROCESO', 'INSTALACION', 'COMPLETADO', 'MANTENIMIENTO'];
        if (strlen($code) < 3 || textLength($name) < 3 || textLength($clientName) < 2 || !in_array($status, $allowedStatus, true)) {
            jsonResponse(['error' => 'Datos de proyecto inválidos'], 400);
        }
        $stmt = $pdo->prepare(
            "INSERT INTO projects (code, name, client_name, sector, description, status, start_date, estimated_end_date, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $code, $name, $clientName,
            trim((string) ($body['sector'] ?? '')) ?: null,
            trim((string) ($body['description'] ?? '')) ?: null,
            $status,
            trim((string) ($body['startDate'] ?? '')) ?: null,
            trim((string) ($body['estimatedEndDate'] ?? '')) ?: null,
            (int) $user['id'],
        ]);
        $project = dbOne($pdo, 'SELECT * FROM projects WHERE id = ?', [(int) $pdo->lastInsertId()]);
        jsonResponse(['message' => 'Proyecto creado exitosamente.', 'project' => $project], 201);
    }

    // HORAS EXTRAS.
    if ($method === 'POST' && $path === '/overtime') {
        $user = requireAuth($config);
        $body = requestJson();
        $start = mysqlDateTime((string) ($body['startDateTime'] ?? ''));
        $end = mysqlDateTime((string) ($body['endDateTime'] ?? ''));
        $justification = trim((string) ($body['justification'] ?? ''));
        if ($start === null || $end === null || textLength($justification) < 5) {
            jsonResponse(['error' => 'Datos de horas extras inválidos'], 400);
        }
        $startTs = strtotime($start);
        $endTs = strtotime($end);
        if ($endTs <= $startTs) {
            jsonResponse(['error' => 'La fecha y hora de fin debe ser posterior a la de inicio.'], 400);
        }
        $hours = round(($endTs - $startTs) / 3600, 2);
        $stmt = $pdo->prepare(
            "INSERT INTO overtime_records
             (user_id, project_id, start_date_time, end_date_time, hours_count, approved_hours_count, justification, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE_JEFE')"
        );
        $stmt->execute([
            (int) $user['id'],
            !empty($body['projectId']) ? (int) $body['projectId'] : null,
            $start, $end, $hours, $hours, $justification,
        ]);
        $record = dbOne($pdo, 'SELECT * FROM overtime_records WHERE id = ?', [(int) $pdo->lastInsertId()]);
        jsonResponse(['message' => 'Registro de horas extras enviado a revisión', 'record' => $record], 201);
    }

    if ($method === 'GET' && $path === '/overtime') {
        $user = requireAuth($config);
        $role = (string) ($user['roleCode'] ?? '');
        $managerRoles = ['ADMIN_GLOBAL', 'ADMIN_RRHH', 'PRODUCCION', 'MESA_CONTROL'];
        $sql = "SELECT o.*,
                       CONCAT_WS(' ', u.first_name, u.last_name) AS employee_name, u.email AS employee_email, u.department,
                       p.name AS project_name, p.code AS project_code,
                       CONCAT_WS(' ', ja.first_name, ja.last_name) AS area_boss_name,
                       CONCAT_WS(' ', rh.first_name, rh.last_name) AS rrhh_name
                FROM overtime_records o
                JOIN users u ON o.user_id = u.id
                LEFT JOIN projects p ON o.project_id = p.id
                LEFT JOIN users ja ON o.reviewed_by_area = ja.id
                LEFT JOIN users rh ON o.reviewed_by_rrhh = rh.id";
        $params = [];
        if (!in_array($role, $managerRoles, true)) {
            $sql .= ' WHERE o.user_id = ?';
            $params[] = (int) $user['id'];
        }
        $sql .= ' ORDER BY o.created_at DESC';
        $records = dbAll($pdo, $sql, $params);

        $statsSql = "SELECT COALESCE(SUM(hours_count), 0) AS total_requested_hours,
                            COALESCE(SUM(CASE WHEN status = 'APROBADO' THEN COALESCE(approved_hours_count, hours_count) ELSE 0 END), 0) AS total_approved_hours,
                            COALESCE(SUM(CASE WHEN status = 'RECHAZADO' THEN hours_count ELSE 0 END), 0) AS total_rejected_hours,
                            COALESCE(SUM(CASE WHEN status IN ('PENDIENTE_JEFE', 'PENDIENTE_RRHH') THEN hours_count ELSE 0 END), 0) AS total_pending_hours,
                            COUNT(*) AS total_records_count
                     FROM overtime_records";
        $statsParams = [];
        if (!in_array($role, $managerRoles, true)) {
            $statsSql .= ' WHERE user_id = ?';
            $statsParams[] = (int) $user['id'];
        }
        jsonResponse(['records' => $records, 'dashboardStats' => dbOne($pdo, $statsSql, $statsParams)]);
    }

    if ($method === 'PATCH' && preg_match('#^/overtime/(\d+)/approve-area$#', $path, $m)) {
        $user = requireAuth($config);
        requireRole($user, ['ADMIN_GLOBAL', 'PRODUCCION']);
        $body = requestJson();
        $id = (int) $m[1];
        $record = dbOne($pdo, 'SELECT * FROM overtime_records WHERE id = ?', [$id]);
        if (!$record) jsonResponse(['error' => 'Registro de horas extras no encontrado.'], 404);
        $approved = isset($body['approvedHoursCount']) && (float) $body['approvedHoursCount'] > 0
            ? (float) $body['approvedHoursCount'] : (float) $record['hours_count'];
        $modified = abs($approved - (float) $record['hours_count']) > 0.001;
        dbExecute($pdo,
            "UPDATE overtime_records SET status='PENDIENTE_RRHH', reviewed_by_area=?, area_boss_notes=?, approved_hours_count=? WHERE id=?",
            [(int) $user['id'], trim((string) ($body['areaNotes'] ?? '')) ?: 'Visto bueno otorgado por Jefe de Área', $approved, $id]
        );
        $title = $modified ? 'Horas Extras Modificadas por Jefe' : 'Horas Extras Pre-Aprobadas';
        $dateLabel = date('d/m/Y', strtotime((string) $record['start_date_time']));
        $message = $modified
            ? "Tus horas extras del {$dateLabel} fueron modificadas de {$record['hours_count']} hrs a {$approved} hrs por el Jefe Directo."
            : "Tus horas extras del {$dateLabel} ({$approved} hrs) fueron pre-aprobadas por el Jefe Directo y pasaron a RRHH.";
        dbExecute($pdo, 'INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,?)', [(int)$record['user_id'],$title,$message,$modified?'OVERTIME_MODIFIED':'OVERTIME_APPROVED']);
        jsonResponse(['message' => 'Horas extras pre-aprobadas por el Jefe Directo. Notificación enviada al empleado.', 'record' => dbOne($pdo, 'SELECT * FROM overtime_records WHERE id=?', [$id])]);
    }

    if ($method === 'PATCH' && preg_match('#^/overtime/(\d+)/approve-rrhh$#', $path, $m)) {
        $user = requireAuth($config);
        requireRole($user, ['ADMIN_GLOBAL', 'ADMIN_RRHH']);
        $body = requestJson();
        $id = (int) $m[1];
        $record = dbOne($pdo, 'SELECT * FROM overtime_records WHERE id=?', [$id]);
        if (!$record) jsonResponse(['error' => 'Registro no encontrado.'], 404);
        $approved = isset($body['approvedHoursCount']) && (float) $body['approvedHoursCount'] > 0
            ? (float) $body['approvedHoursCount']
            : (float) ($record['approved_hours_count'] ?: $record['hours_count']);
        dbExecute($pdo,
            "UPDATE overtime_records SET status='APROBADO', reviewed_by_rrhh=?, rrhh_notes=?, approved_hours_count=? WHERE id=?",
            [(int)$user['id'], trim((string)($body['rrhhNotes'] ?? '')) ?: 'Autorizado totalmente para pago en nómina por RRHH', $approved, $id]
        );
        dbExecute($pdo, "INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'OVERTIME_APPROVED')", [(int)$record['user_id'],'¡Horas Extras Aprobadas por RRHH!',"Tus horas extras ({$approved} hrs) han sido autorizadas totalmente por Recursos Humanos."]);
        jsonResponse(['message' => 'Horas extras APROBADAS en su totalidad por RRHH.', 'record' => dbOne($pdo, 'SELECT * FROM overtime_records WHERE id=?', [$id])]);
    }

    if ($method === 'PATCH' && preg_match('#^/overtime/(\d+)/reject$#', $path, $m)) {
        $user = requireAuth($config);
        requireRole($user, ['ADMIN_GLOBAL', 'ADMIN_RRHH', 'PRODUCCION']);
        $body = requestJson();
        $id = (int) $m[1];
        $record = dbOne($pdo, 'SELECT * FROM overtime_records WHERE id=?', [$id]);
        if (!$record) jsonResponse(['error' => 'Registro no encontrado'], 404);
        $reason = trim((string)($body['rejectionReason'] ?? '')) ?: 'No cumple con los criterios requeridos';
        $field = (($user['roleCode'] ?? '') === 'PRODUCCION') ? 'area_boss_notes' : 'rrhh_notes';
        dbExecute($pdo, "UPDATE overtime_records SET status='RECHAZADO', {$field}=? WHERE id=?", [$reason, $id]);
        $dateLabel = date('d/m/Y', strtotime((string)$record['start_date_time']));
        dbExecute($pdo, "INSERT INTO notifications (user_id,title,message,type) VALUES (?,?,?,'OVERTIME_REJECTED')", [(int)$record['user_id'],'Horas Extras Rechazadas',"Tus horas extras del {$dateLabel} fueron rechazadas. Motivo: {$reason}."]);
        jsonResponse(['message' => 'Horas extras RECHAZADAS. Se notificó al empleado.', 'record' => dbOne($pdo, 'SELECT * FROM overtime_records WHERE id=?', [$id])]);
    }

    // BONIFICACIONES.
    if ($method === 'GET' && $path === '/bonuses') {
        $user = requireAuth($config);
        $sql = "SELECT b.*, CONCAT_WS(' ',u.first_name,u.last_name) AS employee_name, u.email AS employee_email,
                       p.name AS project_name, p.code AS project_code,
                       CONCAT_WS(' ',ab.first_name,ab.last_name) AS assigned_by_name
                FROM bonuses b
                JOIN users u ON b.user_id=u.id
                LEFT JOIN projects p ON b.project_id=p.id
                LEFT JOIN users ab ON b.assigned_by=ab.id";
        $params = [];
        if (!in_array((string)$user['roleCode'], ['ADMIN_GLOBAL','ADMIN_RRHH'], true)) {
            $sql .= ' WHERE b.user_id=?';
            $params[] = (int)$user['id'];
        }
        $sql .= ' ORDER BY b.created_at DESC';
        jsonResponse(['bonuses' => dbAll($pdo, $sql, $params)]);
    }

    if ($method === 'POST' && $path === '/bonuses') {
        $user = requireAuth($config);
        requireRole($user, ['ADMIN_GLOBAL','ADMIN_RRHH']);
        $body = requestJson();
        $userId = (int)($body['userId'] ?? 0);
        $amount = (float)($body['amount'] ?? 0);
        $reason = trim((string)($body['reason'] ?? ''));
        if ($userId <= 0 || $amount <= 0 || textLength($reason) < 5) jsonResponse(['error'=>'Datos de bonificación inválidos'],400);
        $bonusDate = trim((string)($body['bonusDate'] ?? '')) ?: date('Y-m-d');
        $stmt=$pdo->prepare("INSERT INTO bonuses (user_id,project_id,amount,reason,bonus_date,status,assigned_by) VALUES (?,?,?,?,?,'PENDIENTE',?)");
        $stmt->execute([$userId,!empty($body['projectId'])?(int)$body['projectId']:null,$amount,$reason,$bonusDate,(int)$user['id']]);
        jsonResponse(['message'=>'Bonificación asignada exitosamente.','bonus'=>dbOne($pdo,'SELECT * FROM bonuses WHERE id=?',[(int)$pdo->lastInsertId()])],201);
    }

    // REQUISICIONES DE MATERIALES.
    if ($method === 'GET' && $path === '/requisitions') {
        requireAuth($config);
        $rows=dbAll($pdo,"SELECT mr.*, CONCAT_WS(' ',u.first_name,u.last_name) AS requested_by_name,
                               p.name AS project_name,p.code AS project_code,
                               (SELECT COUNT(*) FROM material_requisition_items mri WHERE mri.requisition_id=mr.id) AS total_items
                        FROM material_requisitions mr
                        JOIN users u ON mr.requested_by=u.id
                        JOIN projects p ON mr.project_id=p.id
                        ORDER BY mr.created_at DESC");
        jsonResponse(['requisitions'=>$rows]);
    }

    if ($method === 'GET' && preg_match('#^/requisitions/(\d+)$#',$path,$m)) {
        requireAuth($config);
        $id=(int)$m[1];
        $header=dbOne($pdo,"SELECT mr.*, CONCAT_WS(' ',u.first_name,u.last_name) AS requested_by_name,p.name AS project_name
                            FROM material_requisitions mr JOIN users u ON mr.requested_by=u.id JOIN projects p ON mr.project_id=p.id WHERE mr.id=?",[$id]);
        if(!$header) jsonResponse(['error'=>'Requisición no encontrada'],404);
        jsonResponse(['requisition'=>$header,'items'=>dbAll($pdo,'SELECT * FROM material_requisition_items WHERE requisition_id=?',[$id])]);
    }

    if ($method === 'POST' && $path === '/requisitions') {
        $user=requireAuth($config);
        $body=requestJson();
        $projectId=(int)($body['projectId']??0);
        $department=trim((string)($body['department']??''));
        $items=is_array($body['items']??null)?$body['items']:[];
        if($projectId<=0||textLength($department)<2||count($items)<1) jsonResponse(['error'=>'Datos de requisición inválidos'],400);
        foreach($items as $item){
            if(!is_array($item)||textLength(trim((string)($item['materialName']??'')))<2||trim((string)($item['unitOfMeasure']??''))===''||(float)($item['quantityRequested']??0)<=0){
                jsonResponse(['error'=>'Datos de material inválidos'],400);
            }
        }
        $code='REQ-'.substr((string)round(microtime(true)*1000),-6);
        $pdo->beginTransaction();
        try{
            $stmt=$pdo->prepare("INSERT INTO material_requisitions (requisition_code,project_id,requested_by,department,status,notes) VALUES (?,?,?,?,'ENVIADA',?)");
            $stmt->execute([$code,$projectId,(int)$user['id'],$department,trim((string)($body['notes']??''))?:null]);
            $reqId=(int)$pdo->lastInsertId();
            $itemStmt=$pdo->prepare("INSERT INTO material_requisition_items (requisition_id,material_name,unit_of_measure,quantity_requested) VALUES (?,?,?,?)");
            foreach($items as $item){$itemStmt->execute([$reqId,trim((string)$item['materialName']),trim((string)$item['unitOfMeasure']),(float)$item['quantityRequested']]);}
            $pdo->commit();
            jsonResponse(['message'=>'Requisición de materiales creada exitosamente','requisition'=>dbOne($pdo,'SELECT * FROM material_requisitions WHERE id=?',[$reqId]),'itemsCount'=>count($items)],201);
        }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
    }

    // SOLICITUDES INTERNAS.
    if ($method === 'GET' && $path === '/requests') {
        $user=requireAuth($config);
        $sql="SELECT ir.*, CONCAT_WS(' ',u.first_name,u.last_name) AS employee_name,u.department FROM internal_requests ir JOIN users u ON ir.user_id=u.id";
        $params=[];
        if(!in_array((string)$user['roleCode'],['ADMIN_GLOBAL','ADMIN_RRHH'],true)){$sql.=' WHERE ir.user_id=?';$params[]=(int)$user['id'];}
        $sql.=' ORDER BY ir.created_at DESC';
        jsonResponse(['requests'=>dbAll($pdo,$sql,$params)]);
    }

    if ($method === 'POST' && $path === '/requests') {
        $user=requireAuth($config);$body=requestJson();
        $type=(string)($body['requestType']??'');$start=trim((string)($body['startDate']??''));$end=trim((string)($body['endDate']??''));$reason=trim((string)($body['reason']??''));
        if(!in_array($type,['VACACIONES','PERMISO','AUSENCIA'],true)||strlen($start)<10||strlen($end)<10||textLength($reason)<5)jsonResponse(['error'=>'Datos de solicitud inválidos'],400);
        $stmt=$pdo->prepare("INSERT INTO internal_requests (user_id,request_type,start_date,end_date,reason,status) VALUES (?,?,?,?,?,'PENDIENTE_JEFE')");
        $stmt->execute([(int)$user['id'],$type,$start,$end,$reason]);
        jsonResponse(['message'=>'Solicitud enviada a revisión.','request'=>dbOne($pdo,'SELECT * FROM internal_requests WHERE id=?',[(int)$pdo->lastInsertId()])],201);
    }

    if ($method === 'PATCH' && preg_match('#^/requests/(\d+)/approve$#',$path,$m)) {
        $user=requireAuth($config);requireRole($user,['ADMIN_GLOBAL','ADMIN_RRHH']);$id=(int)$m[1];
        $affected=dbExecute($pdo,"UPDATE internal_requests SET status='APROBADO',approved_by=? WHERE id=?",[(int)$user['id'],$id]);
        if($affected===0)jsonResponse(['error'=>'Solicitud no encontrada.'],404);
        jsonResponse(['message'=>'Solicitud aprobada exitosamente','request'=>dbOne($pdo,'SELECT * FROM internal_requests WHERE id=?',[$id])]);
    }

    // =========================================================================
    // MÓDULO DE GESTIÓN DE USUARIOS Y ROLES (ADMIN_GLOBAL / ADMIN_RRHH)
    // =========================================================================

    /**
     * Endpoint: GET /roles
     * Descripción: Retorna el catálogo de roles definidos en MariaDB.
     * Acceso: Usuarios con rol ADMIN_GLOBAL o ADMIN_RRHH.
     */
    if ($method === 'GET' && $path === '/roles') {
        $user = requireAuth($config);
        requireRole($user, ['ADMIN_GLOBAL', 'ADMIN_RRHH']);
        // Consultamos todos los roles ordenados por ID de forma ascendente
        $roles = dbAll($pdo, "SELECT id, code, name, user_type, description FROM roles ORDER BY id ASC");
        jsonResponse(['roles' => $roles]);
    }

    /**
     * Endpoint: GET /users
     * Descripción: Obtiene el listado completo de usuarios registrados en el sistema.
     * Acceso: Usuarios con rol ADMIN_GLOBAL o ADMIN_RRHH.
     */
    if ($method === 'GET' && $path === '/users') {
        $user = requireAuth($config);
        requireRole($user, ['ADMIN_GLOBAL', 'ADMIN_RRHH']);
        // Relacionamos la tabla usuarios (users) con la tabla roles mediante LEFT JOIN
        $rows = dbAll($pdo, "SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.department, u.role_id, u.is_active, u.created_at, r.code AS role_code, r.name AS role_name
                         FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC");
        jsonResponse(['users' => $rows]);
    }

    /**
     * Endpoint: POST /users
     * Descripción: Registra un nuevo usuario en la base de datos con contraseña encriptada (bcrypt).
     * Acceso: Exclusivo para Administrador Global (ADMIN_GLOBAL).
     */
    if ($method === 'POST' && $path === '/users') {
        $admin = requireAuth($config);
        requireRole($admin, ['ADMIN_GLOBAL']);
        $body = requestJson();

        // Extraemos y sanitizamos los campos recibidos
        $email = validateEmailValue($body['email'] ?? null);
        $password = (string) ($body['password'] ?? '');
        $first = trim((string) ($body['firstName'] ?? ''));
        $last = trim((string) ($body['lastName'] ?? ''));
        $roleId = (int) ($body['roleId'] ?? 0);
        $department = trim((string) ($body['department'] ?? ''));

        // Validación de campos obligatorios
        if ($email === null || strlen($password) < 6 || textLength($first) < 2 || textLength($last) < 2 || $roleId <= 0 || textLength($department) < 2) {
            jsonResponse(['error' => 'Datos de usuario inválidos. Por favor completa todos los campos correctamente (mínimo 6 caracteres para la contraseña).'], 400);
        }

        // Verificamos que el correo electrónico no esté registrado previamente
        if (dbOne($pdo, 'SELECT id FROM users WHERE email = ? LIMIT 1', [$email])) {
            jsonResponse(['error' => 'El correo electrónico ya se encuentra registrado por otro usuario.'], 400);
        }

        // Encriptamos la contraseña con BCRYPT nativo de PHP
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

        // Insertamos el nuevo usuario en MariaDB (por defecto is_active = 1)
        $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, department, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
        $stmt->execute([$email, $hash, $first, $last, trim((string) ($body['phone'] ?? '')) ?: null, $roleId, $department]);

        jsonResponse(['message' => 'Usuario registrado exitosamente.', 'user' => dbOne($pdo, 'SELECT id, email, first_name, last_name, department, is_active, created_at FROM users WHERE id = ?', [(int) $pdo->lastInsertId()])], 201);
    }

    /**
     * Endpoint: PUT /users/{id}
     * Descripción: Actualiza la información personal, rol, departamento o contraseña de un usuario existente.
     * Acceso: Exclusivo para Administrador Global (ADMIN_GLOBAL).
     */
    if ($method === 'PUT' && preg_match('#^/users/(\d+)$#', $path, $m)) {
        $admin = requireAuth($config);
        requireRole($admin, ['ADMIN_GLOBAL']);
        $id = (int) $m[1];

        // Verificamos la existencia del usuario objetivo
        $existing = dbOne($pdo, 'SELECT id, email FROM users WHERE id = ?', [$id]);
        if (!$existing) {
            jsonResponse(['error' => 'El usuario que intentas editar no existe.'], 404);
        }

        $body = requestJson();
        $email = validateEmailValue($body['email'] ?? null);
        $first = trim((string) ($body['firstName'] ?? ''));
        $last = trim((string) ($body['lastName'] ?? ''));
        $roleId = (int) ($body['roleId'] ?? 0);
        $department = trim((string) ($body['department'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if ($email === null || textLength($first) < 2 || textLength($last) < 2 || $roleId <= 0 || textLength($department) < 2) {
            jsonResponse(['error' => 'Datos de usuario inválidos. Revisa que todos los campos requeridos estén completos.'], 400);
        }

        // Verificamos que el correo no esté ocupado por OTRO usuario distinto al actual
        $duplicate = dbOne($pdo, 'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1', [$email, $id]);
        if ($duplicate) {
            jsonResponse(['error' => 'El correo electrónico ya pertenece a otro usuario registrado.'], 400);
        }

        // Si se envió una nueva contraseña, la actualizamos; de lo contrario, se conserva la actual
        if (strlen($password) > 0) {
            if (strlen($password) < 6) {
                jsonResponse(['error' => 'La nueva contraseña debe tener al menos 6 caracteres.'], 400);
            }
            $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
            dbExecute($pdo, 'UPDATE users SET email=?, password_hash=?, first_name=?, last_name=?, phone=?, role_id=?, department=? WHERE id=?', [
                $email, $hash, $first, $last, trim((string) ($body['phone'] ?? '')) ?: null, $roleId, $department, $id
            ]);
        } else {
            dbExecute($pdo, 'UPDATE users SET email=?, first_name=?, last_name=?, phone=?, role_id=?, department=? WHERE id=?', [
                $email, $first, $last, trim((string) ($body['phone'] ?? '')) ?: null, $roleId, $department, $id
            ]);
        }

        jsonResponse(['message' => 'Usuario actualizado exitosamente.', 'user' => dbOne($pdo, 'SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.department, u.role_id, u.is_active, r.code AS role_code, r.name AS role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?', [$id])]);
    }

    /**
     * Endpoint: DELETE /users/{id}
     * Descripción: Elimina permanentemente el registro de un usuario en MariaDB.
     * Acceso: Exclusivo para Administrador Global (ADMIN_GLOBAL).
     */
    if ($method === 'DELETE' && preg_match('#^/users/(\d+)$#', $path, $m)) {
        $admin = requireAuth($config);
        requireRole($admin, ['ADMIN_GLOBAL']);
        $id = (int) $m[1];

        // Protección de seguridad: Evita que el usuario en sesión borre su propia cuenta
        if ((int) $admin['id'] === $id) {
            jsonResponse(['error' => 'No puedes eliminar tu propio usuario mientras mantienes la sesión activa.'], 400);
        }

        $existing = dbOne($pdo, 'SELECT id FROM users WHERE id = ?', [$id]);
        if (!$existing) {
            jsonResponse(['error' => 'El usuario especificado no existe.'], 404);
        }

        dbExecute($pdo, 'DELETE FROM users WHERE id = ?', [$id]);
        jsonResponse(['message' => 'El usuario ha sido eliminado exitosamente del sistema.']);
    }

    /**
     * Endpoint: PATCH /users/{id}/toggle-status
     * Descripción: Cambia alternadamente el estado de un usuario entre Activo (1) e Inactivo (0).
     * Acceso: Exclusivo para Administrador Global (ADMIN_GLOBAL).
     */
    if ($method === 'PATCH' && preg_match('#^/users/(\d+)/toggle-status$#', $path, $m)) {
        $admin = requireAuth($config);
        requireRole($admin, ['ADMIN_GLOBAL']);
        $id = (int) $m[1];

        // Protección de seguridad: Evita que el usuario en sesión desactive su propia cuenta
        if ((int) $admin['id'] === $id) {
            jsonResponse(['error' => 'No puedes desactivar tu propio usuario mientras mantienes la sesión activa.'], 400);
        }

        $affected = dbExecute($pdo, 'UPDATE users SET is_active = IF(is_active = 1, 0, 1) WHERE id = ?', [$id]);
        if ($affected === 0) {
            jsonResponse(['error' => 'El usuario especificado no existe.'], 404);
        }

        jsonResponse(['message' => 'El estado del usuario ha sido actualizado correctamente.', 'user' => dbOne($pdo, 'SELECT id, email, is_active FROM users WHERE id = ?', [$id])]);
    }

    // NOTIFICACIONES. read-all debe evaluarse antes de /:id/read.
    if ($method === 'GET' && $path === '/notifications') {
        $user=requireAuth($config);$uid=(int)$user['id'];
        $notifications=dbAll($pdo,'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20',[$uid]);
        $count=dbOne($pdo,'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id=? AND is_read=0',[$uid]);
        jsonResponse(['notifications'=>$notifications,'unreadCount'=>(int)($count['unread_count']??0)]);
    }

    if ($method === 'PATCH' && $path === '/notifications/read-all') {
        $user=requireAuth($config);dbExecute($pdo,'UPDATE notifications SET is_read=1 WHERE user_id=?',[(int)$user['id']]);
        jsonResponse(['message'=>'Todas las notificaciones marcadas como leídas.']);
    }

    if ($method === 'PATCH' && preg_match('#^/notifications/(\d+)/read$#',$path,$m)) {
        $user=requireAuth($config);dbExecute($pdo,'UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?',[(int)$m[1],(int)$user['id']]);
        jsonResponse(['message'=>'Notificación marcada como leída.']);
    }

    // CHAT: contexto RAG se consulta localmente en GoogieHost y solo el texto se envía al servicio de IA.
    if ($method === 'POST' && $path === '/chat/query') {
        $user=requireAuth($config);$body=requestJson();$message=trim((string)($body['message']??''));
        if($message==='')jsonResponse(['error'=>'Mensaje requerido.'],400);
        $conversationId=(int)($body['conversationId']??0);
        if($conversationId<=0){
            $stmt=$pdo->prepare('INSERT INTO chat_conversations (user_id,title) VALUES (?,?)');
            $stmt->execute([(int)$user['id'],'Consulta RRHH '.date('d/m/Y')]);
            $conversationId=(int)$pdo->lastInsertId();
        }else{
            $owner=dbOne($pdo,'SELECT id FROM chat_conversations WHERE id=? AND user_id=?',[$conversationId,(int)$user['id']]);
            if(!$owner)jsonResponse(['error'=>'Conversación no encontrada.'],404);
        }
        $stmt=$pdo->prepare("INSERT INTO chat_messages (conversation_id,sender,content) VALUES (?,'USER',?)");$stmt->execute([$conversationId,$message]);
        $context=ragContext($pdo,$message);
        $answer=callAiService($config,$message,(int)$user['id'],$context);
        if($answer===null||$answer===''){
            $answer='Hola. El servicio de IA de Prodisa no está configurado o se encuentra temporalmente fuera de servicio. Para vacaciones, permisos u horas extras puedes utilizar directamente los módulos de esta Intranet.';
        }
        $stmt=$pdo->prepare("INSERT INTO chat_messages (conversation_id,sender,content) VALUES (?,'BOT',?)");$stmt->execute([$conversationId,$answer]);
        $bot=dbOne($pdo,'SELECT * FROM chat_messages WHERE id=?',[(int)$pdo->lastInsertId()]);
        jsonResponse(['conversationId'=>$conversationId,'userMessage'=>$message,'botResponse'=>$bot]);
    }

    if ($method === 'GET' && preg_match('#^/chat/history/(\d+)$#',$path,$m)) {
        $user=requireAuth($config);
        $rows=dbAll($pdo,"SELECT cm.* FROM chat_messages cm JOIN chat_conversations cc ON cm.conversation_id=cc.id WHERE cc.user_id=? AND cc.id=? ORDER BY cm.created_at ASC",[(int)$user['id'],(int)$m[1]]);
        jsonResponse(['messages'=>$rows]);
    }

    jsonResponse(['error' => 'Ruta no encontrada.', 'path' => $path], 404);
} catch (PDOException $e) {
    $message = 'Error de base de datos.';
    if ((bool) $config['app']['debug']) {
        $message .= ' ' . $e->getMessage();
    }
    jsonResponse(['error' => $message], 500);
} catch (Throwable $e) {
    $message = 'Error interno en el servidor.';
    if ((bool) $config['app']['debug']) {
        $message .= ' ' . $e->getMessage();
    }
    jsonResponse(['error' => $message], 500);
}
