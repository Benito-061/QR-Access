/**
 * Notifications succès / erreur — QR Access Manager
 */
(function (global) {
    'use strict';

    var DEFAULT_DURATION = 5000;
    var stack;

    function ensureStack() {
        if (!stack) {
            stack = document.getElementById('qr-notify-stack');
        }
        if (!stack) {
            stack = document.createElement('div');
            stack.id = 'qr-notify-stack';
            stack.className = 'qr-notify-stack';
            stack.setAttribute('aria-live', 'polite');
            document.body.appendChild(stack);
        }
        return stack;
    }

    function iconFor(type) {
        if (type === 'success') return 'fa-solid fa-circle-check';
        if (type === 'error') return 'fa-solid fa-circle-xmark';
        return 'fa-solid fa-circle-info';
    }

    function removeNotify(el) {
        if (!el || !el.parentNode) return;
        el.classList.add('qr-notify--leaving');
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 350);
    }

    function show(type, title, message, duration) {
        var container = ensureStack();
        var el = document.createElement('div');
        el.className = 'qr-notify qr-notify--' + type;

        var icon = document.createElement('div');
        icon.className = 'qr-notify__icon';
        icon.innerHTML = '<i class="' + iconFor(type) + '"></i>';

        var body = document.createElement('div');
        body.className = 'qr-notify__body';

        var titleEl = document.createElement('div');
        titleEl.className = 'qr-notify__title';
        titleEl.textContent = title || '';

        var msgEl = document.createElement('div');
        msgEl.className = 'qr-notify__message';
        msgEl.textContent = message || '';

        body.appendChild(titleEl);
        if (message) body.appendChild(msgEl);

        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'qr-notify__close';
        close.setAttribute('aria-label', 'Fermer');
        close.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        close.addEventListener('click', function () { removeNotify(el); });

        el.appendChild(icon);
        el.appendChild(body);
        el.appendChild(close);
        container.appendChild(el);

        var ms = typeof duration === 'number' ? duration : DEFAULT_DURATION;
        if (ms > 0) {
            setTimeout(function () { removeNotify(el); }, ms);
        }

        return el;
    }

    global.QrAccessNotify = {
        success: function (title, message, duration) {
            return show('success', title || 'Succès', message, duration);
        },
        error: function (title, message, duration) {
            return show('error', title || 'Erreur', message, duration);
        },
        info: function (title, message, duration) {
            return show('info', title || 'Information', message, duration);
        },
        fromSession: function (data) {
            if (!data) return;
            if (data.success) {
                this.success(data.successTitle || 'Succès', data.successMessage || data.success);
            }
            if (data.error) {
                this.error(data.errorTitle || 'Erreur', data.errorMessage || data.error);
            }
        },
    };
})(window);
