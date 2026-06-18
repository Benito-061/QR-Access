<x-profile-layout title="Mon profil">
    <div class="profile-page-header">
        <h1>Mon profil</h1>
        <p>Gérez vos informations personnelles et la sécurité de votre compte</p>
    </div>

    @include('profile.partials.update-profile-information-form')

    @include('profile.partials.update-password-form')

    @include('profile.partials.delete-user-form')
</x-profile-layout>
