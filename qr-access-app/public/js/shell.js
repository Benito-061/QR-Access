(function () {
    'use strict';

    function toggleSidebar(forceOpen) {
        var sidebar = document.getElementById('sidebar');
        var overlay = document.getElementById('sidebarOverlay');
        if (!sidebar || !overlay) return;
        var shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !sidebar.classList.contains('open');
        sidebar.classList.toggle('open', shouldOpen);
        overlay.classList.toggle('active', shouldOpen);
    }

    function updateThemeButton() {
        var btn = document.getElementById('themeToggleBtn');
        if (!btn) return;
        var isDark = document.body.classList.contains('dark-theme');
        var icon = btn.querySelector('i');
        var label = btn.querySelector('span');
        if (icon) {
            icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
        if (label) {
            label.textContent = isDark ? 'Mode jour' : 'Mode nuit';
        }
    }

    function toggleTheme() {
        var isDark = document.body.classList.toggle('dark-theme');
        try {
            localStorage.setItem('themeMode', isDark ? 'dark' : 'light');
        } catch (e) { /* ignore */ }
        updateThemeButton();
    }

    function openAboutModal() {
        var modal = document.getElementById('aboutModal');
        if (modal) modal.style.display = 'flex';
    }

    function closeAboutModal() {
        var modal = document.getElementById('aboutModal');
        if (modal) modal.style.display = 'none';
    }

    function openDeleteModal() {
        var modal = document.getElementById('deleteAccountModal');
        if (modal) modal.classList.add('active');
    }

    function closeDeleteModal() {
        var modal = document.getElementById('deleteAccountModal');
        if (modal) modal.classList.remove('active');
    }

    function openSignUpModal() {
        var registerUrl = document.querySelector('meta[name="register-url"]');
        if (registerUrl && registerUrl.getAttribute('content')) {
            window.location.href = registerUrl.getAttribute('content');
            return;
        }
        var m = document.getElementById('signupModal');
        if (m) m.style.display = 'flex';
    }

    function openModalById(id) {
        var modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
        }
    }

    function closeModalById(id) {
        var modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    }

    window.openSignUpModal = openSignUpModal;
    window.openModalById = openModalById;
    window.closeModalById = closeModalById;
    window.toggleSidebar = toggleSidebar;
    window.toggleTheme = toggleTheme;
    window.openAboutModal = openAboutModal;
    window.closeAboutModal = closeAboutModal;
    window.openDeleteModal = openDeleteModal;
    window.closeDeleteModal = closeDeleteModal;

    document.addEventListener('DOMContentLoaded', function () {
        var savedTheme = localStorage.getItem('themeMode');
        if (savedTheme === 'light') {
            document.body.classList.remove('dark-theme');
        } else {
            document.body.classList.add('dark-theme');
        }
        updateThemeButton();

        var scrollBtn = document.getElementById('scrollToTopBtn');
        if (scrollBtn) {
            window.addEventListener('scroll', function () {
                scrollBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
            });
            scrollBtn.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        document.querySelectorAll('.modal').forEach(function (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    modal.classList.remove('active');
                }
            });
        });
    });
})();
