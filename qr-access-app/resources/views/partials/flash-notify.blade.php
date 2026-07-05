<div id="qr-notify-stack" class="qr-notify-stack" aria-live="polite"></div>

@php
    $notifySuccess = session('notify_success') ?? match(session('status')) {
        'profile-updated' => 'Vos informations ont été enregistrées dans la base de données.',
        'password-updated' => 'Votre mot de passe a été mis à jour avec succès.',
        'verification-link-sent' => 'Un nouveau lien de vérification a été envoyé par e-mail.',
        default => null,
    };
    $notifyError = session('notify_error');
    if (! $notifyError && isset($errors) && is_object($errors) && method_exists($errors, 'any') && $errors->any()) {
        $notifyError = $errors->first();
    }
@endphp

@if ($notifySuccess)
    <div class="form-feedback form-feedback--success" role="status">
        <i class="fa-solid fa-circle-check"></i>
        <span>{{ $notifySuccess }}</span>
    </div>
@endif

@if ($notifyError)
    <div class="form-feedback form-feedback--error" role="alert">
        <i class="fa-solid fa-circle-xmark"></i>
        <span>{{ $notifyError }}</span>
    </div>
@endif

@if ($notifySuccess || $notifyError)
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof QrAccessNotify === 'undefined') return;
            @if ($notifySuccess)
            QrAccessNotify.success('Enregistrement réussi', @json($notifySuccess));
            @endif
            @if ($notifyError)
            QrAccessNotify.error('Échec de l\'enregistrement', @json($notifyError));
            @endif
        });
    </script>
@endif
