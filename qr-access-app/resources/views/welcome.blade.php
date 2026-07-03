<x-auth-layout title="Bienvenue">
    <div class="auth-form-header">
        <h2>Bienvenue</h2>
        <p>Comment souhaitez-vous accéder à QR Access Manager ?</p>
    </div>

    <div class="role-choice-grid">
        <a href="{{ route('login') }}" class="role-choice-card role-choice-card--admin">
            <span class="role-choice-icon"><i class="fa-solid fa-user-shield"></i></span>
            <span class="role-choice-title">Admin / Organisateur</span>
            <span class="role-choice-desc">Gérer les cérémonies, invités, QR codes et vérifications.</span>
            <span class="role-choice-action">Se connecter <i class="fa-solid fa-arrow-right"></i></span>
        </a>

        <a href="{{ route('invitee.login') }}" class="role-choice-card role-choice-card--guest">
            <span class="role-choice-icon"><i class="fa-solid fa-gift"></i></span>
            <span class="role-choice-title">Invité</span>
            <span class="role-choice-desc">Accéder à votre espace pour déposer un cadeau à la cérémonie.</span>
            <span class="role-choice-action">Connexion invité <i class="fa-solid fa-arrow-right"></i></span>
        </a>
    </div>
</x-auth-layout>
