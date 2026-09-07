<?php
declare(strict_types=1);

$root = realpath(__DIR__ . '/../apps/web/public/api');
if ($root === false) {
    fwrite(STDERR, "No se encontró la API PHP.\n");
    exit(1);
}

$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));
$failed = false;
foreach ($iterator as $file) {
    if (!$file->isFile() || strtolower($file->getExtension()) !== 'php') {
        continue;
    }
    $path = $file->getPathname();
    $output = [];
    $status = 0;
    exec('php -l ' . escapeshellarg($path) . ' 2>&1', $output, $status);
    echo implode(PHP_EOL, $output) . PHP_EOL;
    if ($status !== 0) {
        $failed = true;
    }
}
exit($failed ? 1 : 0);
