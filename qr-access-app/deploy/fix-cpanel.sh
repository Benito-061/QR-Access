#!/bin/bash
# Réparer qr.btisrdc.com — exécuter : bash deploy/fix-cpanel.sh
set -e

HOME_DIR="${HOME:-/home/btisrdc25}"
DOCROOT="$HOME_DIR/public_html/qr.btisrdc.com"
[ -d "$DOCROOT" ] || DOCROOT="$HOME_DIR/qr.btisrdc.com"

if [ -f "$HOME_DIR/qr-access-app/qr-access-app/artisan" ]; then
  LARAVEL_PUBLIC="$HOME_DIR/qr-access-app/qr-access-app/public"
  LARAVEL_ROOT="$HOME_DIR/qr-access-app/qr-access-app"
elif [ -f "$HOME_DIR/qr-access-app/artisan" ]; then
  LARAVEL_PUBLIC="$HOME_DIR/qr-access-app/public"
  LARAVEL_ROOT="$HOME_DIR/qr-access-app"
else
  echo "ERREUR: artisan introuvable"; exit 1
fi

echo "=== Fix QR Access ==="
echo "DOCROOT : $DOCROOT"
echo "Laravel : $LARAVEL_ROOT"

mkdir -p "$DOCROOT"

cat > "$DOCROOT/index.php" << EOF
<?php
\$laravelPublic = '$LARAVEL_PUBLIC';
if (! is_file(\$laravelPublic . '/index.php')) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Laravel introuvable: {\$laravelPublic}/index.php";
    exit(1);
}
chdir(\$laravelPublic);
require \$laravelPublic . '/index.php';
EOF

cat > "$DOCROOT/.htaccess" << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
EOF

cd "$HOME_DIR/qr-access-app" && git pull origin main || true
cd "$LARAVEL_ROOT"

# Sessions en fichiers (évite erreur 500 sur cPanel)
grep -q '^SESSION_DRIVER=' .env 2>/dev/null && sed -i 's/^SESSION_DRIVER=.*/SESSION_DRIVER=file/' .env || echo 'SESSION_DRIVER=file' >> .env
grep -q '^CACHE_STORE=' .env 2>/dev/null && sed -i 's/^CACHE_STORE=.*/CACHE_STORE=file/' .env || echo 'CACHE_STORE=file' >> .env

mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs
chmod -R 775 storage bootstrap/cache 2>/dev/null || chmod -R 777 storage bootstrap/cache

php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo ""
echo "=== Terminé ==="
echo "Testez : https://qr.btisrdc.com/ping"
echo "         https://qr.btisrdc.com/"
echo "         https://qr.btisrdc.com/up"
