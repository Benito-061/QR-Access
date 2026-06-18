/**
 * Pont localStorage ↔ API Laravel (/api/sync).
 */
(function (global) {
    'use strict';

    var SYNC_KEYS = ['ceremonies', 'visitors', 'accessLog', 'managedCeremonies'];
    var cache = {};
    var native = global.localStorage;
    var saveTimer = null;

    function appBase() {
        var el = document.querySelector('meta[name="app-base"]');
        return (el && el.getAttribute('content')) ? el.getAttribute('content').replace(/\/$/, '') : '';
    }

    function syncUrl() {
        return appBase() + '/api/sync';
    }

    function csrfToken() {
        var el = document.querySelector('meta[name="csrf-token"]');
        return el ? el.getAttribute('content') : '';
    }

    function headers() {
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        };
    }

    function notifyError(title, message) {
        if (global.QrAccessNotify) {
            global.QrAccessNotify.error(title || 'Échec de l\'enregistrement', message || 'Les données n\'ont pas pu être sauvegardées.');
        }
    }

    function notifySuccess(title, message) {
        if (global.QrAccessNotify) {
            global.QrAccessNotify.success(title || 'Enregistrement réussi', message || 'Les données ont été sauvegardées dans la base de données.');
        }
    }

    function shouldSkipEmpty(key, value) {
        if (!Array.isArray(value)) {
            return false;
        }
        if (key === 'ceremonies' && value.length === 0) {
            return true;
        }
        return false;
    }

    function populateCache(data) {
        SYNC_KEYS.forEach(function (key) {
            if (data[key] === undefined) {
                return;
            }
            if (shouldSkipEmpty(key, data[key])) {
                return;
            }
            cache[key] = JSON.stringify(data[key]);
        });
    }

    function buildPayload() {
        var payload = {};
        SYNC_KEYS.forEach(function (key) {
            if (cache[key]) {
                try {
                    payload[key] = JSON.parse(cache[key]);
                } catch (e) {
                    /* ignore */
                }
            }
        });
        return payload;
    }

    function postToServer(options) {
        options = options || {};
        return fetch(syncUrl(), {
            method: 'POST',
            headers: headers(),
            credentials: 'same-origin',
            body: JSON.stringify(buildPayload()),
        }).then(function (res) {
            if (!res.ok) {
                throw new Error('HTTP ' + res.status);
            }
            return res.json();
        }).then(function (data) {
            if (!options.silent) {
                notifySuccess(options.successTitle, options.successMessage);
            }
            return data;
        }).catch(function (err) {
            notifyError(
                options.errorTitle,
                options.errorMessage || 'Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.'
            );
            throw err;
        });
    }

    function saveToServer() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            postToServer({ silent: true }).catch(function () {
                notifyError(
                    'Synchronisation échouée',
                    'Vos modifications locales n\'ont pas été enregistrées sur le serveur.'
                );
            });
        }, 900);
    }

    var storageProxy = {
        getItem: function (key) {
            if (SYNC_KEYS.indexOf(key) !== -1 && cache[key] !== undefined) {
                return cache[key];
            }
            return native.getItem(key);
        },
        setItem: function (key, value) {
            if (SYNC_KEYS.indexOf(key) !== -1) {
                cache[key] = String(value);
                saveToServer();
            }
            try {
                native.setItem(key, value);
            } catch (e) {
                /* ignore */
            }
        },
        removeItem: function (key) {
            if (SYNC_KEYS.indexOf(key) !== -1) {
                delete cache[key];
                saveToServer();
            }
            native.removeItem(key);
        },
        clear: function () {
            SYNC_KEYS.forEach(function (key) {
                delete cache[key];
            });
            native.clear();
        },
        key: function (index) {
            return native.key(index);
        },
        get length() {
            return native.length;
        },
    };

    try {
        Object.defineProperty(global, 'localStorage', {
            configurable: true,
            get: function () {
                return storageProxy;
            },
        });
    } catch (e) {
        console.warn('localStorage proxy not applied:', e);
    }

    global.QrAccessBridge = {
        init: function () {
            return fetch(syncUrl(), {
                method: 'GET',
                headers: headers(),
                credentials: 'same-origin',
            }).then(function (res) {
                if (!res.ok) {
                    throw new Error('HTTP ' + res.status);
                }
                return res.json();
            }).then(function (data) {
                populateCache(data);
            }).catch(function (err) {
                notifyError(
                    'Chargement des données',
                    'Impossible de charger vos données depuis le serveur.'
                );
                throw err;
            });
        },
        persistNow: function (options) {
            clearTimeout(saveTimer);
            return postToServer(options || {});
        },
        notifyError: notifyError,
        notifySuccess: notifySuccess,
    };
})(window);
