<?php
declare(strict_types=1);

function requireAuth(array $config): array
{
    $token = bearerToken();
    if ($token === null) {
        jsonResponse(['error' => 'Acceso no autorizado: Token no proporcionado.'], 401);
    }

    $user = jwtVerify($token, (string) $config['jwt']['secret']);
    if (!is_array($user)) {
        jsonResponse(['error' => 'Token inválido o expirado.'], 403);
    }
    return $user;
}

function requireRole(array $user, array $roles): void
{
    $role = (string) ($user['roleCode'] ?? '');
    if ($role === 'ADMIN_GLOBAL' || in_array($role, $roles, true)) {
        return;
    }
    jsonResponse(['error' => 'Acceso denegado: No cuentas con el rol requerido.'], 403);
}


/**
 * Compatibilidad con hashes bcrypt $2b$ generados por Node/bcrypt.
 * PHP usa el identificador $2y$, pero el formato bcrypt es compatible.
 */
function verifyPasswordCompat(string $password, string $hash): bool
{
    $phpHash = str_starts_with($hash, '$2b$')
        ? '$2y$' . substr($hash, 4)
        : $hash;

    return password_verify($password, $phpHash);
}

function shouldRehashPassword(string $hash): bool
{
    if (str_starts_with($hash, '$2b$')) {
        return true;
    }
    return password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => 10]);
}
