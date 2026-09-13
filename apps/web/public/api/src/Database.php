<?php
declare(strict_types=1);

final class Database
{
    private static ?PDO $pdo = null;

    public static function connection(array $config): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $db = $config['db'];
        if (trim((string) $db['password']) === '') {
            throw new RuntimeException('DB_PASSWORD no está configurado.');
        }

        if (!extension_loaded('pdo_mysql')) {
            throw new RuntimeException('La extensión pdo_mysql no está disponible en el servidor.');
        }

        if (($db['socket'] ?? '') !== '') {
            $dsn = sprintf(
                'mysql:unix_socket=%s;dbname=%s;charset=utf8mb4',
                $db['socket'],
                $db['name']
            );
        } elseif (strtolower((string) $db['host']) === 'localhost') {
            // No se especifica puerto para favorecer el socket Unix local de MariaDB.
            $dsn = sprintf('mysql:host=localhost;dbname=%s;charset=utf8mb4', $db['name']);
        } else {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                $db['host'],
                (int) $db['port'],
                $db['name']
            );
        }

        self::$pdo = new PDO(
            $dsn,
            (string) $db['user'],
            (string) $db['password'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_STRINGIFY_FETCHES => false,
            ]
        );

        self::$pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
        return self::$pdo;
    }
}

function dbAll(PDO $pdo, string $sql, array $params = []): array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function dbOne(PDO $pdo, string $sql, array $params = []): ?array
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch();
    return $row === false ? null : $row;
}

function dbExecute(PDO $pdo, string $sql, array $params = []): int
{
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->rowCount();
}
