# QR Access Manager — Installation backend (Laravel)

Application Laravel 12 avec authentification Breeze, base MySQL et synchronisation des données via API.

## Prérequis

- XAMPP (PHP 8.2+, MySQL, Apache)
- Composer (`composer.phar` dans `c:\xampp\htdocs\ben\`)

## 1. Base de données MySQL

1. Ouvrez phpMyAdmin : `http://localhost/phpmyadmin`
2. Créez la base :

```sql
CREATE DATABASE qr_access_laravel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Si une ancienne base `qr_access` existe déjà avec un autre schéma, utilisez `qr_access_laravel` (configurée par défaut dans `.env`).

Alternative — réinitialiser l'ancienne base (efface les données) :

```sql
DROP DATABASE qr_access;
CREATE DATABASE qr_access CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Vérifiez `.env` dans `qr-access-app/` :

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=qr_access_laravel
DB_USERNAME=root
DB_PASSWORD=
```

## 2. Migrations et compte admin

Dans PowerShell :

```powershell
cd c:\xampp\htdocs\ben\qr-access-app
c:\xampp\php\php.exe ..\composer.phar install --no-interaction
c:\xampp\php\php.exe artisan migrate --force
c:\xampp\php\php.exe artisan db:seed --force
```

Compte administrateur créé par le seeder :

| Champ | Valeur |
|-------|--------|
| Email | `admin@qraccess.local` |
| Mot de passe | `QrAccess2026!` |

## 3. Accès à l'application

URL XAMPP :

```
http://localhost/ben/qr-access-app/public
```

Pages (authentification requise) :

| Route | Fichier Blade |
|-------|----------------|
| `/dashboard` | `resources/views/pages/dashboard.blade.php` |
| `/ceremonie` | `resources/views/pages/ceremonie.blade.php` |
| `/verify` | `resources/views/pages/verify.blade.php` |
| `/history` | `resources/views/pages/history.blade.php` |
| `/gestion-ceremonies` | `resources/views/pages/gestion-ceremonies.blade.php` |

## 4. Architecture des données

```
users
  ├── ceremonies → guests → guest_scans
  │       ├── organizers
  │       └── ceremony_management
  ├── visitors
  └── access_logs
```

Chaque enregistrement est lié à `user_id` : un utilisateur ne voit que ses propres données (filtrage dans `DataSyncController` + routes `auth`).

## 5. API de synchronisation

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/sync` | Charge ceremonies, visitors, accessLog, managedCeremonies |
| POST | `/api/sync` | Sauvegarde (debounced côté client) |

Le fichier `public/js/api-bridge.js` remplace `localStorage` pour ces clés et charge les données **avant** `qr-access-app.js`.

## 6. Sécurité

- Authentification Laravel Breeze (session, CSRF)
- Routes web et API protégées par middleware `auth`
- Mots de passe hashés (bcrypt)
- Vérification email activée sur les routes principales (`verified`)
- Isolation des données par `user_id`

## 7. Développement local (optionnel)

Serveur intégré PHP :

```powershell
c:\xampp\php\php.exe artisan serve
```

Puis : `http://127.0.0.1:8000`

Mettez `APP_URL=http://127.0.0.1:8000` dans `.env`.
