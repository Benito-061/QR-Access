<div class="profile-card">
    <div class="profile-card-header">
        <h2><i class="fa-solid fa-lock"></i> Mot de passe</h2>
        <p>Utilisez un mot de passe long et unique pour protéger votre compte.</p>
    </div>

    <form method="post" action="{{ route('password.update') }}">
        @csrf
        @method('put')

        <div class="auth-field">
            <label for="update_password_current_password">Mot de passe actuel</label>
            <input id="update_password_current_password" name="current_password" type="password" autocomplete="current-password" placeholder="Mot de passe actuel">
            @error('current_password', 'updatePassword')
                <p class="auth-field-error">{{ $message }}</p>
            @enderror
        </div>

        <div class="auth-field">
            <label for="update_password_password">Nouveau mot de passe</label>
            <input id="update_password_password" name="password" type="password" autocomplete="new-password" placeholder="Nouveau mot de passe">
            @error('password', 'updatePassword')
                <p class="auth-field-error">{{ $message }}</p>
            @enderror
        </div>

        <div class="auth-field">
            <label for="update_password_password_confirmation">Confirmer le mot de passe</label>
            <input id="update_password_password_confirmation" name="password_confirmation" type="password" autocomplete="new-password" placeholder="Confirmer le nouveau mot de passe">
            @error('password_confirmation', 'updatePassword')
                <p class="auth-field-error">{{ $message }}</p>
            @enderror
        </div>

        <div class="profile-form-actions">
            <button type="submit" class="profile-btn profile-btn--primary">
                <i class="fa-solid fa-key"></i> Mettre à jour le mot de passe
            </button>
        </div>
    </form>
</div>
