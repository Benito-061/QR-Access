<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title }} — QR Access Manager</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
    <link rel="stylesheet" href="{{ asset('css/flash-messages.css') }}">
    <script src="{{ asset('js/flash-messages.js') }}"></script>
</head>
<body class="auth-body">
    <div class="auth-page">
        <aside class="auth-hero">
            @isset($hero)
                {{ $hero }}
            @else
            <div class="auth-hero-inner">
                <div class="auth-brand">
                    <div class="auth-brand-icon"><i class="fa-solid fa-qrcode"></i></div>
                    <div class="auth-brand-text">
                        <span class="auth-brand-name">QR Access</span>
                        <span class="auth-brand-sub">Manager</span>
                    </div>
                </div>

                <h1>Gérez vos accès et invitations en toute simplicité</h1>
                <p class="auth-hero-lead">
                    QR Access Manager centralise la création de cérémonies, la gestion des invités,
                    la génération de QR codes et la vérification des accès en temps réel.
                </p>

                <ul class="auth-features">
                    <li>
                        <i class="fa-solid fa-champagne-glasses"></i>
                        <span><strong>Cérémonies & invités</strong> — créez des événements et gérez vos listes d'invitation.</span>
                    </li>
                    <li>
                        <i class="fa-solid fa-qrcode"></i>
                        <span><strong>QR codes intelligents</strong> — codes rapides et scan pour valider chaque entrée.</span>
                    </li>
                    <li>
                        <i class="fa-solid fa-chart-line"></i>
                        <span><strong>Suivi en direct</strong> — tableau de bord, historique et bilans journaliers.</span>
                    </li>
                    <li>
                        <i class="fa-solid fa-shield-halved"></i>
                        <span><strong>Sécurité avancée</strong> — comptes protégés et données isolées par utilisateur.</span>
                    </li>
                </ul>

                <p class="auth-hero-footer">© {{ date('Y') }} QR Access Manager — Tous droits réservés</p>
            </div>
            @endisset
        </aside>

        <main class="auth-panel">
            <div class="auth-form-wrap">
                @include('partials.flash-notify')
                {{ $slot }}
            </div>
        </main>
    </div>
</body>
</html>
