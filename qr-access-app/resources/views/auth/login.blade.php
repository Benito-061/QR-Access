<x-auth-layout title="Connexion">
    <div class="auth-form-header">
        <h2>Connexion</h2>
        <p>Accédez à votre espace QR Access Manager</p>
    </div>

    <form method="POST" action="{{ route('login') }}">
        @csrf

        <div class="auth-field">
            <label for="email">Adresse e-mail</label>
            <input
                id="email"
                type="email"
                name="email"
                value="{{ old('email') }}"
                required
                autofocus
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
                autocomplete="current-password"
                placeholder="Votre mot de passe"
            >
            @error('password')
                <p class="auth-field-error">{{ $message }}</p>
            @enderror
        </div>

        <div class="auth-row">
            <label class="auth-remember" for="remember_me">
                <input id="remember_me" type="checkbox" name="remember">
                Se souvenir de moi
            </label>

            @if (Route::has('password.request'))
                <a class="auth-link" href="{{ route('password.request') }}">
                    Mot de passe oublié ?
                </a>
            @endif
        </div>

        <button type="submit" class="auth-submit">
            <i class="fa-solid fa-right-to-bracket"></i>
            Se connecter
        </button>
    </form>

    @if (Route::has('register'))
        <p class="auth-footer">
            Pas encore de compte ?
            <a class="auth-link" href="{{ route('register') }}">Créer un compte</a>
        </p>
    @endif

    <p class="auth-footer" style="margin-top: 8px;">
        <a class="auth-link" href="{{ route('welcome') }}"><i class="fa-solid fa-arrow-left"></i> Retour au choix de connexion</a>
    </p>
</x-auth-layout>
