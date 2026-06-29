@php($active = $activeTab ?? 'dashboard')
<nav class="mobile-bottom-nav" id="mobileBottomNav" aria-label="Navigation principale">
    <a href="{{ route('dashboard') }}"
       class="mobile-nav-item{{ $active === 'dashboard' ? ' active' : '' }}"
       data-tab="dashboard">
        <i class="fa-solid fa-chart-line" aria-hidden="true"></i>
        <span>Accueil</span>
    </a>
    <a href="{{ route('ceremonie') }}"
       class="mobile-nav-item{{ $active === 'ceremonie' ? ' active' : '' }}"
       data-tab="ceremonie">
        <i class="fa-solid fa-calendar-plus" aria-hidden="true"></i>
        <span>Cérémonie</span>
    </a>
    <a href="{{ route('verify') }}"
       class="mobile-nav-item{{ $active === 'verify' ? ' active' : '' }}"
       data-tab="verify">
        <i class="fa-solid fa-clipboard-check" aria-hidden="true"></i>
        <span>Vérifier</span>
    </a>
    <a href="{{ route('history') }}"
       class="mobile-nav-item{{ $active === 'history' ? ' active' : '' }}"
       data-tab="history">
        <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
        <span>Historique</span>
    </a>
    <a href="{{ route('gestion-ceremonies') }}"
       class="mobile-nav-item{{ $active === 'gestionceremonies' ? ' active' : '' }}"
       data-tab="gestionceremonies">
        <i class="fa-solid fa-building-columns" aria-hidden="true"></i>
        <span>Gestion</span>
    </a>
    <button type="button"
            class="mobile-nav-item mobile-nav-item--menu{{ in_array($active, ['profile'], true) ? ' active' : '' }}"
            onclick="toggleSidebar(true)"
            aria-label="Ouvrir le menu compte et paramètres">
        <i class="fa-solid fa-user-circle" aria-hidden="true"></i>
        <span>Compte</span>
    </button>
</nav>
