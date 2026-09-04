<aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
        <div class="logo">
            <div class="logo-icon"><i class="fa-solid fa-qrcode"></i></div>
            <div class="logo-text-wrap">
                <span class="logo-text">QR Access</span>
                <span class="logo-sub">Manager</span>
            </div>
        </div>
    </div>
    <nav class="sidebar-nav">
        <span class="nav-section-label">Menu principal</span>
        <a href="{{ route('dashboard') }}" class="nav-tab mobile-bottom-item {{ ($activeTab ?? '') === 'dashboard' ? 'active' : '' }}" data-tab="dashboard"><i class="fa-solid fa-chart-line"></i><span>Tableau de bord</span></a>
        <a href="{{ route('ceremonie') }}" class="nav-tab mobile-bottom-item {{ ($activeTab ?? '') === 'ceremonie' ? 'active' : '' }}" data-tab="ceremonie"><i class="fa-solid fa-calendar-plus"></i><span>Ajouter une cérémonie</span></a>
        <a href="{{ route('verify') }}" class="nav-tab mobile-bottom-item {{ ($activeTab ?? '') === 'verify' ? 'active' : '' }}" data-tab="verify"><i class="fa-solid fa-clipboard-check"></i><span>Vérifier</span></a>
        <a href="{{ route('history') }}" class="nav-tab mobile-bottom-item {{ ($activeTab ?? '') === 'history' ? 'active' : '' }}" data-tab="history"><i class="fa-solid fa-clock-rotate-left"></i><span>Historique</span></a>
        <a href="{{ route('gestion-ceremonies') }}" class="nav-tab mobile-bottom-item {{ ($activeTab ?? '') === 'gestionceremonies' ? 'active' : '' }}" data-tab="gestionceremonies"><i class="fa-solid fa-building-columns"></i><span>Gestion des cérémonies</span></a>
        <a href="{{ route('downloads') }}" class="nav-tab {{ ($activeTab ?? '') === 'downloads' ? 'active' : '' }}" data-tab="downloads"><i class="fa-solid fa-file-arrow-down"></i><span>Rapport downloads</span></a>
        <a href="{{ route('trash') }}" class="nav-tab {{ ($activeTab ?? '') === 'trash' ? 'active' : '' }}" data-tab="trash"><i class="fa-solid fa-trash-can"></i><span>Corbeille</span></a>
        <span class="nav-section-label">Compte</span>
        <a href="{{ route('profile.edit') }}" class="nav-tab {{ ($activeTab ?? '') === 'profile' ? 'active' : '' }}" data-tab="profile"><i class="fa-solid fa-user"></i><span>Mon profil</span></a>
        <form method="POST" action="{{ route('logout') }}" class="sidebar-logout-form">
            @csrf
            <button type="submit" class="nav-tab nav-tab--logout"><i class="fa-solid fa-right-from-bracket"></i><span>Déconnexion</span></button>
        </form>
    </nav>
</aside>
