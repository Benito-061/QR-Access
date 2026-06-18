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
        <a href="{{ route('dashboard') }}" class="nav-tab {{ ($activeTab ?? '') === 'dashboard' ? 'active' : '' }}" data-tab="dashboard">
            <i class="fa-solid fa-chart-line"></i><span>Tableau de bord</span>
        </a>
        <a href="{{ route('ceremonie') }}" class="nav-tab {{ ($activeTab ?? '') === 'ceremonie' ? 'active' : '' }}" data-tab="ceremonie">
            <i class="fa-solid fa-calendar-plus"></i><span>Ajouter une cérémonie</span>
        </a>
        <a href="{{ route('verify') }}" class="nav-tab {{ ($activeTab ?? '') === 'verify' ? 'active' : '' }}" data-tab="verify">
            <i class="fa-solid fa-clipboard-check"></i><span>Vérifier</span>
        </a>
        <a href="{{ route('history') }}" class="nav-tab {{ ($activeTab ?? '') === 'history' ? 'active' : '' }}" data-tab="history">
            <i class="fa-solid fa-clock-rotate-left"></i><span>Historique</span>
        </a>
        <a href="{{ route('gestion-ceremonies') }}" class="nav-tab {{ ($activeTab ?? '') === 'gestionceremonies' ? 'active' : '' }}" data-tab="gestionceremonies">
            <i class="fa-solid fa-building-columns"></i><span>Gestion des cérémonies</span>
        </a>
        <span class="nav-section-label">Compte</span>
        <a href="{{ route('profile.edit') }}" class="nav-tab {{ ($activeTab ?? '') === 'profile' ? 'active' : '' }}" data-tab="profile">
            <i class="fa-solid fa-user"></i><span>Mon profil</span>
        </a>
        <form method="POST" action="{{ route('logout') }}" class="sidebar-logout-form">
            @csrf
            <button type="submit" class="nav-tab nav-tab--logout">
                <i class="fa-solid fa-right-from-bracket"></i><span>Déconnexion</span>
            </button>
        </form>
        <span class="nav-section-label">Aide</span>
        <button type="button" class="nav-tab" onclick="openAboutModal()">
            <i class="fa-solid fa-circle-info"></i><span>À propos</span>
        </button>
    </nav>
    <div class="sidebar-footer">
        <button type="button" id="themeToggleBtn" class="nav-tab theme-toggle-btn" onclick="toggleTheme()">
            <i class="fa-solid fa-moon"></i><span>Mode nuit</span>
        </button>
    </div>
</aside>
