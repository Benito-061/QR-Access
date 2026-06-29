<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'Espace invité' }} — QR Access Manager</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
    <link rel="stylesheet" href="{{ asset('css/guest-gift.css') }}">
    <link rel="stylesheet" href="{{ asset('css/flash-messages.css') }}">
    <script src="{{ asset('js/flash-messages.js') }}"></script>
</head>
<body class="auth-body guest-body">
    <div class="guest-page">
        <header class="guest-header">
            <div class="guest-brand">
                <i class="fa-solid fa-gift"></i>
                <span>Espace invité</span>
            </div>
            @isset($guestDisplayName)
                <span class="guest-user">{{ $guestDisplayName }}</span>
            @endisset
            <form method="POST" action="{{ route('invitee.logout') }}">
                @csrf
                <button type="submit" class="guest-logout-btn">
                    <i class="fa-solid fa-right-from-bracket"></i> Déconnexion
                </button>
            </form>
        </header>

        <main class="guest-main">
            @include('partials.flash-notify')
            {{ $slot }}
        </main>
    </div>
</body>
</html>
