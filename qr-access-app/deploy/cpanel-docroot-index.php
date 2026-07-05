<?php
/**
 * Copier ce fichier vers le Document Root du sous-domaine (ex. ~/public_html/qr.btisrdc.com/index.php)
 * Adapter $laravelPublic si votre compte n'est pas btisrdc25.
 */
$laravelPublic = '/home/btisrdc25/qr-access-app/qr-access-app/public';

if (! is_file($laravelPublic . '/index.php')) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Laravel introuvable : {$laravelPublic}/index.php\n";
    echo "Vérifiez le chemin dans index.php du sous-domaine.\n";
    exit(1);
}

chdir($laravelPublic);
require $laravelPublic . '/index.php';
