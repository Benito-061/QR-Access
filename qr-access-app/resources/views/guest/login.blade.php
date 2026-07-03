<x-auth-layout title="Connexion invité">
    <x-slot:hero>
        <div class="auth-hero-inner">
            <div class="auth-brand">
                <div class="auth-brand-icon"><i class="fa-solid fa-gift"></i></div>
                <div class="auth-brand-text">
                    <span class="auth-brand-name">QR Access</span>
                    <span class="auth-brand-sub">Espace invité</span>
                </div>
            </div>

            <h1>Enregistrez votre cadeau pour la cérémonie</h1>
            <p class="auth-hero-lead">
                Connectez-vous avec le code rapide reçu sur votre invitation pour déposer
                un cadeau en toute simplicité.
            </p>

            <ul class="auth-features">
                <li>
                    <i class="fa-solid fa-hashtag"></i>
                    <span><strong>Code rapide</strong> — les 5 chiffres figurant sur votre invitation.</span>
                </li>
                <li>
                    <i class="fa-solid fa-mobile-screen"></i>
                    <span><strong>Téléphone</strong> — demandé si plusieurs invités partagent le même code.</span>
                </li>
                <li>
                    <i class="fa-solid fa-gift"></i>
                    <span><strong>Cadeau uniquement</strong> — vous ne pouvez qu'ajouter un cadeau à la cérémonie.</span>
                </li>
            </ul>

            <p class="auth-hero-footer">© {{ date('Y') }} QR Access Manager</p>
        </div>
    </x-slot:hero>

    <div class="auth-form-header">
        <h2>Connexion invité</h2>
        <p>Utilisez votre code d'invitation</p>
    </div>

    <form method="POST" action="{{ route('invitee.login.store') }}">
        @csrf

        <div class="auth-field">
            <label for="quick_code">Code rapide (5 chiffres)</label>
            <input
                id="quick_code"
                type="text"
                name="quick_code"
                value="{{ old('quick_code') }}"
                required
                autofocus
                maxlength="5"
                pattern="\d{5}"
                inputmode="numeric"
                placeholder="Ex: 45821"
            >
            @error('quick_code')
                <p class="auth-field-error">{{ $message }}</p>
            @enderror
        </div>

        <div class="auth-field">
            <label for="phone">Téléphone <span style="color:#94a3b8;font-weight:400;">(si demandé)</span></label>
            <input
                id="phone"
                type="tel"
                name="phone"
                value="{{ old('phone') }}"
                autocomplete="tel"
                placeholder="Ex: +243 991 048 061"
            >
            @error('phone')
                <p class="auth-field-error">{{ $message }}</p>
            @enderror
        </div>

        <button type="submit" class="auth-submit">
            <i class="fa-solid fa-right-to-bracket"></i>
            Se connecter en tant qu'invité
        </button>
    </form>

    <p class="auth-footer">
        <a class="auth-link" href="{{ route('welcome') }}"><i class="fa-solid fa-arrow-left"></i> Retour au choix de connexion</a>
        ·
        <a class="auth-link" href="{{ route('login') }}">Connexion administrateur</a>
    </p>
</x-auth-layout>
