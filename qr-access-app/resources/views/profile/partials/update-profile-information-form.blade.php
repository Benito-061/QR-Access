<div class="profile-card">
    <div class="profile-card-header">
        <h2><i class="fa-solid fa-id-card"></i> Informations du profil</h2>
        <p>Mettez à jour votre nom et votre adresse e-mail.</p>
    </div>

    <form id="send-verification" method="post" action="{{ route('verification.send') }}">
        @csrf
    </form>

    <form method="post" action="{{ route('profile.update') }}">
        @csrf
        @method('patch')

        <div class="auth-field">
            <label for="name">Nom complet</label>
            <input id="name" name="name" type="text" value="{{ old('name', $user->name) }}" required autofocus autocomplete="name">
            @error('name')
                <p class="auth-field-error">{{ $message }}</p>
            @enderror
        </div>

        <div class="auth-field">
            <label for="email">Adresse e-mail</label>
            <input id="email" name="email" type="email" value="{{ old('email', $user->email) }}" required autocomplete="username">
            @error('email')
                <p class="auth-field-error">{{ $message }}</p>
            @enderror

            @if ($user instanceof \Illuminate\Contracts\Auth\MustVerifyEmail && ! $user->hasVerifiedEmail())
                <p class="profile-verify-note">
                    Votre e-mail n'est pas vérifié.
                    <button type="submit" form="send-verification">Renvoyer le lien de vérification</button>
                </p>
            @endif
        </div>

        <div class="profile-form-actions">
            <button type="submit" class="profile-btn profile-btn--primary">
                <i class="fa-solid fa-check"></i> Enregistrer
            </button>
        </div>
    </form>
</div>
