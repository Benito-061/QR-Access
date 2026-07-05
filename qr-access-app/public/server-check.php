<?php
/**
 * Diagnostic temporaire — supprimez ce fichier après résolution du problème.
 * Accès : https://votre-domaine.com/server-check.php
 */
header('Content-Type: text/plain; charset=utf-8');

$home = '/home/btisrdc25';
$laravelRoot = $home . '/qr-access-app/qr-access-app';
$laravelPublic = $laravelRoot . '/public';

echo "=== QR Access — Diagnostic serveur ===\n\n";
echo 'Date: ' . date('c') . "\n";
echo 'PHP: ' . PHP_VERSION . "\n";
echo 'SAPI: ' . php_sapi_name() . "\n";
echo 'Script: ' . __FILE__ . "\n";
echo 'CWD: ' . getcwd() . "\n\n";

$checks = [
    'Laravel racine' => $laravelRoot,
    'Laravel public' => $laravelPublic,
    'vendor/autoload' => $laravelRoot . '/vendor/autoload.php',
    'artisan' => $laravelRoot . '/artisan',
    '.env' => $laravelRoot . '/.env',
    'storage' => $laravelRoot . '/storage',
    'storage/logs' => $laravelRoot . '/storage/logs',
    'storage/framework/sessions' => $laravelRoot . '/storage/framework/sessions',
    'Ancien public (à ne plus utiliser)' => $home . '/qr-access-app/public/index.php',
];

foreach ($checks as $label => $path) {
    $status = file_exists($path) ? 'OK' : 'MANQUANT';
    if (file_exists($path) && is_dir($path)) {
        $status .= is_writable($path) ? ' (writable)' : ' (NON writable)';
    }
    echo sprintf("%-35s %s\n", $label . ':', $status);
}

echo "\n--- Test écriture session ---\n";
$sessionDir = $laravelRoot . '/storage/framework/sessions';
$testFile = $sessionDir . '/_web_test_' . time() . '.txt';
$writeOk = @file_put_contents($testFile, 'ok');
echo 'Écriture fichier: ' . ($writeOk !== false ? 'OK' : 'ÉCHEC') . "\n";
if ($writeOk !== false) {
    @unlink($testFile);
}

echo "\n--- Test Laravel (requête /) ---\n";
if (! file_exists($laravelRoot . '/vendor/autoload.php')) {
    echo "ERREUR: composer install requis dans $laravelRoot\n";
    exit;
}

try {
    chdir($laravelPublic);
    require $laravelRoot . '/vendor/autoload.php';
    $app = require $laravelRoot . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    $request = Illuminate\Http\Request::create('/', 'GET');
    $response = $kernel->handle($request);
    echo 'Status HTTP: ' . $response->getStatusCode() . "\n";
    if ($response->getStatusCode() >= 400) {
        echo "Aperçu réponse:\n" . substr($response->getContent(), 0, 300) . "\n";
    }
    $kernel->terminate($request, $response);
} catch (Throwable $e) {
    echo 'ERREUR Laravel: ' . $e->getMessage() . "\n";
    echo 'Fichier: ' . $e->getFile() . ':' . $e->getLine() . "\n";
}

echo "\n=== Fin diagnostic ===\n";
