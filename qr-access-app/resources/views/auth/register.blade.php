<x-auth-layout title="Créer un compte">
    <x-slot name="hero">
        <div class="auth-hero-inner">
            <div class="auth-brand">
                <div class="auth-brand-icon"><i class="fa-solid fa-user-plus"></i></div>
                <div class="auth-brand-text">
                    <span class="auth-brand-name">QR Access</span>
                    <span class="auth-brand-sub">Manager</span>
                </div>
            </div>

            <h1>Créez votre espace en quelques minutes</h1>
            <p class="auth-hero-lead">
                Inscrivez-vous gratuitement pour organiser vos cérémonies, gérer vos invités
                et contrôler les accès avec des QR codes sécurisés.
            </p>

            <ul class="auth-features">
                <li>
                    <i class="fa-solid fa-bolt"></i>
                    <span><strong>Mise en route rapide</strong> — compte actif immédiatement après inscription.</span>
                </li>
                <li>
                    <i class="fa-solid fa-users"></i>
                    <span><strong>Espace personnel</strong> — vos données restent privées et isolées.</span>
                </li>
                <li>
                    <i class="fa-solid fa-lock"></i>
                    <span><strong>Connexion sécurisée</strong> — mot de passe chiffré et sessions protégées.</span>
                </li>
                <li>
                    <i class="fa-solid fa-headset"></i>
                    <span><strong>Support QR-Access</strong> — assistance pour vos événements.</span>
                </li>
            </ul>

            <p class="auth-hero-footer">© {{ date('Y') }} QR Access Manager — Tous droits réservés</p>
        </div>
    </x-slot>

    <div class="auth-form-header">
        <h2>Créer un compte</h2>
        <p>Commencez à gérer vos invitations et accès QR</p>
    </div>

    <form method="POST" action="{{ route('register') }}">
        @csrf

        <div class="auth-field">
            <label for="name">Nom complet</label>
            <input
                id="name"
                type="text"
                name="name"
                value="{{ old('name') }}"
                required
                autofocus
                autocomplete="name"
                placeholder="Votre nom"
            >
            @error('name')
                <p class="auth-field-error">{{ $message }}</p>
            @enderror
        </div>

        <div class="auth-field">
            <label for="email">Adresse e-mail</label>
            <input
                id="email"
                type="email"
                name="email"
                value="{{ old('email') }}"
                required
                autocomplete="username"
                placeholder="exemple@email.com"
            >
            @error('email')
                <p class="auth-field-error">{{ $message }}</p>
            @enderror
        </div>

        <div class="auth-field">
            <label for="password">Mot de passe</label>
            <input
                id="password"
                type="password"
                name="password"
                required
                autocomplete="new-password"
                placeholder="Minimum 8 caractères"
            >
            @error('password')
                <p class="auth-field-error">{{ $message }}</p>
            @enderror
        </div>

        <div class="auth-field">
            <label for="password_confirmation">Confirmer le mot de passe</label>
            <input
                id="password_confirmation"
                type="password"
                name="password_confirmation"
                required
                autocomplete="new-password"
                placeholder="Répétez le mot de passe"
            >
            @error('password_confirmation')
                <p class="auth-field-error">{{ $message }}</p>
            @enderror
        </div>

        <button type="submit" class="auth-submit">
            <i class="fa-solid fa-user-plus"></i>
            Créer mon compte
        </button>
    </form>

    <p class="auth-footer">
        Vous avez déjà un compte ?
        <a class="auth-link" href="{{ route('login') }}">Se connecter</a>
    </p>
</x-auth-layout>
