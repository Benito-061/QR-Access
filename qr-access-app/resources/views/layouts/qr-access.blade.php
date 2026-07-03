<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="app-base" content="{{ url('/') }}">
    <meta name="register-url" content="{{ route('register') }}">
    <title>QR Access Manager — {{ $pageTitle ?? 'Application' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="{{ asset('css/qr-access.css') }}">
    <link rel="stylesheet" href="{{ asset('css/flash-messages.css') }}">
    <style>
        /* Affichage immédiat avant chargement JS */
        .tab-content.active {
            display: block !important;
        }
    </style>
    <script src="{{ asset('js/qrcode.min.js') }}"></script>
    <script src="{{ asset('js/jsQR.min.js') }}"></script>
    <script src="{{ asset('js/shell.js') }}"></script>
</head>
<body>
    @include('partials.app-body', ['activeTab' => $activeTab ?? 'dashboard'])

    @include('partials.modals')

    @include('partials.flash-notify')

    <button id="scrollToTopBtn" title="Revenir en haut" type="button">↑</button>

    <script src="{{ asset('js/flash-messages.js') }}"></script>
    <script src="{{ asset('js/api-bridge.js') }}"></script>
    <script>
        window.QR_ACCESS_ACTIVE_TAB = '{{ $activeTab ?? 'dashboard' }}';

        function qrAccessBootApp() {
            var tab = window.QR_ACCESS_ACTIVE_TAB || 'dashboard';
            var btn = document.querySelector('.nav-tab[data-tab="' + tab + '"]');
            if (typeof switchTab === 'function') {
                switchTab(tab, btn);
            } else {
                document.querySelectorAll('.tab-content').forEach(function (el) {
                    el.classList.remove('active');
                    el.style.display = 'none';
                });
                var activeEl = document.getElementById(tab);
                if (activeEl) {
                    activeEl.classList.add('active');
                    activeEl.style.display = 'block';
                }
            }
        }

        function qrAccessLoadMainScript() {
            var s = document.createElement('script');
            s.src = '{{ asset('js/qr-access-app.js') }}';
            s.onload = qrAccessBootApp;
            s.onerror = function () {
                console.error('Impossible de charger qr-access-app.js');
                qrAccessBootApp();
            };
            document.body.appendChild(s);
        }

        document.addEventListener('DOMContentLoaded', function () {
            QrAccessBridge.init()
                .then(qrAccessLoadMainScript)
                .catch(function (err) {
                    console.warn('Sync API indisponible, mode local:', err);
                    qrAccessLoadMainScript();
                });
        });
    </script>
</body>
</html>
