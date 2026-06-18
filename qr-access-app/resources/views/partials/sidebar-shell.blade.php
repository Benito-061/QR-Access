<div class="app-layout">
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
            <nav class="nav-tabs sidebar-nav">
                <span class="nav-section-label">Menu principal</span>
                <button type="button" class="nav-tab" onclick="switchTab('dashboard', this)">
                    <i class="fa-solid fa-chart-line"></i><span>Tableau de bord</span>
                </button>
                <button type="button" class="nav-tab" onclick="switchTab('ceremonie', this)">
                    <i class="fa-solid fa-calendar-plus"></i><span>Ajouter une cérémonie</span>
                </button>
                <button type="button" class="nav-tab" onclick="switchTab('verify', this)">
                    <i class="fa-solid fa-clipboard-check"></i><span>Vérifier</span>
                </button>
                <button type="button" class="nav-tab" onclick="switchTab('history', this)">
                    <i class="fa-solid fa-clock-rotate-left"></i><span>Historique</span>
                </button>
                <button type="button" class="nav-tab" onclick="switchTab('gestionceremonies', this)">
                    <i class="fa-solid fa-building-columns"></i><span>Gestion des cérémonies</span>
                </button>
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
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar(false)"></div>
        <main class="main-wrapper">
            <div class="mobile-topbar">
                <button type="button" class="sidebar-toggle" onclick="toggleSidebar()" aria-label="Menu">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <span class="mobile-title">QR Access Manager</span>
            </div>