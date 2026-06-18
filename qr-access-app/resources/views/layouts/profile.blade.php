<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'Mon profil' }} — QR Access Manager</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="{{ asset('css/qr-access.css') }}">
    <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
    <link rel="stylesheet" href="{{ asset('css/profile.css') }}">
    <link rel="stylesheet" href="{{ asset('css/flash-messages.css') }}">
    <script src="{{ asset('js/flash-messages.js') }}"></script>
</head>
<body>
    <div class="app-layout">
        @include('partials.sidebar', ['activeTab' => 'profile'])
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar(false)"></div>
        <main class="main-wrapper">
            <div class="mobile-topbar">
                <button type="button" class="sidebar-toggle" onclick="toggleSidebar()" aria-label="Menu">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <span class="mobile-title">Mon profil</span>
            </div>
            <div class="container profile-container">
                @include('partials.flash-notify')
                {{ $slot }}
            </div>
        </main>
    </div>

    @include('partials.about-modal')

    <div id="deleteAccountModal" class="modal profile-delete-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title"><i class="fa-solid fa-triangle-exclamation"></i> Supprimer le compte</h2>
                <button type="button" class="modal-close" onclick="closeDeleteModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <form method="post" action="{{ route('profile.destroy') }}">
                @csrf
                @method('delete')
                <p class="profile-delete-text">
                    Cette action est irréversible. Toutes vos cérémonies, invités et données seront supprimés.
                    Confirmez avec votre mot de passe.
                </p>
                <div class="auth-field">
                    <label for="delete_password">Mot de passe</label>
                    <input id="delete_password" name="password" type="password" required placeholder="Votre mot de passe">
                    @error('password', 'userDeletion')
                        <p class="auth-field-error">{{ $message }}</p>
                    @enderror
                </div>
                <div class="profile-form-actions">
                    <button type="button" class="profile-btn profile-btn--ghost" onclick="closeDeleteModal()">Annuler</button>
                    <button type="submit" class="profile-btn profile-btn--danger">
                        <i class="fa-solid fa-trash"></i> Supprimer définitivement
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="{{ asset('js/shell.js') }}"></script>
    @if ($errors->hasBag('userDeletion') && $errors->userDeletion->isNotEmpty())
        <script>document.addEventListener('DOMContentLoaded', function () { openDeleteModal(); });</script>
    @endif
</body>
</html>
