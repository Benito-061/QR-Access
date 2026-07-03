

      
                // Modal A propos
                function openAboutModal() {
                    document.getElementById('aboutModal').style.display = 'flex';
                }
                function closeAboutModal() {
                    document.getElementById('aboutModal').style.display = 'none';
                }

                // Modal Inscription handlers
                function openSignUpModal() {
                    const m = document.getElementById('signupModal');
                    if (m) m.style.display = 'flex';
                }
                function closeSignUpModal() {
                    const m = document.getElementById('signupModal');
                    if (m) m.style.display = 'none';
                }

                function handleSignUp(e) {
                    e.preventDefault();
                    var registerUrl = document.querySelector('meta[name="register-url"]');
                    if (registerUrl && registerUrl.getAttribute('content')) {
                        window.location.href = registerUrl.getAttribute('content');
                    }
                }
        // Son spécifique pour chaque onglet
        document.addEventListener('DOMContentLoaded', function() {
            document.body.addEventListener('click', function(e) {
                const tabBtn = e.target.classList.contains('nav-tab') ? e.target : e.target.closest('.nav-tab');
                if (tabBtn) {
                    if (tabBtn.textContent.includes('Tableau de bord')) playSound('dashboard');
                    else if (tabBtn.textContent.includes('Ajouter un rendez-vous')) playSound('create');
                    else if (tabBtn.textContent.includes('Cérémonie')) playSound('ceremonie');
                    else if (tabBtn.textContent.includes('Vérifier')) playSound('verify');
                    else if (tabBtn.textContent.includes('Historique')) playSound('history');
                    else playSound('section');
                } else if (e.target.classList.contains('btn') || e.target.closest('.btn')) {
                    playSound('click');
                }
            });
        });

        function playSound(type) {
            try {
                const ctx = getAudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                // Palette de sons par onglet
                if(type === 'dashboard') { osc.frequency.value = 660; osc.type = 'triangle'; gain.gain.setValueAtTime(0.14, ctx.currentTime); }
                else if(type === 'create') { osc.frequency.value = 880; osc.type = 'square'; gain.gain.setValueAtTime(0.13, ctx.currentTime); }
                else if(type === 'ceremonie') { osc.frequency.value = 520; osc.type = 'sine'; gain.gain.setValueAtTime(0.15, ctx.currentTime); }
                else if(type === 'verify') { osc.frequency.value = 740; osc.type = 'sawtooth'; gain.gain.setValueAtTime(0.13, ctx.currentTime); }
                else if(type === 'history') { osc.frequency.value = 600; osc.type = 'triangle'; gain.gain.setValueAtTime(0.12, ctx.currentTime); }
                else if(type === 'success') osc.frequency.value = 800;
                else if(type === 'denied') osc.frequency.value = 400;
                else if(type === 'alarm') osc.frequency.value = 600;
                else if(type === 'section') { osc.frequency.value = 900; osc.type = 'sawtooth'; gain.gain.setValueAtTime(0.13, ctx.currentTime); }
                else { osc.frequency.value = 520; gain.gain.setValueAtTime(0.08, ctx.currentTime); }
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.12);
            } catch(e) { console.warn('Audio error:', e); }
        }
        // Stockage de données 
        let visitors = JSON.parse(localStorage.getItem('visitors')) || [];
        // Correction : convertir startTime et endTime en objets Date
        visitors = visitors.map(v => {
            if (v.startTime && !(v.startTime instanceof Date)) v.startTime = new Date(v.startTime);
            if (v.endTime && !(v.endTime instanceof Date)) v.endTime = new Date(v.endTime);
            return v;
        });
        let accessLog = JSON.parse(localStorage.getItem('accessLog')) || [];
        
        // Initialiser les cérémonies AVANT DOMContentLoaded
        let ceremonies = JSON.parse(localStorage.getItem('ceremonies')) || [{ id: 1, data: {}, guests: [] }];
        let managedCeremonies = JSON.parse(localStorage.getItem('managedCeremonies')) || [];
        let activeCeremonyId = 1;
        let nextCeremonyId = Math.max(...ceremonies.map(c => c.id || 1), 1) + 1;
        
        let currentQRCode = null;
        let currentPhotoCanvas = null;
        let currentPhotoCanvasCer = null;
        let streamActive = false;
        let visitorFacing = 'user';
        let ceremonyFacing = 'user';
        let visitorStreamActive = false;
        let ceremonyStreamActive = false;
        let currentEditingGuestId = null;
        
        // Cache audio context pour éviter les créations répétées
        let cachedAudioContext = null;
        function getAudioContext() {
            if (!cachedAudioContext) {
                cachedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            return cachedAudioContext;
        }

        // Initialiser
        document.addEventListener('DOMContentLoaded', function() {
            // Initialiser les gestionnaires d'événement pour les boutons de l'onglet
            const tabButtons = document.querySelectorAll('.nav-tab');
            const tabNames = ['dashboard', 'create', 'ceremonie', 'verify', 'history'];
            
            tabButtons.forEach((button, index) => {
                if (index < tabNames.length) {
                    // Ne pas modifier les écouteurs des boutons, les onclick inline fonctionnent
                    // Cette boucle est juste pour assurer la cohérence
                }
            });
            
            // Schedule heavy renders during idle
            idle(() => { debouncedUpdateDashboard(); debouncedRenderGuestsTable(); });
            setDateTime();
            startAlarmSystem();
            updateCeremonyInfoDisplay();
            
            // Mapping complet des champs du formulaire vers les propriétés de données
            const fieldMapping = {
                'cerPhone': 'phone',
                'cerSex': 'sex',
                'cerHonorific': 'honorific',
                'cerPlace': 'place',
                'cerCapacity': 'capacity',
                'cerType': 'type',
                'cerLieu': 'location',
                'cerAddress': 'address',
                'cerContactEmail': 'contactEmail',
                'cerContactPhone': 'contactPhone',
                'cerDressCode': 'dressCode',
                'cerStart': 'startDateTime',
                'cerEglise': 'church',
                'cerEgliseAdresse': 'churchAddress',
                'cerCommune': 'commune',
                'cerPhotographe': 'photographer',
                'cerReception': 'reception',
                'cerBrideName': 'brideName',
                'cerGroomName': 'groomName',
                'cerFamily1': 'family1',
                'cerFamily2': 'family2'
            };
            // Restore last active tab (or default to 'dashboard')
            try {
                const last = window.QR_ACCESS_ACTIVE_TAB || localStorage.getItem('lastTab') || 'dashboard';
                let btn = document.querySelector('.nav-tab[data-tab="' + last + '"]');
                if (!btn) {
                    document.querySelectorAll('.nav-tab').forEach(b => {
                        const oc = b.getAttribute('onclick') || '';
                        if (oc.includes("switchTab('" + last + "'") || oc.includes('switchTab("' + last + '"')) {
                            btn = b;
                        }
                    });
                }
                switchTab(last, btn);
            } catch (e) {
                switchTab('dashboard', null);
            }
            
            // Fonction pour synchroniser les données et l'affichage
            function syncCeremonyField(fieldId) {
                const activeCeremony = ceremonies.find(c => c.id === activeCeremonyId);
                if (!activeCeremony) return;
                
                const field = document.getElementById(fieldId);
                if (!field) return;
                
                const value = field.value.trim();
                const dataProperty = fieldMapping[fieldId];
                
                if (dataProperty) {
                    activeCeremony.data[dataProperty] = value || '';
                }
                
                // Mise à jour spécifique pour le nom de la cérémonie
                if (fieldId === 'cerName') {
                    activeCeremony.data.name = value || `Cérémonie ${activeCeremonyId}`;
                    const displayField = document.getElementById('ceremonyNameDisplay');
                    if (displayField) displayField.value = activeCeremony.data.name;
                    renderCeremonyTabs();
                }
                
                // Mise à jour spécifique pour les noms des mariés
                if (fieldId === 'cerBrideName') {
                    document.getElementById('displayBrideName').textContent = value || '-';
                }
                if (fieldId === 'cerGroomName') {
                    document.getElementById('displayGroomName').textContent = value || '-';
                }
                
                // Mise à jour en temps réel pour les cartes dynamiques
                if (fieldId === 'cerEglise') {
                    const churchValue = value;
                    if (churchValue) {
                        document.getElementById('infoCerChurchCard').style.display = 'block';
                        document.getElementById('infoCerEglise').textContent = churchValue;
                    } else {
                        document.getElementById('infoCerChurchCard').style.display = 'none';
                    }
                }
                if (fieldId === 'cerCommune') {
                    const communeValue = value;
                    if (communeValue) {
                        document.getElementById('infoCerCommuneCard').style.display = 'block';
                        document.getElementById('infoCerCommune').textContent = communeValue;
                    } else {
                        document.getElementById('infoCerCommuneCard').style.display = 'none';
                    }
                }
                if (fieldId === 'cerPhotographe') {
                    const photoValue = value;
                    if (photoValue) {
                        document.getElementById('infoCerPhotoCard').style.display = 'block';
                        document.getElementById('infoCerPhotographe').textContent = photoValue;
                    } else {
                        document.getElementById('infoCerPhotoCard').style.display = 'none';
                    }
                }
                if (fieldId === 'cerReception') {
                    const receptionValue = value;
                    if (receptionValue) {
                        document.getElementById('infoCerReceptionCard').style.display = 'block';
                        document.getElementById('infoCerReception').textContent = receptionValue;
                    } else {
                        document.getElementById('infoCerReceptionCard').style.display = 'none';
                    }
                }
                
                // Mettre à jour l'affichage des cartes en temps réel
                updateCeremonyInfoDisplay();
                
                // Sauvegarder dans localStorage
                localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
                
                // Synchroniser immédiatement la cérémonie vers la gestion
                syncCeremonyToManagement(activeCeremonyId);
            }
            
            // Ajouter les écouteurs sur tous les champs
            Object.keys(fieldMapping).forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.addEventListener('input', function() {
                        syncCeremonyField(fieldId);
                    });
                    field.addEventListener('change', function() {
                        syncCeremonyField(fieldId);
                    });
                }
            });
            
            // Écouteur spécial pour cerName (champ caché)
            const cerNameField = document.getElementById('cerName');
            if (cerNameField) {
                cerNameField.addEventListener('input', function() {
                    syncCeremonyField('cerName');
                });
            }
            
            // Écouteur spécial pour ceremonyNameDisplay (champ affichage du nom)
            const ceremonyNameDisplayField = document.getElementById('ceremonyNameDisplay');
            if (ceremonyNameDisplayField) {
                ceremonyNameDisplayField.addEventListener('input', function(e) {
                    const activeCeremony = ceremonies.find(c => c.id === activeCeremonyId);
                    if (activeCeremony) {
                        const value = e.target.value.trim() || `Cérémonie ${activeCeremonyId}`;
                        activeCeremony.data.name = value;
                        document.getElementById('cerName').value = value;
                        renderCeremonyTabs();
                        updateCeremonyInfoDisplay();
                        localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
                    }
                });
                ceremonyNameDisplayField.addEventListener('change', function(e) {
                    const activeCeremony = ceremonies.find(c => c.id === activeCeremonyId);
                    if (activeCeremony) {
                        const value = e.target.value.trim() || `Cérémonie ${activeCeremonyId}`;
                        activeCeremony.data.name = value;
                        document.getElementById('cerName').value = value;
                        renderCeremonyTabs();
                        updateCeremonyInfoDisplay();
                        localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
                        syncCeremonyToManagement(activeCeremonyId);
                    }
                });
            }

            window.addEventListener('beforeunload', function() {
                localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
                localStorage.setItem('managedCeremonies', JSON.stringify(managedCeremonies));
            });
            
            // Verif auto des entrees
            document.getElementById('verifyCode').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    verifyCode();
                }
            });

            // Detection auto de l'entree du scan
            let lastInputTime = 0;
            let inputCount = 0;
            document.getElementById('verifyCode').addEventListener('input', function(e) {
                const now = Date.now();
                const timeDiff = now - lastInputTime;
                
                if (timeDiff < 50) {
                    inputCount++;
                } else {
                    inputCount = 1;
                }
                
                lastInputTime = now;
                
                // Si la saisi ressemble a un code-barres (verif les saisis consecutive)
                if (this.value.length > 5 && inputCount > 3 && timeDiff < 50) {
                    setTimeout(() => verifyCode(), 100);
                }
            });
        });

        // Definir la date et l'heure actuelle comme valeur par defaut
        function setDateTime() {
            const now = new Date();
            const startInput = document.getElementById('startDateTime');
            const endInput = document.getElementById('endDateTime');
            const cerStartInput = document.getElementById('cerStart');
            const cerEndInput = document.getElementById('cerEnd');
            
            if (startInput) startInput.value = now.toISOString().slice(0, 16);
            if (endInput) {
                const later = new Date(now.getTime() + 2 * 60 * 60000);
                endInput.value = later.toISOString().slice(0, 16);
            }
            
            if (cerStartInput) cerStartInput.value = now.toISOString().slice(0, 16);
            if (cerEndInput) {
                const later = new Date(now.getTime() + 4 * 60 * 60000);
                cerEndInput.value = later.toISOString().slice(0, 16);
            }
        }

        // Système de détection d'appareil
        function getDeviceFingerprint() {
            return btoa(navigator.userAgent + navigator.language + screen.width + 'x' + screen.height);
        }

        function validateDeviceAccess() {
            const currentDevice = getDeviceFingerprint();
            const storedDevice = localStorage.getItem('deviceFingerprint');
            if (storedDevice !== currentDevice) {
                localStorage.setItem('deviceFingerprint', currentDevice);
                return false;
            }
            return true;
        }

        // La protection par mot de passe a été supprimée, toujours déverrouillé
        let createTabUnlocked = true;
        let ceremonyTabUnlocked = true;

        // === PERFORMANCE HELPERS ===
        // Simple selector cache
        const _elCache = {};
        function $id(id) {
            if (!_elCache[id]) _elCache[id] = document.getElementById(id);
            return _elCache[id];
        }

        // Debounce utility
        function debounce(fn, wait = 120, immediate = false) {
            let timeout;
            return function(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) fn.apply(this, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) fn.apply(this, args);
            };
        }

        // requestIdleCallback fallback
        const idle = window.requestIdleCallback || function(cb){ return setTimeout(cb, 50); };


        function toggleSidebar(forceOpen) {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            if (!sidebar || !overlay) return;
            const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !sidebar.classList.contains('open');
            sidebar.classList.toggle('open', shouldOpen);
            overlay.classList.toggle('active', shouldOpen);
        }

        function switchTab(tabName, buttonElement) {
            console.log('switchTab called with:', tabName);
            if (window.innerWidth <= 992) toggleSidebar(false);
            
            // Supp class active de tous les onglets et boutons
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
                tab.style.display = 'none';
            });
            document.querySelectorAll('.sidebar-nav .nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Ajouter class active a l'onglet selectionne
            const tabElement = document.getElementById(tabName);
            console.log('Tab element found:', !!tabElement, 'ID:', tabName);
            if (tabElement) {
                tabElement.classList.add('active');
                tabElement.style.display = 'block';
            } else {
                console.error('Tab not found:', tabName);
            }
            
            // Ajouter class active au bouton selectionne
            if (buttonElement) {
                buttonElement.classList.add('active');
            } else {
                const navLink = document.querySelector('.sidebar-nav a.nav-tab[data-tab="' + tabName + '"]');
                if (navLink) navLink.classList.add('active');
            }

            // Actualiser les donnees si on retourne au dashboard ou a l'historique
            try { localStorage.setItem('lastTab', tabName); } catch(e) { /* ignore */ }
            if (tabName === 'dashboard') updateDashboard();
            if (tabName === 'history') {
                reloadAppDataFromStorage();
                initHistorySearch();
                updateAccessLog();
                const historyQuery = document.getElementById('historySearch')?.value.trim();
                if (historyQuery) performHistorySearch();
            }
            if (tabName === 'gestionceremonies') {
                syncAllCeremonies();
                loadCeremonySelector();
                debouncedUpdateCeremonyReport();
                debouncedRenderCeremoniesList();
            }
        }

        // Fonction d'authentification
        function requireAuth() {
            return true; // Toujours autorisé
        }

        function parseAppDate(value) {
            if (!value) return null;
            if (value instanceof Date) return value;
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d;
        }

        function isCeremonyActive(ceremony, now) {
            const data = ceremony.data || {};
            const start = parseAppDate(data.startDateTime || data.weddingDate);
            const end = parseAppDate(data.endDateTime);
            if (start && end) return now >= start && now <= end;
            if (start) {
                const defaultEnd = new Date(start.getTime() + 4 * 60 * 60000);
                return now >= start && now <= defaultEnd;
            }
            return false;
        }

        function refreshAppViews() {
            try {
                if (typeof updateDashboard === 'function') updateDashboard();
                if (typeof updateCeremonyInfoDisplay === 'function') updateCeremonyInfoDisplay();
                if (typeof renderCeremonyTabs === 'function') renderCeremonyTabs();
                if (typeof debouncedRenderCeremoniesList === 'function') debouncedRenderCeremoniesList();
                if (typeof debouncedUpdateCeremonyReport === 'function') debouncedUpdateCeremonyReport();
                if (typeof updateAccessLog === 'function') updateAccessLog();
            } catch (e) {
                console.warn('refreshAppViews:', e);
            }
        }

        function qrPersist(opts) {
            opts = opts || {};
            var promise;
            if (window.QrAccessBridge && QrAccessBridge.persistNow) {
                promise = QrAccessBridge.persistNow(opts);
            } else {
                if (window.QrAccessNotify) {
                    QrAccessNotify.success(
                        opts.successTitle || 'Enregistrement réussi',
                        opts.successMessage || 'Les données ont été sauvegardées dans la base de données.'
                    );
                }
                promise = Promise.resolve();
            }
            return promise.then(function (data) {
                if (!opts.skipRefresh) {
                    refreshAppViews();
                }
                if (typeof opts.afterSuccess === 'function') {
                    opts.afterSuccess();
                }
                return data;
            });
        }

        function qrNotifyError(title, message) {
            if (window.QrAccessBridge && QrAccessBridge.notifyError) {
                QrAccessBridge.notifyError(title, message);
            } else if (window.QrAccessNotify) {
                QrAccessNotify.error(title, message);
            }
        }

        function saveCeremonyDataWithNotify() {
            saveCeremonyData();
            return qrPersist({
                successTitle: 'Cérémonie enregistrée',
                successMessage: 'Les informations de la cérémonie ont été sauvegardées dans la base de données.',
                afterSuccess: function () {
                    hideCeremonyForm();
                },
            });
        }

        // Fonction de la camera pour la capture de photo du visiteur
        function startCamera() {
            if (!requireAuth()) return;
            const video = document.getElementById('videoCapture');
            const startBtn = document.getElementById('startCameraBtn');
            const captureBtn = document.getElementById('capturePhotoBtn');
            const stopBtn = document.getElementById('stopCameraBtn');
            const statusDiv = document.getElementById('cameraStatus');
            const constraints = { video: { facingMode: visitorFacing }, audio: false };
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function(stream) {
                    video.srcObject = stream;
                    video.style.display = 'block';
                    visitorStreamActive = true;
                    startBtn.style.display = 'none';
                    captureBtn.style.display = 'inline-block';
                    stopBtn.style.display = 'inline-block';
                    statusDiv.textContent = 'Caméra active - Cliquez sur "Prendre Photo"';
                    statusDiv.style.color = '#10b981';
                })
                .catch(function(error) {
                    statusDiv.textContent = '❌ Erreur: Impossible d\'accéder à la caméra. Vérifiez les permissions.';
                    statusDiv.style.color = '#ef4444';
                    console.error('Erreur caméra:', error);
                });
        }

        function capturePhoto() {
            const video = document.getElementById('videoCapture');
            const preview = document.getElementById('photoPreview');
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);

            currentPhotoCanvas = canvas;
            preview.src = canvas.toDataURL('image/jpeg', 0.9);
            preview.style.display = 'block';

            document.getElementById('capturePhotoBtn').style.display = 'none';
            document.getElementById('stopCameraBtn').style.display = 'none';
            document.getElementById('clearPhotoBtn').style.display = 'inline-block';
            document.getElementById('startCameraBtn').style.display = 'inline-block';

            stopCamera();
            document.getElementById('cameraStatus').textContent = '✓ Photo capturée avec succès!';
            document.getElementById('cameraStatus').style.color = '#10b981';
        }

        function stopCamera() {
            const video = document.getElementById('videoCapture');
            if (video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                video.srcObject = null;
                video.style.display = 'none';
                visitorStreamActive = false;
            }

            if (!document.getElementById('photoPreview').src || !document.getElementById('photoPreview').src.includes('data:')) {
                document.getElementById('startCameraBtn').style.display = 'inline-block';
                document.getElementById('capturePhotoBtn').style.display = 'none';
                document.getElementById('stopCameraBtn').style.display = 'none';
            }
        }

        function clearPhoto() {
            const preview = document.getElementById('photoPreview');
            preview.src = '';
            preview.style.display = 'none';
            currentPhotoCanvas = null;

            document.getElementById('startCameraBtn').style.display = 'inline-block';
            document.getElementById('clearPhotoBtn').style.display = 'none';
            document.getElementById('cameraStatus').textContent = 'Photo supprimée - Cliquez sur "Démarrer Caméra"';
            document.getElementById('cameraStatus').style.color = '#6b7280';
        }

                // Camera pour la cérémonie
                function startCameraCer() {
                    if (!requireAuth()) return;
                    const video = document.getElementById('videoCaptureCer');
                    const startBtn = document.getElementById('startCameraBtnCer');
                    const captureBtn = document.getElementById('capturePhotoBtnCer');
                    const stopBtn = document.getElementById('stopCameraBtnCer');
                    const statusDiv = document.getElementById('cameraStatusCer');
                    const constraints = { video: { facingMode: ceremonyFacing }, audio: false };
                    navigator.mediaDevices.getUserMedia(constraints)
                        .then(function(stream) {
                            video.srcObject = stream;
                            video.style.display = 'block';
                            ceremonyStreamActive = true;
                            startBtn.style.display = 'none';
                            captureBtn.style.display = 'inline-block';
                            stopBtn.style.display = 'inline-block';
                            statusDiv.textContent = 'Caméra active - Cliquez sur "Prendre Photo"';
                            statusDiv.style.color = '#10b981';
                        })
                        .catch(function(error) {
                            statusDiv.textContent = '❌ Erreur: Impossible d\'accéder à la caméra. Vérifiez les permissions.';
                            statusDiv.style.color = '#ef4444';
                            console.error('Erreur caméra (ceremonie):', error);
                        });
                }

                function capturePhotoCer() {
                    const video = document.getElementById('videoCaptureCer');
                    const preview = document.getElementById('photoPreviewCer');
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');

                    canvas.width = video.videoWidth || 320;
                    canvas.height = video.videoHeight || 240;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);

                    currentPhotoCanvasCer = canvas;
                    preview.src = canvas.toDataURL('image/jpeg', 0.9);
                    preview.style.display = 'block';

                    document.getElementById('capturePhotoBtnCer').style.display = 'none';
                    document.getElementById('stopCameraBtnCer').style.display = 'none';
                    document.getElementById('clearPhotoBtnCer').style.display = 'inline-block';
                    document.getElementById('startCameraBtnCer').style.display = 'inline-block';

                    stopCameraCer();
                    document.getElementById('cameraStatusCer').textContent = '✓ Photo capturée avec succès!';
                    document.getElementById('cameraStatusCer').style.color = '#10b981';
                }

                function stopCameraCer() {
                    const video = document.getElementById('videoCaptureCer');
                    if (video && video.srcObject) {
                        const tracks = video.srcObject.getTracks();
                        tracks.forEach(track => track.stop());
                        video.srcObject = null;
                        video.style.display = 'none';
                        ceremonyStreamActive = false;
                    }

                    if (!document.getElementById('photoPreviewCer').src || !document.getElementById('photoPreviewCer').src.includes('data:')) {
                        document.getElementById('startCameraBtnCer').style.display = 'inline-block';
                        document.getElementById('capturePhotoBtnCer').style.display = 'none';
                        document.getElementById('stopCameraBtnCer').style.display = 'none';
                    }
                }

                function clearPhotoCer() {
                    const preview = document.getElementById('photoPreviewCer');
                    preview.src = '';
                    preview.style.display = 'none';
                    currentPhotoCanvasCer = null;

                    document.getElementById('startCameraBtnCer').style.display = 'inline-block';
                    document.getElementById('clearPhotoBtnCer').style.display = 'none';
                    document.getElementById('cameraStatusCer').textContent = 'Photo supprimée - Cliquez sur "Démarrer Caméra"';
                    document.getElementById('cameraStatusCer').style.color = '#6b7280';
                }

        // Cree un visiteur
        function createVisitor(e) {
            e.preventDefault();

            // Generer un code de 5 chiffres
            const quickCode = String(Math.floor(10000 + Math.random() * 90000));

            const visitor = {
                id: 'VIS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                quickCode: quickCode,
                name: document.getElementById('visitorName').value,
                groomName: document.getElementById('visitorGroomName').value,
                brideName: document.getElementById('visitorBrideName').value,
                location: document.getElementById('visitorLocation').value,
                service: document.getElementById('visitorService').value,
                capacity: parseInt(document.getElementById('visitorCapacity').value) || 1,
                startTime: new Date(document.getElementById('startDateTime').value),
                endTime: new Date(document.getElementById('endDateTime').value),
                notes: document.getElementById('visitorNotes').value,
                createdAt: new Date(),
                scans: [],
                photo: currentPhotoCanvas ? currentPhotoCanvas.toDataURL('image/jpeg', 0.9) : null,
                category: 'visitor'
            };

            visitors.push(visitor);
            localStorage.setItem('visitors', JSON.stringify(visitors));

            console.log('createCeremony: saving visitor and generating QR', visitor);
            generateQRCode(visitor);
            updateDashboard();

            qrPersist({
                successTitle: 'Invitation créée',
                successMessage: 'Le rendez-vous a été enregistré dans la base de données.',
                skipRefresh: true,
                afterSuccess: function () {
                    const form = document.getElementById('createForm');
                    if (form) form.reset();
                    clearPhoto();
                    setDateTime();
                },
            });
        }

        // Basculer caméra visiteur (user <-> environment)
        function switchVisitorCamera() {
            visitorFacing = (visitorFacing === 'user') ? 'environment' : 'user';
            const btn = document.getElementById('switchCamBtn');
            if (btn) btn.textContent = (visitorFacing === 'user') ? '↔️' : '↔️';
            if (visitorStreamActive) {
                stopCamera();
                setTimeout(() => startCamera(), 250);
            }
        }

        // Basculer caméra cérémonie (user <-> environment)
        function switchCeremonyCamera() {
            ceremonyFacing = (ceremonyFacing === 'user') ? 'environment' : 'user';
            const btn = document.getElementById('switchCamBtnCer');
            if (btn) btn.textContent = (ceremonyFacing === 'user') ? '↔️' : '↔️';
            if (ceremonyStreamActive) {
                stopCameraCer();
                setTimeout(() => startCameraCer(), 250);
            }
        }

        // Cree une Ceremonie
        function createCeremony(e) {
            e.preventDefault();
            console.log('createCeremony called');

            const cerType = document.getElementById('cerType').value;
            const family1 = (document.getElementById('cerFamily1')?.value || '').trim();
            const family2 = (document.getElementById('cerFamily2')?.value || '').trim();

            // Récupérer nouveaux champs
            const cerName = (document.getElementById('cerName')?.value || '').trim();
            const cerLieu = (document.getElementById('cerLieu')?.value || '').trim();
            const cerAddress = (document.getElementById('cerAddress')?.value || '').trim();
            const cerCommune = (document.getElementById('cerCommune')?.value || '').trim();
            const cerPhotographe = (document.getElementById('cerPhotographe')?.value || '').trim();
            const cerReception = (document.getElementById('cerReception')?.value || '').trim();
            const cerContactEmail = (document.getElementById('cerContactEmail')?.value || '').trim();
            const cerContactPhone = (document.getElementById('cerContactPhone')?.value || '').trim();
            const cerDressCode = (document.getElementById('cerDressCode')?.value || '').trim();

            // Validation des champs obligatoires
            let errors = [];
            if (!cerName) errors.push('• Nom de la cérémonie est obligatoire');
            if (!cerType) errors.push('• Type de cérémonie est obligatoire');
            if (!cerLieu) errors.push('• Lieu de la cérémonie est obligatoire');
            if (!family1) errors.push('• Nom de la première famille est obligatoire');

            if ((cerType === 'Mariage' || cerType === 'Dote') && !family2) {
                errors.push('• Nom de la deuxième famille est obligatoire');
            }

            if (cerType === 'Mariage') {
                const brideName = (document.getElementById('cerBrideName')?.value || '').trim();
                const groomName = (document.getElementById('cerGroomName')?.value || '').trim();
                if (!brideName) errors.push('• Nom de la mariée est obligatoire');
                if (!groomName) errors.push('• Nom du marié est obligatoire');
            }

            if (errors.length > 0) {
                qrNotifyError('Formulaire incomplet', errors.join(' • '));
                return;
            }

            // Sauvegarder les données de la cérémonie active
            saveCeremonyData();

            const quickCode = String(Math.floor(10000 + Math.random() * 90000));

            // Securite pour les dates de la ceremonie
            const cerStartVal = document.getElementById('cerStart')?.value;
            const cerEndVal = document.getElementById('cerEnd')?.value;
            const cerStart = cerStartVal ? new Date(cerStartVal) : new Date();
            const cerEnd = cerEndVal ? new Date(cerEndVal) : new Date(cerStart.getTime() + 4 * 60 * 60000);

            // Récupérer les invités de la cérémonie active
            const activeCeremony = ceremonies.find(c => c.id === activeCeremonyId);
            const guests = activeCeremony ? activeCeremony.guests : [];

            const visitor = {
                id: 'CER-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                quickCode: quickCode,
                name: cerName,
                email: cerContactEmail || '',
                phone: cerContactPhone || '',
                sexe: document.getElementById('cerSex')?.value || '',
                honorific: document.getElementById('cerHonorific')?.value || '',
                type: cerType,
                location: cerLieu,
                address: cerAddress || '',
                place: document.getElementById('cerPlace')?.value || '',
                families: (cerType === 'Mariage' || cerType === 'Dote') ? [family1, family2] : [family1],
                program: document.getElementById('cerProgram')?.value || '',
                startTime: cerStart,
                endTime: cerEnd,
                notes: document.getElementById('cerNotes')?.value || '',
                createdAt: new Date(),
                scans: [],
                photo: currentPhotoCanvasCer ? currentPhotoCanvasCer.toDataURL('image/jpeg', 0.9) : null,
                capacity: (document.getElementById('cerCapacity') ? parseInt(document.getElementById('cerCapacity').value) : 1),
                contactEmail: cerContactEmail || '',
                contactPhone: cerContactPhone || '',
                dressCode: cerDressCode || '',
                category: 'ceremonie',
                guests: guests
            };

            if (cerType === 'Mariage') {
                visitor.brideName = document.getElementById('cerBrideName')?.value || '';
                visitor.groomName = document.getElementById('cerGroomName')?.value || '';
                visitor.mariage = {
                    eglise: document.getElementById('cerEglise')?.value || '',
                    egliseAdresse: document.getElementById('cerEgliseAdresse')?.value || '',
                    commune: cerCommune || '',
                    photographe: cerPhotographe || '',
                    evenements: mariageEvents
                };
                mariageEvents = [];
                document.getElementById('evenementsList').innerHTML = '';
            }

            // Create a unique ID for this new ceremony
            const newCeremonyId = Math.max(...ceremonies.map(c => c.id || 0), 0) + 1;

            const newCeremony = {
                id: newCeremonyId,
                name: cerName,
                data: {
                    name: cerName,
                    type: cerType,
                    location: cerLieu,
                    address: cerAddress || '',
                    commune: cerCommune || '',
                    capacity: document.getElementById('cerCapacity') ? parseInt(document.getElementById('cerCapacity').value) : 1,
                    family1: family1,
                    family2: (cerType === 'Mariage' || cerType === 'Dote') ? family2 : '',
                    photographer: cerPhotographe || '',
                    reception: cerReception || '',
                    contactEmail: cerContactEmail || '',
                    contactPhone: cerContactPhone || '',
                    dressCode: cerDressCode || '',
                    startDateTime: cerStartVal || '',
                    endDateTime: cerEndVal || '',
                    notes: document.getElementById('cerNotes')?.value || '',
                    brideName: cerType === 'Mariage' ? (document.getElementById('cerBrideName')?.value || '') : '',
                    groomName: cerType === 'Mariage' ? (document.getElementById('cerGroomName')?.value || '') : '',
                    church: document.getElementById('cerEglise')?.value || '',
                    churchAddress: document.getElementById('cerEgliseAdresse')?.value || ''
                },
                guests: [],
                createdAt: new Date().toISOString()
            };

            ceremonies.push(newCeremony);
            activeCeremonyId = newCeremonyId;
            nextCeremonyId = newCeremonyId + 1;
            renderCeremonyTabs();
            loadCeremonySelector();
            debouncedRenderGuestsTable();
            updateCeremonyInfoDisplay();

            visitors.push(visitor);
            localStorage.setItem('visitors', JSON.stringify(visitors));
            localStorage.setItem('ceremonies', JSON.stringify(ceremonies));

            syncCeremonyToManagement(newCeremonyId);

            generateQRCode(visitor);

            debouncedUpdateCeremonyReport();

            setTimeout(() => {
                openCeremonyDetails(activeCeremonyId);
                qrPersist({
                    successTitle: 'Cérémonie créée',
                    successMessage: 'La cérémonie a été enregistrée. Ajoutez maintenant vos invités.',
                    afterSuccess: function () {
                        resetCeremonyCreateForm();
                        hideCeremonyForm();
                    },
                });
            }, 300);
        }

        // Basculer l'affichage des champs de famille en fonction du type de cérémonie
        document.addEventListener('DOMContentLoaded', function() {
            const cerTypeSelect = document.getElementById('cerType');
            const family2Group = document.getElementById('cerFamily2Group');
            const mariageFields = document.getElementById('mariageFields');
            const marriageDisplaySection = document.getElementById('marriageDisplaySection');
            const family1Input = document.getElementById('cerFamily1');
            const family2Input = document.getElementById('cerFamily2');
            const displayFamily1 = document.getElementById('displayFamily1');
            const displayFamily2 = document.getElementById('displayFamily2');
            const brideNameInput = document.getElementById('cerBrideName');
            const groomNameInput = document.getElementById('cerGroomName');
            const displayBrideName = document.getElementById('displayBrideName');
            const displayGroomName = document.getElementById('displayGroomName');
            
            if (cerTypeSelect) {
                cerTypeSelect.addEventListener('change', function() {
                    const type = this.value;
                    if (family2Group) family2Group.style.display = (type === 'Mariage' || type === 'Dote') ? 'block' : 'none';
                    if (mariageFields) mariageFields.style.display = (type === 'Mariage') ? 'block' : 'none';
                    if (marriageDisplaySection) marriageDisplaySection.style.display = (type === 'Mariage') ? 'block' : 'none';

                    // Afficher les divs de noms des mariés et familles
                    const displayMariesDiv = document.getElementById('displayMariesDiv');
                    const displayFamiliesDiv = document.getElementById('displayFamiliesDiv');
                    if (displayMariesDiv) displayMariesDiv.style.display = (type === 'Mariage') ? 'block' : 'none';
                    if (displayFamiliesDiv) displayFamiliesDiv.style.display = (type === 'Mariage' || type === 'Dote') ? 'block' : 'none';

                    const family2InputLocal = document.getElementById('cerFamily2');
                    if (family2InputLocal) {
                        family2InputLocal.required = (type === 'Mariage' || type === 'Dote');
                    }
                    if (type === 'Mariage') {
                        generateHearts();
                        generateHeartsBrideGroom();
                    }
                });
            }
            
            // Met à jour les noms des familles en temps réel
            if (family1Input) {
                family1Input.addEventListener('input', function() {
                    if (displayFamily1) displayFamily1.textContent = this.value || '-';
                });
            }
            
            // Met à jour les noms des familles en temps réel
            if (family1Input) {
                family1Input.addEventListener('input', function() {
                    if (displayFamily1) displayFamily1.textContent = this.value || '-';
                    const displayFormFamily1 = document.getElementById('displayFormFamily1');
                    if (displayFormFamily1) displayFormFamily1.textContent = this.value || '-';
                });
            }
            
            if (family2Input) {
                family2Input.addEventListener('input', function() {
                    if (displayFamily2) displayFamily2.textContent = this.value || '-';
                    const displayFormFamily2 = document.getElementById('displayFormFamily2');
                    if (displayFormFamily2) displayFormFamily2.textContent = this.value || '-';
                });
            }
            
            // Met à jour les noms des mariés en temps réel
            if (brideNameInput) {
                brideNameInput.addEventListener('input', function() {
                    if (displayBrideName) displayBrideName.textContent = this.value || '-';
                    const displayFormBrideName = document.getElementById('displayFormBrideName');
                    if (displayFormBrideName) displayFormBrideName.textContent = this.value || '-';
                });
            }
            
            if (groomNameInput) {
                groomNameInput.addEventListener('input', function() {
                    if (displayGroomName) displayGroomName.textContent = this.value || '-';
                    const displayFormGroomName = document.getElementById('displayFormGroomName');
                    if (displayFormGroomName) displayFormGroomName.textContent = this.value || '-';
                });
            }

            // Met à jour les familles en temps réel (y compris les nouvelles divs)
            if (family1Input) {
                family1Input.addEventListener('input', function() {
                    if (displayFamily1) displayFamily1.textContent = this.value || '-';
                    const displayFormFamily1 = document.getElementById('displayFormFamily1');
                    if (displayFormFamily1) displayFormFamily1.textContent = this.value || '-';
                });
            }
            
            if (family2Input) {
                family2Input.addEventListener('input', function() {
                    if (displayFamily2) displayFamily2.textContent = this.value || '-';
                    const displayFormFamily2 = document.getElementById('displayFormFamily2');
                    if (displayFormFamily2) displayFormFamily2.textContent = this.value || '-';
                });
            }
        });
        
        // Générateur de cœurs animés
        function generateHearts() {
            const container = document.getElementById('heartsContainer');
            if (!container) return;
            container.innerHTML = ''; // Nettoyage des anciens cœurs
            
            const hearts = ['💕', '💖', '💗', '💝', '✨', '🎉'];
            for (let i = 0; i < 12; i++) {
                const heart = document.createElement('div');
                heart.className = 'heart';
                heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
                heart.style.left = Math.random() * 100 + '%';
                heart.style.top = '-20px';
                heart.style.animationDelay = Math.random() * 0.5 + 's';
                heart.style.fontSize = (Math.random() * 15 + 15) + 'px';
                container.appendChild(heart);
            }
        }
        
        // Générateur de cœurs animés pour la section des mariés
        function generateHeartsBrideGroom() {
            const container = document.getElementById('heartsContainerBrideGroom');
            if (!container) return;
            container.innerHTML = ''; // Nettoyage des anciens cœurs
            
            const hearts = ['💕', '💖', '💗', '💝', '✨', '🎉'];
            for (let i = 0; i < 12; i++) {
                const heart = document.createElement('div');
                heart.className = 'heart';
                heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
                heart.style.left = Math.random() * 100 + '%';
                heart.style.top = '-20px';
                heart.style.animationDelay = Math.random() * 0.5 + 's';
                heart.style.fontSize = (Math.random() * 15 + 15) + 'px';
                container.appendChild(heart);
            }
        }

        // Tableau pour stocker les evenements horodates du mariage
        let mariageEvents = [];

        // Fonctions pour gerer les evenements du mariage
        function addMariageEvent() {
            const eventId = 'event-' + Date.now();
            const event = {
                id: eventId,
                time: '',
                description: ''
            };
            mariageEvents.push(event);
            renderMariageEvents();
        }

        // Fonctions pour supprimer un evenement du mariage
        function removeMariageEvent(eventId) {
            mariageEvents = mariageEvents.filter(e => e.id !== eventId);
            renderMariageEvents();
        }

        // Fonctions pour mettre a jour l'heure d'un evenement du mariage
        function updateEventTime(eventId, time) {
            const event = mariageEvents.find(e => e.id === eventId);
            if (event) event.time = time;
        }

        // Fonctions pour mettre a jour la description d'un evenement du mariage
        function updateEventDescription(eventId, description) {
            const event = mariageEvents.find(e => e.id === eventId);
            if (event) event.description = description;
        }

        // Fonctions pour render les evenements du mariage dans le formulaire
        function renderMariageEvents() {
            const container = document.getElementById('evenementsList');
            container.innerHTML = '';
            
            mariageEvents.forEach(event => {
                const eventDiv = document.createElement('div');
                eventDiv.style.cssText = 'background: #f0fdf4; border: 1px solid #d1fae5; border-radius: 8px; padding: 15px; margin: 10px 0; display: flex; gap: 10px; align-items: flex-start;';
                
                eventDiv.innerHTML = `
                    <div style="flex: 1;">
                        <input type="time" value="${event.time}" onchange="updateEventTime('${event.id}', this.value)" 
                               style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 600; color: #065f46;">
                        <input type="text" value="${event.description}" placeholder="Ex: Échange des alliances" 
                               onchange="updateEventDescription('${event.id}', this.value)"
                               style="width: 100%; padding: 8px; margin-top: 8px; border: 1px solid #cbd5e1; border-radius: 6px; color: #065f46;">
                    </div>
                    <button type="button" onclick="removeMariageEvent('${event.id}')" class="btn btn-danger btn-small" style="white-space: nowrap;">🗑️ Supprimer</button>
                `;
                container.appendChild(eventDiv);
            });
        }

        // Generer le QR Code pour un visiteur ou une ceremonie
        function generateQRCode(visitor) {
            console.log('generateQRCode called for:', visitor.name, 'category:', visitor.category);
            const isCer = visitor && visitor.category === 'ceremonie';
            console.log('isCer:', isCer);
            const qrCodeId = isCer ? 'qrCodeCer' : 'qrCode';
            const qrContainerId = isCer ? 'qrContainerCer' : 'qrContainer';
            const nameId = isCer ? 'qrCerName' : 'qrVisitorName';
            const sexId = isCer ? 'qrCerSex' : 'qrVisitorSex';
            const quickId = isCer ? 'qrCerQuickCode' : 'qrQuickCode';

            const qrContainer = document.getElementById(qrCodeId);
            if (!qrContainer) return;

            qrContainer.innerHTML = '';
            currentQRCode = visitor;

            try {
                if (typeof QRCode === 'undefined') {
                    throw new Error('QRCode library not loaded');
                }
                
                // Create enriched QR data with ceremony information
                let qrData = {
                    id: visitor.id,
                    quickCode: visitor.quickCode,
                    name: visitor.name,
                    type: visitor.type,
                    category: visitor.category
                };
                
                // Add ceremony-specific information
                if (isCer) {
                    qrData.ceremony = {
                        families: visitor.families,
                        location: visitor.location,
                        program: visitor.program,
                        startTime: visitor.startTime,
                        endTime: visitor.endTime,
                        type: visitor.type
                    };
                    
                    // Add wedding-specific information if applicable
                    if (visitor.type === 'Mariage') {
                        qrData.ceremony.brideName = visitor.brideName;
                        qrData.ceremony.groomName = visitor.groomName;
                    }
                }
                
                // Encode the enriched data as JSON string
                const qrDataString = JSON.stringify(qrData);
                renderQRIntoElement(qrContainer, qrDataString, 256);

                const nameEl = document.getElementById(nameId);
                if (nameEl) nameEl.textContent = visitor.name;
                const sexEl = document.getElementById(sexId);
                if (sexEl) sexEl.textContent = visitor.sexe || 'N/A';
                const quickEl = document.getElementById(quickId);
                if (quickEl) quickEl.textContent = visitor.quickCode;

                if (isCer) {
                    const typeEl = document.getElementById('qrCerType');
                    const lieuEl = document.getElementById('qrCerLieu');
                    if (typeEl) typeEl.textContent = visitor.type || '';
                    if (lieuEl) lieuEl.textContent = visitor.location || '';
                }

                document.getElementById(qrContainerId).style.display = 'flex';

                console.log('QR Code generated successfully for:', visitor.name);
            } catch (error) {
                console.error('Error generating QR code:', error);
                
                // Fallback: create enriched data for API
                let qrData = {
                    id: visitor.id,
                    quickCode: visitor.quickCode,
                    name: visitor.name,
                    type: visitor.type,
                    category: visitor.category
                };
                
                if (isCer) {
                    qrData.ceremony = {
                        families: visitor.families,
                        location: visitor.location,
                        program: visitor.program,
                        type: visitor.type
                    };
                    if (visitor.type === 'Mariage') {
                        qrData.ceremony.brideName = visitor.brideName;
                        qrData.ceremony.groomName = visitor.groomName;
                    }
                }
                
                const qrDataString = JSON.stringify(qrData);
                const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrDataString)}`;
                qrContainer.innerHTML = `<img src="${apiUrl}" alt="QR Code" style="width: 256px; height: 256px; border-radius: 8px;">`;

                const nameEl = document.getElementById(nameId);
                if (nameEl) nameEl.textContent = visitor.name;
                const sexEl2 = document.getElementById(sexId);
                if (sexEl2) sexEl2.textContent = visitor.sexe || 'N/A';
                const quickEl = document.getElementById(quickId);
                if (quickEl) quickEl.textContent = visitor.quickCode;

                if (isCer) {
                    const typeEl = document.getElementById('qrCerType');
                    const lieuEl = document.getElementById('qrCerLieu');
                    if (typeEl) typeEl.textContent = visitor.type || '';
                    if (lieuEl) lieuEl.textContent = visitor.location || '';
                }

                document.getElementById(qrContainerId).style.display = 'flex';

                console.log('QR Code generated via API for:', visitor.name);
            }
        }

        // Telecharger le QR Code
        function downloadQR() {
            if (!requireAuth()) return;
            if (!currentQRCode) return;

            const selector = (currentQRCode && currentQRCode.category === 'ceremonie') ? '#qrCodeCer' : '#qrCode';
            const container = document.querySelector(selector);
            if (!container) {
                alert('Pas de QR Code à télécharger');
                return;
            }

            const canvas = container.querySelector('canvas');
            const img = container.querySelector('img');
            let dataUrl;

            if (canvas) {
                dataUrl = canvas.toDataURL();
            } else if (img) {
                // Pour les QR codes générés via l'API, on peut directement utiliser l'URL de l'image pour le téléchargement
                const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(currentQRCode.id)}`;
                const link = document.createElement('a');
                link.href = apiUrl;
                link.download = `QR_${currentQRCode.name}_${Date.now()}.png`;
                link.click();
                return;
            } else {
                alert('Pas de QR Code à télécharger');
                return;
            }

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `QR_${currentQRCode.name}_${Date.now()}.png`;
            link.click();
        }

        // Télécharger le QR code depuis la vérification
        function downloadVerifyQR(visitorId) {
            const qrDiv = document.getElementById('verifyQRCode');
            if (!qrDiv) return;

            const canvas = qrDiv.querySelector('canvas');
            if (!canvas) {
                alert('Pas de QR Code à télécharger');
                return;
            }

            const dataUrl = canvas.toDataURL();
            const visitor = visitors.find(v => v.id === visitorId);
            if (!visitor) return;

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `QR_${visitor.name}_${Date.now()}.png`;
            link.click();
        }

        // Imprimer le QR Code
        function printQR() {
            if (!requireAuth()) return;
            if (!currentQRCode) return;
            const isCer = currentQRCode && currentQRCode.category === 'ceremonie';
            const qrSelector = isCer ? '#qrCodeCer' : '#qrCode';
            const container = document.querySelector(qrSelector);
            if (!container) return;

            const canvas = container.querySelector('canvas');
            const img = container.querySelector('img');
            let dataUrl;

            if (canvas) dataUrl = canvas.toDataURL();
            else if (img) dataUrl = img.src;
            if (!dataUrl) return;

            const printWindow = window.open('', '_blank');
            const title = `QR Code - ${currentQRCode.name || ''}`;
            printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="display:flex;align-items:center;justify-content:center;flex-direction:column;font-family:Segoe UI, Tahoma, Geneva, Verdana, sans-serif;padding:30px;">`);
            printWindow.document.write(`<h2 style="margin-bottom:10px;">${title}</h2>`);
            printWindow.document.write(`<img src="${dataUrl}" style="width:320px;height:320px;border-radius:8px;"/>`);
            // Preferer le code rapide du QR actuel, sinon celui affiche dans le QR code, sinon celui du visiteur/ceremonie
            const quickEl = isCer ? document.getElementById('qrCerQuickCode') : document.getElementById('qrQuickCode');
            const quickCode = (quickEl && quickEl.textContent && quickEl.textContent.trim()) || (currentQRCode && currentQRCode.quickCode) || '';
            if (quickCode) {
                printWindow.document.write(`<div style="margin-top:12px;font-size:18px;color:#0f172a;">Code rapide:</div>`);
                printWindow.document.write(`<div style="margin-top:6px;font-size:28px;font-weight:800;letter-spacing:8px;color:#0f172a;">${quickCode}</div>`);
            }
            printWindow.document.write(`<div style="margin-top:18px;font-size:14px;">Nom: ${currentQRCode.name || ''}</div>`);
            printWindow.document.write(`<div style="font-size:13px;">Téléphone: ${currentQRCode.phone || 'Non fourni'}</div>`);
            printWindow.document.write(`<div style="font-size:13px;">Type: ${currentQRCode.type || ''}</div>`);
            printWindow.document.write(`</body></html>`);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 300);
        }

        function downloadQRCer() { downloadQR(); }
        function printQRCer() { printQR(); }

        // Copier le code rapide dans le presse-papiers avec fallback
        function copyQuickCode(quickId, btnId) {
            const el = document.getElementById(quickId);
            if (!el) return;
            const code = el.textContent.trim();
            if (!code) return;

            const setFeedback = (btn, text) => {
                if (!btn) return;
                const old = btn.textContent;
                btn.textContent = text;
                setTimeout(() => btn.textContent = old, 1500);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code).then(() => {
                    setFeedback(document.getElementById(btnId), 'Copié!');
                }).catch(() => fallbackCopy(code, btnId));
            } else {
                fallbackCopy(code, btnId);
            }
        }

        function fallbackCopy(text, btnId) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); setTimeout(() => {}, 0); } catch (e) {}
            document.body.removeChild(ta);
            const btn = document.getElementById(btnId);
            if (btn) { const old = btn.textContent; btn.textContent = 'Copié!'; setTimeout(()=> btn.textContent = old, 1500); }
        }

        // Fonction simple pour copier du texte dans le presse-papiers
        function copyToClipboard(text, btnElement) {
            if (!text) return;

            const setFeedback = (btn, text) => {
                if (!btn) return;
                const old = btn.textContent;
                btn.textContent = text;
                btn.style.background = '#10b981';
                setTimeout(() => {
                    btn.textContent = old;
                    btn.style.background = '#818cf8';
                }, 1500);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    setFeedback(btnElement, '✓');
                }).catch(() => fallbackCopyText(text, btnElement));
            } else {
                fallbackCopyText(text, btnElement);
            }
        }

        function fallbackCopyText(text, btnElement) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                if (btnElement) {
                    const old = btnElement.textContent;
                    btnElement.textContent = '✓';
                    btnElement.style.background = '#10b981';
                    setTimeout(() => {
                        btnElement.textContent = old;
                        btnElement.style.background = '#818cf8';
                    }, 1500);
                }
            } catch (e) {
                console.error('Copy failed:', e);
            }
            document.body.removeChild(ta);
        }

        // Coller le code rapide depuis le presse-papiers avec fallback
        async function pasteIntoVerify(inputId, btnId, autoVerify = false) {
            const input = document.getElementById(inputId);
            const btn = document.getElementById(btnId);
            if (!input) return;

            const setFeedback = (b, text) => {
                if (!b) return;
                const old = b.textContent;
                b.textContent = text;
                setTimeout(() => b.textContent = old, 1500);
            };

            try {
                if (navigator.clipboard && navigator.clipboard.readText) {
                    const txt = await navigator.clipboard.readText();
                    if (txt && txt.trim().length) {
                        input.value = txt.trim();
                        setFeedback(btn, 'Collé!');
                        input.focus();
                        if (autoVerify) verifyCode();
                        return;
                    }
                }
            } catch (e) {
                // Ignorer les erreurs de lecture du presse-papiers et passer au fallback
            }

            // Chuten de secours pour les navigateurs sans support du presse-papiers ou en cas d'erreur
            const manual = prompt('Collez le code ici puis validez:');
            if (manual !== null) {
                const v = manual.trim();
                if (v.length) {
                    input.value = v;
                    setFeedback(btn, 'Collé!');
                    input.focus();
                    if (autoVerify) verifyCode();
                }
            }
        }

        // Generer l'affichage de la verification pour une ceremonie
        function generateVerificationDisplay(visitor, isValid, timeRemaining, isExpired, isComing, photoDisplay) {
            const isCer = visitor.category === 'ceremonie';
            
            if (isValid && isCer) {
                const familiesDisplay = visitor.families && visitor.families.length > 0 
                    ? visitor.families.join(' & ')
                    : 'N/A';
                
                return `
                    <div style="background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%); border: 3px solid #10b981; border-radius: 12px; padding: 25px; animation: slideInRight 0.3s ease-out;">
                        <div style="font-size: 64px; margin-bottom: 15px; text-align: center;">✓</div>
                        <div style="font-weight: 700; color: #10b981; margin-bottom: 20px; text-align: center; font-size: 20px;">Accès Autorisé</div>
                        <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);">
                            <div style="display: grid; gap: 12px;">
                                <div style="text-align:center;">${photoDisplay}</div>
                                <div style="border-bottom: 2px solid #f0fdf4; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #10b981; font-weight: 600;">Nom de la Cérémonie</div>
                                    <div style="font-size: 18px; font-weight: 700; color: #065f46; margin-top: 5px;">${visitor.name}</div>
                                </div>
                                <div style="border-bottom: 2px solid #f0fdf4; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #10b981; font-weight: 600;">Type de Cérémonie</div>
                                    <div style="font-size: 14px; color: #065f46; margin-top: 3px;">🎉 ${visitor.type}</div>
                                </div>
                                <div style="border-bottom: 2px solid #f0fdf4; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #10b981; font-weight: 600;">Famille(s)</div>
                                    <div style="font-size: 14px; color: #065f46; margin-top: 3px;">👥 ${familiesDisplay}</div>
                                </div>
                                <div style="border-bottom: 2px solid #f0fdf4; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #10b981; font-weight: 600;">Lieu</div>
                                    <div style="font-size: 14px; color: #065f46; margin-top: 3px;">📍 ${visitor.location}</div>
                                </div>
                                <div style="border-bottom: 2px solid #f0fdf4; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #10b981; font-weight: 600;">Place Attitrée</div>
                                    <div style="font-size: 14px; color: #065f46; margin-top: 3px;">📌 ${visitor.place || 'N/A'}</div>
                                </div>
                                <div style="border-bottom: 2px solid #f0fdf4; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #10b981; font-weight: 600;">Nombre de personnes</div>
                                    <div style="font-size: 14px; color: #065f46; margin-top: 3px;">👥 ${visitor.capacity || 1}</div>
                                </div>
                                <div style="border-bottom: 2px solid #f0fdf4; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #10b981; font-weight: 600;">Programme</div>
                                    <div style="font-size: 13px; color: #065f46; margin-top: 3px; white-space: pre-wrap;">${visitor.program || 'N/A'}</div>
                                </div>
                                <div style="border-bottom: 2px solid #f0fdf4; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #10b981; font-weight: 600;">Sexe</div>
                                    <div style="font-size: 14px; color: #065f46; margin-top: 3px;">⚧ ${visitor.sexe || 'N/A'}</div>
                                </div>
                                <div style="border-bottom: 2px solid #f0fdf4; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #10b981; font-weight: 600;">Téléphone</div>
                                    <div style="font-size: 13px; color: #065f46; margin-top: 3px;">📱 ${visitor.phone || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #10b981; font-weight: 600;">Période</div>
                                    <div style="font-size: 13px; color: #065f46; margin-top: 3px;">
                                        De: ${visitor.startTime.toLocaleString('fr-FR')}<br>
                                        À: ${visitor.endTime.toLocaleString('fr-FR')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px; border-radius: 4px; font-size: 13px; color: #15803d; font-weight: 600;">
                            ✓ Cérémonie validée - Accès Autorisé
                        </div>
                    </div>
                `;
            } else if (!isValid && isCer) {
                let reason = 'Cérémonie non valide';
                let reasonDetails = '';
                if (isComing) {
                    reason = 'Pas Encore Valide';
                    reasonDetails = `Valide à partir de ${visitor.startTime.toLocaleString('fr-FR')}`;
                } else if (isExpired) {
                    const timeLeft = visitor.endTime - new Date();
                    const minutesExpired = Math.floor(-timeLeft / 60000);
                    const hoursExpired = Math.floor(minutesExpired / 60);
                    reason = 'Cérémonie Expirée';
                    reasonDetails = `Expirée il y a ${hoursExpired > 0 ? hoursExpired + 'h ' : ''}${minutesExpired % 60}m`;
                }
                
                const familiesDisplay = visitor.families && visitor.families.length > 0 
                    ? visitor.families.join(' & ')
                    : 'N/A';
                
                return `
                    <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 3px solid #ef4444; border-radius: 12px; padding: 25px; animation: slideInRight 0.3s ease-out;">
                        <div style="font-size: 64px; margin-bottom: 15px; text-align: center;">✗</div>
                        <div style="font-weight: 700; color: #ef4444; margin-bottom: 20px; text-align: center; font-size: 20px;">Accès Refusé</div>
                        <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);">
                            <div style="display: grid; gap: 12px;">
                                <div style="text-align:center;">${photoDisplay}</div>
                                <div style="border-bottom: 2px solid #fee2e2; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #dc2626; font-weight: 600;">Nom de la Cérémonie</div>
                                    <div style="font-size: 18px; font-weight: 700; color: #7f1d1d; margin-top: 5px;">${visitor.name}</div>
                                </div>
                                <div style="border-bottom: 2px solid #fee2e2; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #dc2626; font-weight: 600;">Raison du Refus</div>
                                    <div style="font-size: 18px; font-weight: 700; color: #dc2626; margin-top: 3px;">⚠️ ${reason}</div>
                                    <div style="font-size: 13px; color: #7f1d1d; margin-top: 5px;">${reasonDetails}</div>
                                </div>
                                <div style="border-bottom: 2px solid #fee2e2; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #dc2626; font-weight: 600;">Type</div>
                                    <div style="font-size: 14px; color: #7f1d1d; margin-top: 3px;">🎉 ${visitor.type}</div>
                                </div>
                                <div style="border-bottom: 2px solid #fee2e2; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #dc2626; font-weight: 600;">Famille(s)</div>
                                    <div style="font-size: 14px; color: #7f1d1d; margin-top: 3px;">👥 ${familiesDisplay}</div>
                                </div>
                                <div style="border-bottom: 2px solid #fee2e2; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #dc2626; font-weight: 600;">Lieu</div>
                                    <div style="font-size: 14px; color: #7f1d1d; margin-top: 3px;">📍 ${visitor.location}</div>
                                </div>
                                <div style="border-bottom: 2px solid #fee2e2; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #dc2626; font-weight: 600;">Place Attitrée</div>
                                    <div style="font-size: 14px; color: #7f1d1d; margin-top: 3px;">📌 ${visitor.place || 'N/A'}</div>
                                </div>
                                <div style="border-bottom: 2px solid #fee2e2; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #dc2626; font-weight: 600;">Nombre de personnes</div>
                                    <div style="font-size: 14px; color: #7f1d1d; margin-top: 3px;">👥 ${visitor.capacity || 1}</div>
                                </div>
                                <div style="border-bottom: 2px solid #fee2e2; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #dc2626; font-weight: 600;">Sexe</div>
                                    <div style="font-size: 14px; color: #7f1d1d; margin-top: 3px;">⚧ ${visitor.sexe || 'N/A'}</div>
                                </div>
                                <div style="border-bottom: 2px solid #fee2e2; padding-bottom: 12px;">
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #dc2626; font-weight: 600;">Téléphone</div>
                                    <div style="font-size: 13px; color: #7f1d1d; margin-top: 3px;">📱 ${visitor.phone || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #dc2626; font-weight: 600;">Période</div>
                                    <div style="font-size: 13px; color: #7f1d1d; margin-top: 3px;">
                                        De: ${visitor.startTime.toLocaleString('fr-FR')}<br>
                                        À: ${visitor.endTime.toLocaleString('fr-FR')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 4px; font-size: 13px; color: #991b1b; font-weight: 600;">
                            ✗ Accès non autorisé - Merci de contacter l'administrateur
                        </div>
                    </div>
                `;
            }
            
            // Retourner null pour les visiteurs non cérémonies, la fonction d'affichage gérera les cas génériques
                return null;
            }

            // === Fonctions pour scanner le QR depuis la caméra dans l'onglet Vérifier ===
            let verifyStream = null;
            let verifyScanActive = false;
            let verifyScanAnimationId = null;
            let verifyLastScanAt = 0;

            function toggleVerifyScanner() {
                const scanner = document.getElementById('verifyScanner');
                if (!scanner) return;
                if (!requireAuth()) return;
                if (scanner.style.display === 'none' || scanner.style.display === '') {
                    startVerifyCamera();
                } else {
                    stopVerifyCamera();
                }
            }

            function startVerifyCamera() {
                const video = document.getElementById('verifyVideo');
                const status = document.getElementById('verifyCameraStatus');
                if (typeof jsQR === 'undefined') {
                    if (status) {
                        status.textContent = 'Scanner QR indisponible (jsQR manquant)';
                        status.style.color = '#ef4444';
                    }
                    return;
                }
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    if (status) { status.textContent = 'Navigateur ne supporte pas getUserMedia'; status.style.color = '#ef4444'; }
                    return;
                }

                navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
                    .then(stream => {
                        verifyStream = stream;
                        video.srcObject = stream;
                        video.setAttribute('playsinline', 'true');
                        video.setAttribute('webkit-playsinline', 'true');
                        const playPromise = video.play();
                        if (playPromise && playPromise.catch) {
                            playPromise.catch(err => console.warn('video.play:', err));
                        }
                        document.getElementById('verifyScanner').style.display = 'block';
                        const scanBtn = document.getElementById('startScanBtn');
                        if (scanBtn) scanBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                        if (status) { status.textContent = 'Caméra active — pointez vers le QR code…'; status.style.color = '#10b981'; }
                        verifyScanActive = true;
                        verifyLastScanAt = 0;
                        scanVerifyFrame();
                    })
                    .catch(err => {
                        console.error('Erreur caméra verify:', err);
                        if (status) { status.textContent = 'Accès caméra refusé — autorisez la caméra dans le navigateur.'; status.style.color = '#ef4444'; }
                    });
            }

            function stopVerifyCamera() {
                verifyScanActive = false;
                if (verifyStream) {
                    verifyStream.getTracks().forEach(t => t.stop());
                    verifyStream = null;
                }
                const video = document.getElementById('verifyVideo');
                if (video) video.srcObject = null;
                const scanner = document.getElementById('verifyScanner');
                if (scanner) scanner.style.display = 'none';
                if (document.getElementById('startScanBtn')) document.getElementById('startScanBtn').textContent = '📷';
                if (verifyScanAnimationId) cancelAnimationFrame(verifyScanAnimationId);
                const status = document.getElementById('verifyCameraStatus');
                if (status) { status.textContent = 'Caméra arrêtée'; status.style.color = '#6b7280'; }
            }

            function scanVerifyFrame() {
                const video = document.getElementById('verifyVideo');
                const canvas = document.getElementById('verifyCanvas');
                if (!verifyScanActive) return;
                if (!video || !canvas) return;

                if (typeof jsQR === 'undefined') {
                    verifyScanAnimationId = requestAnimationFrame(scanVerifyFrame);
                    return;
                }

                if (video.readyState !== video.HAVE_ENOUGH_DATA) {
                    verifyScanAnimationId = requestAnimationFrame(scanVerifyFrame);
                    return;
                }

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
                    if (code && code.data) {
                        const now = Date.now();
                        if (now - verifyLastScanAt < 2500) {
                            verifyScanAnimationId = requestAnimationFrame(scanVerifyFrame);
                            return;
                        }
                        verifyLastScanAt = now;
                        const scanned = code.data.trim();
                        stopVerifyCamera();
                        const status = document.getElementById('verifyCameraStatus');
                        if (status) { status.textContent = 'QR détecté — vérification…'; status.style.color = '#10b981'; }
                        handleQrScanDetected(scanned);
                        return;
                    }
                } catch (e) {
                    console.error('Erreur lecture imageData:', e);
                }

                verifyScanAnimationId = requestAnimationFrame(scanVerifyFrame);
            }

            // ——— Scanner QR global (FAB + modal) ———
            let globalScanStream = null;
            let globalScanActive = false;
            let globalScanAnimId = null;
            let globalLastScanAt = 0;
            let lastPopupQrData = null;

            function openGlobalQrScanner() {
                if (typeof requireAuth === 'function' && !requireAuth()) return;
                const modal = document.getElementById('globalQrScannerModal');
                if (!modal) return;
                modal.classList.add('open');
                modal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                startGlobalScanCamera();
            }

            function closeGlobalQrScanner() {
                stopGlobalScanCamera();
                const modal = document.getElementById('globalQrScannerModal');
                if (modal) {
                    modal.classList.remove('open');
                    modal.setAttribute('aria-hidden', 'true');
                }
                document.body.style.overflow = '';
            }

            function startGlobalScanCamera() {
                const video = document.getElementById('globalScanVideo');
                const status = document.getElementById('globalScanStatus');
                if (typeof jsQR === 'undefined') {
                    if (status) { status.textContent = 'Scanner indisponible'; status.style.color = '#ef4444'; }
                    return;
                }
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    if (status) { status.textContent = 'Caméra non supportée'; status.style.color = '#ef4444'; }
                    return;
                }
                if (status) { status.textContent = 'Ouverture de la caméra…'; status.style.color = '#6b7280'; }

                navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
                    .then(stream => {
                        globalScanStream = stream;
                        video.srcObject = stream;
                        video.setAttribute('playsinline', 'true');
                        video.setAttribute('webkit-playsinline', 'true');
                        const playPromise = video.play();
                        if (playPromise && playPromise.catch) playPromise.catch(err => console.warn('globalScan video.play:', err));
                        globalScanActive = true;
                        globalLastScanAt = 0;
                        if (status) { status.textContent = 'Caméra active — pointez vers le QR'; status.style.color = '#10b981'; }
                        scanGlobalFrame();
                    })
                    .catch(err => {
                        console.error('Erreur caméra globale:', err);
                        if (status) { status.textContent = 'Accès caméra refusé'; status.style.color = '#ef4444'; }
                    });
            }

            function stopGlobalScanCamera() {
                globalScanActive = false;
                if (globalScanStream) {
                    globalScanStream.getTracks().forEach(t => t.stop());
                    globalScanStream = null;
                }
                const video = document.getElementById('globalScanVideo');
                if (video) video.srcObject = null;
                if (globalScanAnimId) cancelAnimationFrame(globalScanAnimId);
            }

            function scanGlobalFrame() {
                const video = document.getElementById('globalScanVideo');
                const canvas = document.getElementById('globalScanCanvas');
                if (!globalScanActive || !video || !canvas) return;

                if (typeof jsQR === 'undefined') {
                    globalScanAnimId = requestAnimationFrame(scanGlobalFrame);
                    return;
                }
                if (video.readyState !== video.HAVE_ENOUGH_DATA) {
                    globalScanAnimId = requestAnimationFrame(scanGlobalFrame);
                    return;
                }

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                try {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
                    if (code && code.data) {
                        const now = Date.now();
                        if (now - globalLastScanAt < 2500) {
                            globalScanAnimId = requestAnimationFrame(scanGlobalFrame);
                            return;
                        }
                        globalLastScanAt = now;
                        closeGlobalQrScanner();
                        handleQrScanDetected(code.data.trim());
                        return;
                    }
                } catch (e) {
                    console.error('Erreur scan global:', e);
                }
                globalScanAnimId = requestAnimationFrame(scanGlobalFrame);
            }

            function closeQrScanPopup() {
                const popup = document.getElementById('qrScanResultPopup');
                if (popup) {
                    popup.classList.remove('open');
                    popup.setAttribute('aria-hidden', 'true');
                }
            }

            function goToVerifyFromPopup() {
                closeQrScanPopup();
                if (typeof switchTab === 'function') {
                    const btn = document.querySelector('.nav-tab[data-tab="verify"], .mobile-nav-item[data-tab="verify"]');
                    switchTab('verify', btn);
                }
                if (lastPopupQrData) {
                    const resultDiv = document.getElementById('verifyResult');
                    const contentDiv = document.getElementById('verifyContent');
                    if (resultDiv && contentDiv) {
                        resultDiv.style.display = 'block';
                        displayGuestVerificationResult(lastPopupQrData, resultDiv, contentDiv);
                        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            }

            function showQrScanPopup(qrData, isError) {
                const popup = document.getElementById('qrScanResultPopup');
                const content = document.getElementById('qrScanPopupContent');
                if (!popup || !content) return;

                if (isError) {
                    content.innerHTML = `
                        <div class="qr-scan-popup-mini">
                            <div class="qr-scan-popup-status error"><i class="fa-solid fa-circle-xmark"></i> Code non reconnu</div>
                            <p style="color:var(--text-muted);font-size:13px;margin:0;">Aucune invitation ne correspond à ce QR code.</p>
                        </div>`;
                    lastPopupQrData = null;
                } else {
                    lastPopupQrData = qrData;
                    const guest = qrData.guest || {};
                    const ceremony = qrData.ceremony || {};
                    const status = getGuestVerificationStatus(qrData);
                    const statusKey = qrData.isDuplicate ? 'duplicate' : (status.className.includes('pending') ? 'pending' : (status.className.includes('expired') ? 'expired' : 'valid'));
                    const fullName = `${guest.firstName || guest.fullName || ''} ${guest.lastName || guest.postName || ''}`.trim() || '—';

                    content.innerHTML = `
                        <div class="qr-scan-popup-mini">
                            <div class="qr-scan-popup-status ${statusKey}">
                                <i class="fa-solid ${status.icon}"></i> ${escapeVerifyHtml(status.label)}
                            </div>
                            <p class="qr-scan-popup-name">${escapeVerifyHtml(fullName)}</p>
                            <p class="qr-scan-popup-honorific">${escapeVerifyHtml(guest.honorific || 'Invité')}</p>
                            ${qrData.quickCode ? `<div class="qr-scan-popup-code">Code ${escapeVerifyHtml(qrData.quickCode)}</div>` : ''}
                            <div class="qr-scan-popup-details">
                                <div class="qr-scan-popup-detail"><span>Place</span><strong>${escapeVerifyHtml(guest.seat || '—')}</strong></div>
                                <div class="qr-scan-popup-detail"><span>Personnes</span><strong>${guest.personCount || guest.count || 1}</strong></div>
                                <div class="qr-scan-popup-detail"><span>Téléphone</span><strong>${escapeVerifyHtml(guest.phone || '—')}</strong></div>
                                <div class="qr-scan-popup-detail"><span>Post-nom</span><strong>${escapeVerifyHtml(guest.postName || '—')}</strong></div>
                            </div>
                            <div class="qr-scan-popup-ceremony">
                                <strong><i class="fa-solid fa-champagne-glasses"></i> ${escapeVerifyHtml(ceremony.name || '—')}</strong>
                                <span>${escapeVerifyHtml(ceremony.type || '')} · ${escapeVerifyHtml(ceremony.location || '')}</span>
                            </div>
                        </div>`;
                }

                popup.classList.add('open');
                popup.setAttribute('aria-hidden', 'false');
            }

            function handleQrScanDetected(rawText) {
                if (typeof reloadAppDataFromStorage === 'function') reloadAppDataFromStorage();

                const codeInput = document.getElementById('verifyCode');
                if (codeInput) codeInput.value = rawText;

                const parsed = parseVerifyInput(rawText);
                let qrData = null;
                let isDuplicate = false;

                if (parsed.kind === 'guest_qr') {
                    qrData = parsed.data;
                    const found = findGuestInAllCeremonies({
                        guestId: qrData.id || qrData.guest?.id,
                        quickCode: qrData.quickCode || qrData.guest?.quickCode,
                        ceremonyId: qrData.ceremonyId || qrData.ceremony?.id,
                    });
                    if (found) {
                        isDuplicate = recordGuestScan(found.ceremony, found.guest, 'qr-scan');
                        if (isDuplicate) {
                            showAlarm('⚠️ DOUBLON', 'Cette invitation a déjà été scannée.', 'danger');
                            qrData.isDuplicate = true;
                        }
                    }
                } else if (parsed.kind === 'qra_compact' || parsed.kind === 'quick_code') {
                    const found = findGuestInAllCeremonies({
                        guestId: parsed.guestId,
                        quickCode: parsed.code || parsed.quickCode,
                        ceremonyId: parsed.ceremonyId,
                    });
                    if (found) {
                        isDuplicate = recordGuestScan(found.ceremony, found.guest, 'qr-scan');
                        if (isDuplicate) showAlarm('⚠️ DOUBLON', 'Cette invitation a déjà été scannée.', 'danger');
                        qrData = buildGuestQRDataFromRecords(found.ceremony, found.guest, { isDuplicate });
                    }
                } else if (parsed.kind === 'raw') {
                    const found = findGuestInAllCeremonies({ quickCode: parsed.code });
                    if (found) {
                        qrData = buildGuestQRDataFromRecords(found.ceremony, found.guest);
                    }
                }

                if (qrData) {
                    const enriched = enrichGuestQRData(qrData);
                    showQrScanPopup(enriched);

                    const resultDiv = document.getElementById('verifyResult');
                    const contentDiv = document.getElementById('verifyContent');
                    if (resultDiv && contentDiv) {
                        resultDiv.style.display = 'block';
                        displayGuestVerificationResult(enriched, resultDiv, contentDiv);
                    }
                    if (typeof refreshAppViews === 'function') refreshAppViews();
                } else {
                    showQrScanPopup(null, true);
                }
            }

            function parseVerifyInput(rawCode) {
                const trimmed = (rawCode || '').trim();
                if (!trimmed) return { kind: 'empty' };

                const tryJson = (value) => {
                    try {
                        const parsed = JSON.parse(value);
                        if (parsed && typeof parsed === 'object') {
                            if (!parsed.type && (parsed.guest || parsed.ceremonyId || parsed.ceremony)) {
                                parsed.type = 'GUEST';
                            }
                            if (parsed.type === 'GUEST' || parsed.guest || parsed.ceremonyId) {
                                return { kind: 'guest_qr', data: parsed };
                            }
                        }
                    } catch (e) { /* ignore */ }
                    return null;
                };

                let parsed = tryJson(trimmed);
                if (parsed) return parsed;

                if (trimmed.includes('%7B') || trimmed.includes('%22')) {
                    parsed = tryJson(decodeURIComponent(trimmed));
                    if (parsed) return parsed;
                }

                const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsed = tryJson(jsonMatch[0]);
                    if (parsed) return parsed;
                }

                if (/^\d{5}$/.test(trimmed)) {
                    return { kind: 'quick_code', code: trimmed };
                }

                const qraMatch = trimmed.match(/^QRA:(\d+):(\d+):(\d{5})$/i);
                if (qraMatch) {
                    return {
                        kind: 'qra_compact',
                        ceremonyId: qraMatch[1],
                        guestId: qraMatch[2],
                        quickCode: qraMatch[3],
                    };
                }

                const urlMatch = trimmed.match(/\/v\/(\d{5})(?:[/?#]|$)/i);
                if (urlMatch) {
                    return { kind: 'quick_code', code: urlMatch[1] };
                }

                return { kind: 'raw', code: trimmed };
            }

            function findGuestInAllCeremonies({ guestId, quickCode, ceremonyId } = {}) {
                if (typeof reloadAppDataFromStorage === 'function') reloadAppDataFromStorage();
                for (const ceremony of ceremonies || []) {
                    if (ceremonyId && String(ceremony.id) !== String(ceremonyId)) continue;
                    const guests = ceremony.guests || [];
                    let guest = null;
                    if (guestId != null) {
                        guest = guests.find(g => String(g.id) === String(guestId));
                    }
                    if (!guest && quickCode) {
                        guest = guests.find(g => g.quickCode && String(g.quickCode) === String(quickCode));
                    }
                    if (guest) return { ceremony, guest };
                }
                return null;
            }

            function buildGuestQRDataFromRecords(ceremony, guest, extras = {}) {
                const data = ceremony.data || {};
                const firstName = guest.firstName || guest.fullName || '';
                const lastName = guest.lastName || guest.postName || '';
                return {
                    type: 'GUEST',
                    id: guest.id,
                    quickCode: guest.quickCode || extras.quickCode || '',
                    ceremonyId: ceremony.id,
                    guest: {
                        id: guest.id,
                        lastName: lastName,
                        firstName: firstName,
                        postName: guest.postName || '',
                        honorific: guest.honorific || '',
                        phone: guest.phone || '',
                        seat: guest.seat || '',
                        personCount: guest.count || guest.personCount || 1,
                        notes: guest.notes || '',
                        fullName: guest.fullName || `${firstName} ${lastName}`.trim(),
                    },
                    ceremony: {
                        id: ceremony.id,
                        name: data.name || ceremony.name || `Cérémonie ${ceremony.id}`,
                        type: data.type || '-',
                        location: data.location || '-',
                        startDateTime: data.startDateTime || '',
                        brideName: data.brideName || '',
                        groomName: data.groomName || '',
                    },
                    timestamp: extras.timestamp || new Date().toISOString(),
                    isDuplicate: !!extras.isDuplicate,
                };
            }

            function enrichGuestQRData(qrData) {
                const found = findGuestInAllCeremonies({
                    guestId: qrData.id || qrData.guest?.id,
                    quickCode: qrData.quickCode || qrData.guest?.quickCode,
                    ceremonyId: qrData.ceremonyId || qrData.ceremony?.id,
                });

                if (found) {
                    return buildGuestQRDataFromRecords(found.ceremony, found.guest, {
                        quickCode: qrData.quickCode || found.guest.quickCode,
                        isDuplicate: qrData.isDuplicate,
                        timestamp: qrData.timestamp || new Date().toISOString(),
                    });
                }

                const guest = qrData.guest || {};
                const ceremony = qrData.ceremony || {};
                return {
                    ...qrData,
                    type: 'GUEST',
                    guest: {
                        ...guest,
                        firstName: guest.firstName || guest.fullName || '',
                        lastName: guest.lastName || guest.postName || '',
                        personCount: guest.personCount || guest.count || 1,
                    },
                    ceremony: {
                        ...ceremony,
                        name: ceremony.name || ceremony.data?.name || 'Cérémonie',
                    },
                };
            }

            function recordGuestScan(ceremony, guest, source) {
                if (!guest.scans) guest.scans = [];
                guest.scans.push({ timestamp: new Date().toISOString(), source: source || 'qr-scan' });
                localStorage.setItem('ceremonies', JSON.stringify(ceremonies));

                const guestLabel = `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || guest.fullName || 'Invité';
                accessLog.push({
                    visitorName: guestLabel,
                    location: ceremony.data?.location || ceremony.data?.name || 'Cérémonie',
                    timestamp: new Date().toISOString(),
                    result: 'approved',
                    code: guest.quickCode || '',
                });
                localStorage.setItem('accessLog', JSON.stringify(accessLog));

                if (typeof syncCeremonyToManagement === 'function') {
                    syncCeremonyToManagement(ceremony.id);
                }
                if (typeof qrPersist === 'function') {
                    qrPersist({ silent: true, skipRefresh: true });
                }
                return guest.scans.length > 1;
            }

            function verifyCode() {
            if (typeof reloadAppDataFromStorage === 'function') reloadAppDataFromStorage();

            const codeInput = document.getElementById('verifyCode');
            if (!codeInput) return;
            const code = codeInput.value.trim();
            if (!code) return;

            const resultDiv = document.getElementById('verifyResult');
            const contentDiv = document.getElementById('verifyContent');
            const verifyCard = document.getElementById('verifyCard');
            const verifyButton = document.getElementById('verifyButton');
            if (!resultDiv || !contentDiv) return;

            resultDiv.style.display = 'block';
            resultDiv.classList.remove('duplicate-blink', 'verify-duplicate-result', 'verify-status--valid', 'verify-status--duplicate', 'verify-status--pending', 'verify-status--expired');
            if (verifyCard) verifyCard.classList.remove('verify-duplicate-card');
            if (verifyButton) {
                verifyButton.innerHTML = '<i class="fa-solid fa-check"></i> Vérifier';
                verifyButton.classList.remove('btn-danger');
                verifyButton.classList.add('btn-success');
            }
            contentDiv.innerHTML = '';

            function setVerifyDuplicateState(isDuplicate) {
                if (!verifyButton || !verifyCard || !resultDiv) return;
                if (isDuplicate) {
                    verifyButton.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Doublon';
                    verifyButton.classList.remove('btn-success');
                    verifyButton.classList.add('btn-danger');
                    verifyCard.classList.add('verify-duplicate-card');
                    resultDiv.classList.add('verify-duplicate-result');
                } else {
                    verifyButton.innerHTML = '<i class="fa-solid fa-check"></i> Vérifier';
                    verifyButton.classList.remove('btn-danger');
                    verifyButton.classList.add('btn-success');
                    verifyCard.classList.remove('verify-duplicate-card');
                    resultDiv.classList.remove('verify-duplicate-result');
                }
            }

            function markVerifyDuplicate() {
                setVerifyDuplicateState(true);
                if (resultDiv) {
                    resultDiv.classList.add('duplicate-blink');
                    try { showSpectacularDuplicateEffect(resultDiv); } catch(e){console.warn(e)}
                    setTimeout(() => {
                        resultDiv.classList.remove('duplicate-blink');
                    }, 2200);
                }
            }

            function showGuestVerification(qrData) {
                const enriched = enrichGuestQRData(qrData);
                displayGuestVerificationResult(enriched, resultDiv, contentDiv);
                resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                codeInput.value = '';
            }

            try {
                const parsed = parseVerifyInput(code);

                if (parsed.kind === 'guest_qr') {
                    let qrData = parsed.data;
                    const found = findGuestInAllCeremonies({
                        guestId: qrData.id || qrData.guest?.id,
                        quickCode: qrData.quickCode || qrData.guest?.quickCode,
                        ceremonyId: qrData.ceremonyId || qrData.ceremony?.id,
                    });

                    if (found) {
                        const isDuplicate = recordGuestScan(found.ceremony, found.guest, 'qr-scan');
                        if (isDuplicate) {
                            alert('⚠️ DOUBLON !!! Cette même invitation a déjà été scannée.');
                            showAlarm('⚠️ DOUBLON', 'Cette même invitation a déjà été scannée.', 'danger');
                            markVerifyDuplicate();
                            qrData.isDuplicate = true;
                        }
                    }

                    showGuestVerification(qrData);
                    refreshAppViews();
                    return;
                }

                if (parsed.kind === 'quick_code') {
                    const found = findGuestInAllCeremonies({ quickCode: parsed.code });
                    if (found) {
                        const isDuplicate = recordGuestScan(found.ceremony, found.guest, 'quick-code');
                        if (isDuplicate) {
                            alert('⚠️ DOUBLON !!! Cette même invitation a déjà été scannée.');
                            showAlarm('⚠️ DOUBLON', 'Cette même invitation a déjà été scannée.', 'danger');
                            markVerifyDuplicate();
                        }
                        showGuestVerification(buildGuestQRDataFromRecords(found.ceremony, found.guest, {
                            isDuplicate: isDuplicate,
                        }));
                        refreshAppViews();
                        return;
                    }
                }

                if (parsed.kind === 'qra_compact') {
                    const found = findGuestInAllCeremonies({
                        guestId: parsed.guestId,
                        quickCode: parsed.quickCode,
                        ceremonyId: parsed.ceremonyId,
                    });
                    if (found) {
                        const isDuplicate = recordGuestScan(found.ceremony, found.guest, 'qr-scan');
                        if (isDuplicate) {
                            alert('⚠️ DOUBLON !!! Cette même invitation a déjà été scannée.');
                            showAlarm('⚠️ DOUBLON', 'Cette même invitation a déjà été scannée.', 'danger');
                            markVerifyDuplicate();
                        }
                        showGuestVerification(buildGuestQRDataFromRecords(found.ceremony, found.guest, {
                            isDuplicate: isDuplicate,
                        }));
                        refreshAppViews();
                        return;
                    }
                }

                // Chercher un invité par code brut dans toutes les cérémonies
                const guestByRaw = findGuestInAllCeremonies({ quickCode: parsed.code });
                if (guestByRaw) {
                    showGuestVerification(buildGuestQRDataFromRecords(guestByRaw.ceremony, guestByRaw.guest));
                    refreshAppViews();
                    return;
                }

                contentDiv.innerHTML = `
                    <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">✗</div>
                        <div style="font-weight: 600; color: #ef4444; margin-bottom: 5px;">Code Non Trouvé</div>
                        <p style="color: #991b1b; font-size: 14px;">Aucune invitation ne correspond à ce code</p>
                    </div>
                `;

            } catch (error) {
                console.error('Error verifying code:', error);
                contentDiv.innerHTML = `
                    <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                        <div style="font-weight: 600; color: #ef4444;">Erreur de Vérification</div>
                        <p style="color: #991b1b; font-size: 14px;">${error.message}</p>
                    </div>
                `;
            }

            codeInput.value = '';
        }

        window.verifyCode = verifyCode;
        window.toggleVerifyScanner = toggleVerifyScanner;
        window.stopVerifyCamera = stopVerifyCamera;
        window.openGlobalQrScanner = openGlobalQrScanner;
        window.closeGlobalQrScanner = closeGlobalQrScanner;
        window.closeQrScanPopup = closeQrScanPopup;
        window.goToVerifyFromPopup = goToVerifyFromPopup;
        window.handleQrScanDetected = handleQrScanDetected;

        function escapeVerifyHtml(value) {
            return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        function getGuestVerificationStatus(qrData) {
            if (qrData.isDuplicate) {
                return { className: 'verify-status--duplicate', icon: 'fa-circle-xmark', label: 'Doublon détecté', hint: 'Cette invitation a déjà été scannée' };
            }
            const ceremony = qrData.ceremony || {};
            const start = ceremony.startDateTime ? new Date(ceremony.startDateTime) : null;
            const end = ceremony.endDateTime ? new Date(ceremony.endDateTime) : null;
            const now = new Date();
            if (start && now < start) {
                return { className: 'verify-status--pending', icon: 'fa-clock', label: 'Pas encore valide', hint: 'La cérémonie n\'a pas encore commencé' };
            }
            if (end && now > end) {
                return { className: 'verify-status--expired', icon: 'fa-hourglass-end', label: 'Invitation expirée', hint: 'La période de la cérémonie est terminée' };
            }
            return { className: 'verify-status--valid', icon: 'fa-circle-check', label: 'Accès autorisé', hint: 'Invitation valide pour cette cérémonie' };
        }

        function displayGuestVerificationResult(qrData, resultDiv, contentDiv) {
            const guest = qrData.guest || {};
            const ceremony = qrData.ceremony || {};
            const status = getGuestVerificationStatus(qrData);
            const guestFirstName = guest.firstName || guest.fullName || '—';
            const guestLastName = guest.lastName || guest.postName || '—';
            const personCount = guest.personCount || guest.count || 1;
            const fullName = `${guestFirstName} ${guestLastName}`.trim();

            let eventDateDisplay = '—';
            if (ceremony.startDateTime) {
                eventDateDisplay = new Date(ceremony.startDateTime).toLocaleDateString('fr-FR', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
            }

            resultDiv.className = 'verify-result-panel ' + status.className;

            contentDiv.innerHTML = `
                <div class="verify-result-card ${status.className}">
                    <div class="verify-result-header">
                        <div class="verify-result-icon"><i class="fa-solid ${status.icon}"></i></div>
                        <div>
                            <h3 class="verify-result-title">${escapeVerifyHtml(status.label)}</h3>
                            <p class="verify-result-subtitle">${escapeVerifyHtml(status.hint)}</p>
                        </div>
                    </div>

                    <div class="verify-guest-hero">
                        <div class="verify-guest-avatar"><i class="fa-solid fa-user"></i></div>
                        <div>
                            <p class="verify-guest-name">${escapeVerifyHtml(fullName)}</p>
                            <p class="verify-guest-honorific">${escapeVerifyHtml(guest.honorific || 'Invité')}</p>
                        </div>
                        ${qrData.quickCode ? `<div class="verify-quick-code"><span>Code</span><strong>${escapeVerifyHtml(qrData.quickCode)}</strong></div>` : ''}
                    </div>

                    <div class="verify-details-grid">
                        <div class="verify-detail-item">
                            <span class="verify-detail-label"><i class="fa-solid fa-chair"></i> Place</span>
                            <span class="verify-detail-value">${escapeVerifyHtml(guest.seat || '—')}</span>
                        </div>
                        <div class="verify-detail-item">
                            <span class="verify-detail-label"><i class="fa-solid fa-users"></i> Personnes</span>
                            <span class="verify-detail-value verify-badge">${personCount}</span>
                        </div>
                        <div class="verify-detail-item">
                            <span class="verify-detail-label"><i class="fa-solid fa-phone"></i> Téléphone</span>
                            <span class="verify-detail-value">${escapeVerifyHtml(guest.phone || '—')}</span>
                        </div>
                        <div class="verify-detail-item">
                            <span class="verify-detail-label"><i class="fa-solid fa-id-card"></i> Post-nom</span>
                            <span class="verify-detail-value">${escapeVerifyHtml(guest.postName || '—')}</span>
                        </div>
                    </div>

                    <div class="verify-ceremony-box">
                        <p class="verify-ceremony-label"><i class="fa-solid fa-champagne-glasses"></i> Cérémonie</p>
                        <p class="verify-ceremony-name">${escapeVerifyHtml(ceremony.name || '—')}</p>
                        <div class="verify-ceremony-meta">
                            <span><i class="fa-solid fa-masks-theater"></i> ${escapeVerifyHtml(ceremony.type || '—')}</span>
                            <span><i class="fa-solid fa-location-dot"></i> ${escapeVerifyHtml(ceremony.location || '—')}</span>
                        </div>
                        <p class="verify-ceremony-date"><i class="fa-solid fa-calendar"></i> ${escapeVerifyHtml(eventDateDisplay)}</p>
                    </div>

                    <button type="button" id="verifyPrintBtnGuest" data-qr="${encodeURIComponent(JSON.stringify(qrData))}" class="btn btn-primary verify-print-btn">
                        <i class="fa-solid fa-print"></i> Imprimer le reçu
                    </button>
                </div>
            `;

            try {
                const printBtn = contentDiv.querySelector('#verifyPrintBtnGuest');
                if (printBtn) {
                    printBtn.addEventListener('click', function() {
                        try {
                            const data = JSON.parse(decodeURIComponent(this.dataset.qr || ''));
                            printGuestVerificationCardObj(data);
                        } catch (e) {
                            console.error('Erreur parsing QR data pour impression:', e);
                            alert('Impossible d\'imprimer : données corrompues.');
                        }
                    });
                }
            } catch (e) { console.warn('attach print listener failed', e); }
        }

        function displayVisitorVerificationResult(visitor, isValid, resultDiv, contentDiv) {
            // Implementation de la vérification des visiteurs (existing code)
            const now = new Date();
            const timeLeft = visitor.endTime - now;
            const minutesLeft = Math.floor(timeLeft / 60000);
            const hoursLeft = Math.floor(minutesLeft / 60);
            const timeRemaining = hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft % 60}m` : `${minutesLeft}m`;
            
            const photoDisplay = visitor.photo ? `<img src="${visitor.photo}" alt="Photo" style="width: 120px; height: 120px; border-radius: 8px; object-fit: cover; margin-bottom: 15px;">` : '';
            
            const isDuplicate = visitor.isDuplicate;
            const statusColor = isDuplicate ? '#ef4444' : (isValid ? '#10b981' : '#ef4444');
            const statusIcon = isDuplicate ? '✗' : (isValid ? '✓' : '✗');
            const statusText = isDuplicate ? 'Refuser' : (isValid ? 'Autorisé' : (visitor.isComing ? 'Pas encore' : 'Expiré'));

            contentDiv.innerHTML += `
                <div style="background: linear-gradient(135deg, ${statusColor}20 0%, ${statusColor}10 100%); border: 2px solid ${statusColor}; border-radius: 12px; padding: 25px; text-align: center;">
                    ${photoDisplay}
                    <div style="font-size: 48px; margin-bottom: 10px;">${statusIcon}</div>
                    <div style="font-weight: 700; font-size: 24px; color: ${statusColor}; margin-bottom: 10px;">${statusText}</div>
                    <p style="color: #1f2937; font-weight: 600; margin-bottom: 5px;">${visitor.name}</p>
                    <p style="color: #64748b; margin-bottom: 15px;">${visitor.email}</p>
                    <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; font-size: 14px;">
                        <p style="margin: 0 0 8px 0;"><strong>Catégorie:</strong> ${visitor.category}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Localisation:</strong> ${visitor.location}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Code Rapide:</strong> ${visitor.quickCode || '-'}</p>
                        <p style="margin: 0;"><strong>Temps restant:</strong> ${timeRemaining}</p>
                    </div>
                    <button onclick="printVisitorVerificationCard('${visitor.id}')" class="btn btn-primary" style="width: 100%;">🖨️ Imprimer</button>
                </div>
            `;
        }

        function printGuestVerificationCard(qrDataJson) {
            try {
                const qrData = JSON.parse(qrDataJson);
                printGuestVerificationCardObj(qrData);
            } catch (e) {
                console.error('printGuestVerificationCard parse error', e);
                alert('Erreur d\'impression: données invalides.');
            }
        }

        // Variante acceptant directement l'objet QR data (utilisée par le listener sécurisé)
        function printGuestVerificationCardObj(qrData) {
            if (!qrData) return;
            const guest = qrData.guest || {};
            const ceremony = qrData.ceremony || {};

            // Construire QR image (encodage de l'objet qrData pour conserver les infos)
            let qrImgUrl = '';
            try {
                const qrPayload = encodeURIComponent(JSON.stringify(qrData));
                qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${qrPayload}`;
            } catch (e) { qrImgUrl = ''; }

            const ceremonyMessage = 'Merci de nous honorer avec votre presence';

            const printContent = `<!doctype html><html><head><meta charset="utf-8"><title>Impression - ${guest.lastName || ''}</title></head><body style="font-family: Arial, sans-serif; padding: 10px; background: #fff;">` +
                `<div style="max-width:720px;margin:0 auto;padding:20px;border-radius:12px;border:1px solid #f1f5f9;box-shadow:0 10px 40px rgba(0,0,0,0.06);">` +
                    `<div style="background: linear-gradient(90deg,#f97316,#f43f5e);padding:18px;border-radius:10px;color:white; text-align:center; box-shadow: inset 0 -6px 20px rgba(255,255,255,0.06);">` +
                        `<div style="font-size:18px;font-weight:800;">🎉 ${ceremony.name || ''} 🎉</div>` +
                        `<div style="font-size:12px;opacity:0.95;margin-top:6px;">${ceremonyMessage}</div>` +
                    `</div>` +
                    `<div style="display:flex;gap:18px;align-items:center;justify-content:center;padding:18px 0;">` + (qrImgUrl ? `<img src="${qrImgUrl}" style="width:210px;height:210px;border-radius:12px;border:6px solid #fff;box-shadow:0 10px 30px rgba(244,63,94,0.08);">` : '') + `<div style="flex:1;text-align:left;">` +
                        `<h2 style="margin:0 0 8px 0;font-size:20px;color:#111827;">${(guest.honorific? guest.honorific + ' ' : '') + (guest.lastName||'') + (guest.firstName ? ' ' + guest.firstName : '')}</h2>` +
                        `<p style="margin:0 0 6px 0;font-weight:700;color:#374151;">Place: ${guest.seat || '-'}</p>` +
                        `<p style="margin:0 0 6px 0;color:#6b7280;">Post-nom: ${guest.postName || '-'}</p>` +
                    `</div></div>` +
                    `<div style="text-align:center;margin-top:8px;">` +
                        `<div style="display:inline-block;padding:8px 12px;background:linear-gradient(90deg,#fff7ed,#fff3f2);border-radius:999px;font-weight:700;color:#b91c1c;">Code: ${qrData.quickCode || ''}</div>` +
                    `</div>` +
                    `<div style="margin-top:14px;text-align:center;color:#94a3b8;font-size:12px;">Vérification effectuée le ${new Date().toLocaleString('fr-FR')}</div>` +
                `</div></body></html>`;

            const printWindow = window.open('', '', 'width=720,height=780');
            if (!printWindow) { alert('Impossible d’ouvrir la fenêtre d’impression. Autorisez les popups pour ce site.'); return; }
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }

        // Effet confetti spectaculaire à la détection d'un doublon
        function showSpectacularDuplicateEffect(container) {
            if (!container) return;
            try {
                container.style.position = container.style.position || 'relative';

                // Play a short alert sound
                try {
                    const ctx = getAudioContext();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.value = 560;
                    gain.gain.setValueAtTime(0.16, ctx.currentTime);
                    osc.connect(gain); gain.connect(ctx.destination);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.4);
                } catch (e) { /* ignore audio failures */ }

                // Banner overlay
                const banner = document.createElement('div');
                banner.style.position = 'absolute';
                banner.style.left = '50%';
                banner.style.top = '10%';
                banner.style.transform = 'translateX(-50%) scale(0.8)';
                banner.style.padding = '18px 28px';
                banner.style.zIndex = 9999;
                banner.style.borderRadius = '12px';
                banner.style.background = 'linear-gradient(90deg,#ff6b6b,#ffb347)';
                banner.style.color = 'white';
                banner.style.fontSize = '20px';
                banner.style.fontWeight = '800';
                banner.style.boxShadow = '0 10px 40px rgba(0,0,0,0.25)';
                banner.style.opacity = '0';
                banner.textContent = '⚠️ DOUBLON - Invitation déjà scannée';
                container.appendChild(banner);

                // confetti pieces
                const count = 42;
                const colors = ['#ff5252','#ffd166','#34d399','#60a5fa','#f472b6','#f59e0b','#a78bfa','#fb7185'];
                const pieces = [];
                const rect = container.getBoundingClientRect();
                for (let i=0;i<count;i++) {
                    const p = document.createElement('div');
                    p.className = 'cf-piece';
                    const color = colors[Math.floor(Math.random()*colors.length)];
                    p.style.background = color;
                    p.style.width = (6 + Math.random()*12) + 'px';
                    p.style.height = (8 + Math.random()*14) + 'px';
                    p.style.left = (Math.random() * (rect.width - 20)) + 'px';
                    p.style.top = (10 + Math.random()*30) + 'px';
                    const dur = 700 + Math.random()*900;
                    p.style.borderRadius = Math.random() > 0.5 ? '2px' : '50%';
                    p.style.opacity = '1';
                    p.style.animation = `confettiFall ${dur}ms cubic-bezier(.2,.7,.2,1) forwards`;
                    container.appendChild(p);
                    pieces.push(p);
                }

                // animate banner in
                requestAnimationFrame(()=>{
                    banner.style.transition = 'transform 260ms cubic-bezier(.2,.8,.2,1), opacity 220ms';
                    banner.style.transform = 'translateX(-50%) scale(1)';
                    banner.style.opacity = '1';
                });

                // cleanup after animation
                setTimeout(()=>{
                    try { banner.style.opacity = '0'; banner.style.transform = 'translateX(-50%) scale(0.9)'; } catch(e){}
                }, 900);
                setTimeout(()=>{
                    pieces.forEach(px=>{ try{ px.remove(); }catch(e){} });
                    try{ banner.remove(); }catch(e){}
                }, 2000);
            } catch(e) { console.warn('confetti error', e); }
        }

        function printVisitorVerificationCard(visitorId) {
            const visitor = visitors.find(v => v.id === visitorId);
            if (!visitor) {
                alert('Visiteur introuvable pour impression.');
                return;
            }

            const startTime = visitor.startTime ? new Date(visitor.startTime) : null;
            const endTime = visitor.endTime ? new Date(visitor.endTime) : null;
            const printContent = `
                <div style="text-align: center; padding: 30px; font-family: Arial, sans-serif; max-width: 450px; margin: 0 auto;">
                    <h2 style="margin: 0 0 10px 0; color: #1f2937;">${visitor.name || ''}</h2>
                    <p style="margin: 0 0 10px 0; color: #0ea5e9; font-weight: 600;">${visitor.quickCode || ''}</p>
                    <div style="background: #f8fafc; padding: 18px; border-radius: 10px; margin-bottom: 20px; text-align: left;">
                        <p style="margin: 0 0 8px 0;"><strong>Catégorie:</strong> ${visitor.category || 'N/A'}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Localisation:</strong> ${visitor.location || 'N/A'}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Début:</strong> ${startTime ? startTime.toLocaleString('fr-FR') : 'N/A'}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Fin:</strong> ${endTime ? endTime.toLocaleString('fr-FR') : 'N/A'}</p>
                    </div>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">Imprimé le ${new Date().toLocaleString('fr-FR')}</p>
                </div>
            `;

            const printWindow = window.open('', '', 'width=600, height=500');
            if (!printWindow) {
                alert('Impossible d’ouvrir la fenêtre d’impression. Autorisez les popups pour ce site.');
                return;
            }
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }

        // Actualiser le tableau de bord
        function updateDashboard() {
            reloadAppDataFromStorage();
            const now = new Date();
            const todayKey = now.toDateString();
            const oneHourLater = new Date(now.getTime() + 60 * 60000);
            const ceremonyList = Array.isArray(ceremonies) ? ceremonies : [];

            const activeHtml = [];
            const expiringHtml = [];
            let totalGuests = 0;
            let scansToday = 0;
            let activeCeremonies = 0;

            ceremonyList.forEach(ceremony => {
                const guests = ceremony.guests || [];
                totalGuests += guests.length;

                guests.forEach(guest => {
                    (guest.scans || []).forEach(scan => {
                        const scanDate = scan.timestamp ? new Date(scan.timestamp) : null;
                        if (scanDate && scanDate.toDateString() === todayKey) {
                            scansToday++;
                        }
                    });
                });

                if (isCeremonyActive(ceremony, now)) {
                    activeCeremonies++;
                    activeHtml.push(createCeremonyDashboardHTML(ceremony));
                }

                const end = parseAppDate(ceremony.data?.endDateTime);
                if (end && now <= end && end <= oneHourLater) {
                    expiringHtml.push(createCeremonyDashboardHTML(ceremony));
                }
            });

            const activeEl = document.getElementById('activeCount');
            const totalEl = document.getElementById('totalCount');
            const expiringEl = document.getElementById('expiringCount');
            const ceremonyEl = document.getElementById('ceremonyCount');
            if (activeEl) activeEl.textContent = activeCeremonies;
            if (totalEl) totalEl.textContent = totalGuests;
            if (expiringEl) expiringEl.textContent = scansToday;
            if (ceremonyEl) ceremonyEl.textContent = ceremonyList.length;

            const activeBadge = document.getElementById('activeBadge');
            const expiringBadge = document.getElementById('expiringBadge');
            if (activeBadge) activeBadge.textContent = activeHtml.length + ' active' + (activeHtml.length > 1 ? 's' : '');
            if (expiringBadge) expiringBadge.textContent = expiringHtml.length + ' alerte' + (expiringHtml.length > 1 ? 's' : '');

            const emptyActive = '<div class="empty-state"><i class="fa-solid fa-champagne-glasses"></i><p>Aucune cérémonie en cours pour le moment</p></div>';
            const emptyExpiring = '<div class="empty-state"><i class="fa-solid fa-bell-slash"></i><p>Aucune cérémonie ne se termine bientôt</p></div>';
            const visitorsActive = document.getElementById('visitorsActive');
            const visitorsExpiring = document.getElementById('visitorsExpiring');
            if (visitorsActive) visitorsActive.innerHTML = activeHtml.length ? activeHtml.join('') : emptyActive;
            if (visitorsExpiring) visitorsExpiring.innerHTML = expiringHtml.length ? expiringHtml.join('') : emptyExpiring;
        }

        function createCeremonyDashboardHTML(ceremony) {
            const data = ceremony.data || {};
            const name = data.name || ceremony.name || `Cérémonie ${ceremony.id}`;
            const location = data.location || '—';
            const type = data.type || 'Cérémonie';
            const guestCount = (ceremony.guests || []).length;
            return `
                <div class="visitor-item active" onclick="openCeremonyDetails(${ceremony.id})">
                    <div class="visitor-photo"><i class="fa-solid fa-champagne-glasses"></i></div>
                    <div class="visitor-info">
                        <div class="visitor-name">${name}</div>
                        <div class="visitor-meta">
                            <span>🎭 ${type}</span>
                            <span>📍 ${location}</span>
                            <span>👥 ${guestCount} invité(s)</span>
                        </div>
                    </div>
                    <div class="visitor-status active">
                        <div class="status-dot"></div>
                        Actif
                    </div>
                </div>
            `;
        }

        // Creer le HTML pour un visiteur dans les listes Actifs et Expirants
        function createVisitorHTML(visitor, isExpiring) {
            const now = new Date();
            const endTime = parseAppDate(visitor.endTime);
            const startTime = parseAppDate(visitor.startTime);
            if (!endTime || !startTime) {
                return '';
            }
            const isExpired = now > endTime;
            const isComing = now < startTime;

            let statusText = 'Actif';
            let statusClass = 'active';

            if (isExpired) {
                statusText = 'Expiré';
                statusClass = 'expired';
            } else if (isExpiring) {
                statusText = 'Expire Bientôt';
                statusClass = 'expiring';
            } else if (isComing) {
                statusText = 'À Venir';
                statusClass = 'expiring';
            }

            const photoHtml = visitor.photo 
                ? `<div class="visitor-photo"><img src="${visitor.photo}" alt="${visitor.name}"></div>`
                : `<div class="visitor-photo"><i class="fa-solid fa-user"></i></div>`;

            return `
                <div class="visitor-item ${statusClass}" onclick="showVisitorDetails('${visitor.id}')">
                    ${photoHtml}
                    <div class="visitor-info">
                        <div class="visitor-name">${visitor.name}</div>
                        <div class="visitor-meta">
                            <span>📍 ${visitor.location}</span>
                            <span>🛠️ ${visitor.service}</span>
                            <span>#️⃣ ${visitor.requestNumber}</span>
                            <span>⚧ ${visitor.sexe || 'N/A'}</span>
                            <span>⏱️ ${endTime.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
                            <span>📧 ${visitor.email}</span>
                        </div>
                    </div>
                    <div class="visitor-status ${statusClass}">
                        <div class="status-dot"></div>
                        ${statusText}
                    </div>
                </div>
            `;
        }

        // Les details du visiteur
        function showCeremonyHistoryDetails(ceremonyId) {
            const ceremony = ceremonies.find(c => String(c.id) === String(ceremonyId));
            if (!ceremony) return;

            const ceremonyName = ceremony.data?.name || ceremony.name || `Cérémonie ${ceremony.id}`;
            const brideName = ceremony.data?.brideName || 'N/A';
            const groomName = ceremony.data?.groomName || 'N/A';
            const location = ceremony.data?.location || 'N/A';
            const type = ceremony.data?.type || 'N/A';
            const start = ceremony.data?.startDateTime ? new Date(ceremony.data.startDateTime).toLocaleString('fr-FR') : 'N/A';
            const end = ceremony.data?.endDateTime ? new Date(ceremony.data.endDateTime).toLocaleString('fr-FR') : 'N/A';
            const guestCount = ceremony.guests ? ceremony.guests.length : 0;

            alert(`Détails de la cérémonie:\n\nNom: ${ceremonyName}\nMariée: ${brideName}\nMarié: ${groomName}\nLieu: ${location}\nType: ${type}\nDébut: ${start}\nFin: ${end}\nInvités: ${guestCount}`);
        }

        function inspectCeremonyResult(ceremonyId) {
            const ceremony = ceremonies.find(c => String(c.id) === String(ceremonyId)) || managedCeremonies.find(mc => String(mc.id) === String(ceremonyId));
            if (!ceremony) {
                alert('Cérémonie introuvable.');
                return;
            }

            const gestionButton = document.querySelector('.nav-tab[onclick*="gestionceremonies"]');
            switchTab('gestionceremonies', gestionButton);
            setTimeout(() => {
                openCeremonyForm(ceremonyId);
                const form = document.getElementById('ceremonyManagementForm');
                if (form) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 250);
        }

        function reloadAppDataFromStorage() {
            try {
                const rawCer = localStorage.getItem('ceremonies');
                if (rawCer !== null) {
                    const parsed = JSON.parse(rawCer);
                    if (Array.isArray(parsed)) ceremonies = parsed;
                }
                const rawManaged = localStorage.getItem('managedCeremonies');
                if (rawManaged !== null) {
                    const parsed = JSON.parse(rawManaged);
                    if (Array.isArray(parsed)) managedCeremonies = parsed;
                }
                const rawLog = localStorage.getItem('accessLog');
                if (rawLog !== null) {
                    const parsed = JSON.parse(rawLog);
                    if (Array.isArray(parsed)) accessLog = parsed;
                }
            } catch (e) {
                console.warn('reloadAppDataFromStorage:', e);
            }
        }

        function getCeremoniesForHistorySearch() {
            reloadAppDataFromStorage();
            return (ceremonies || []).map(cer => {
                const mgmt = (managedCeremonies || []).find(m => String(m.id) === String(cer.id));
                if (!mgmt?.data) return cer;
                return {
                    ...cer,
                    data: { ...(cer.data || {}), ...mgmt.data },
                };
            });
        }

        function guestMatchesQuery(guest, queryLower) {
            if (!guest || !queryLower) return false;
            const combined = `${guest.firstName || ''} ${guest.lastName || ''}`.trim().toLowerCase();
            if (combined && combined.includes(queryLower)) return true;
            const fields = [guest.fullName, guest.full_name, guest.nom, guest.phone, guest.quickCode];
            return fields.some(v => v && String(v).toLowerCase().includes(queryLower));
        }

        // Mise a jour du journal d'accès
        function updateAccessLog(filterQuery) {
            reloadAppDataFromStorage();
            let logs = accessLog.slice(-50).reverse();
            if (filterQuery) {
                const q = filterQuery.toLowerCase();
                logs = logs.filter(log => {
                    const name = (log.visitorName || '').toLowerCase();
                    const loc = (log.location || '').toLowerCase();
                    const code = (log.code || log.codeScanned || '').toLowerCase();
                    const date = log.timestamp ? new Date(log.timestamp).toLocaleString('fr-FR').toLowerCase() : '';
                    return name.includes(q) || loc.includes(q) || code.includes(q) || date.includes(q);
                });
            }
            const logContainer = document.getElementById('accessLog');
            if (!logContainer) return;
            const logHtml = logs.map(log => {
                const date = new Date(log.timestamp);
                const approved = log.result === 'approved';
                const icon = approved
                    ? '<i class="fa-solid fa-circle-check" style="color:#16a34a"></i>'
                    : '<i class="fa-solid fa-circle-xmark" style="color:#dc2626"></i>';
                const statusClass = approved ? '' : 'denied';
                
                return `
                    <div class="log-item ${statusClass}">
                        <div class="log-timestamp">${icon} ${date.toLocaleString('fr-FR')}</div>
                        <div class="log-details">
                            <strong>${log.visitorName}</strong> — ${log.location}
                            ${approved ? '(Accès autorisé)' : '(Accès refusé)'}
                        </div>
                    </div>
                `;
            }).join('');

            const emptyMessage = filterQuery
                ? '<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>Aucun accès ne correspond à la recherche</p></div>'
                : '<div class="empty-state"><i class="fa-solid fa-clipboard-list"></i><p>Aucun accès enregistré</p></div>';
            logContainer.innerHTML = logHtml || emptyMessage;
        }

        function renderHistorySearchResults(results) {
            const container = document.getElementById('historyResults');
            if (!container) return;
            if (!results || results.length === 0) {
                container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>Aucun résultat</p></div>';
                return;
            }

            const queryLower = document.getElementById('historySearch')?.value.trim().toLowerCase() || '';
            container.innerHTML = results.map(ceremony => {
                const ceremonyName = ceremony.data?.name || ceremony.name || `Cérémonie ${ceremony.id}`;
                const brideName = ceremony.data?.brideName || 'N/A';
                const groomName = ceremony.data?.groomName || 'N/A';
                const location = ceremony.data?.location || 'N/A';
                const type = ceremony.data?.type || 'N/A';
                const start = ceremony.data?.startDateTime ? new Date(ceremony.data.startDateTime).toLocaleString('fr-FR') : 'N/A';
                const end = ceremony.data?.endDateTime ? new Date(ceremony.data.endDateTime).toLocaleString('fr-FR') : 'N/A';
                const matchedGuest = ceremony.guests?.find(g => guestMatchesQuery(g, queryLower)) || null;
                const quickCodeLabel = matchedGuest?.quickCode
                    ? `Code: ${matchedGuest.quickCode}`
                    : (matchedGuest ? `${matchedGuest.firstName || ''} ${matchedGuest.lastName || matchedGuest.fullName || ''}`.trim() : '');

                return `
                    <div class="history-result-item">
                        <div>
                            <div class="history-result-title">${ceremonyName}</div>
                            <div class="history-result-meta">
                                <span><i class="fa-solid fa-person-dress"></i> ${brideName}</span>
                                <span><i class="fa-solid fa-person"></i> ${groomName}</span>
                                <span><i class="fa-solid fa-location-dot"></i> ${location}</span>
                                <span><i class="fa-solid fa-masks-theater"></i> ${type}</span>
                                <span><i class="fa-solid fa-calendar"></i> ${start}</span>
                                <span><i class="fa-solid fa-clock"></i> ${end}</span>
                                ${quickCodeLabel ? `<span><i class="fa-solid fa-hashtag"></i> ${quickCodeLabel}</span>` : ''}
                            </div>
                        </div>
                        <div class="history-result-actions">
                            <button type="button" class="btn btn-secondary btn-icon btn-small" onclick="showCeremonyHistoryDetails('${ceremony.id}'); event.stopPropagation();">
                                <i class="fa-solid fa-circle-info"></i> Détails
                            </button>
                            <button type="button" class="btn btn-primary btn-icon btn-small" onclick="inspectCeremonyResult('${ceremony.id}'); event.stopPropagation();">
                                <i class="fa-solid fa-magnifying-glass"></i> Inspecter
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function performHistorySearch() {
            const searchEl = document.getElementById('historySearch');
            const resultsEl = document.getElementById('historyResults');
            if (!searchEl || !resultsEl) return;

            const q = searchEl.value.trim().toLowerCase();
            if (!q) {
                resultsEl.innerHTML = '';
                updateAccessLog();
                return;
            }

            const queryLower = q;
            const parseDateQuery = (query) => {
                const direct = new Date(query);
                if (!isNaN(direct)) return direct;
                const french = query.replace(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/, '$2/$1/$3');
                const parsed = new Date(french);
                return !isNaN(parsed) ? parsed : null;
            };

            const parsedDate = parseDateQuery(q);
            const searchableCeremonies = getCeremoniesForHistorySearch();

            const results = searchableCeremonies.filter(ceremony => {
                const name = (ceremony.data?.name || ceremony.name || '').toString().toLowerCase();
                const bride = (ceremony.data?.brideName || '').toString().toLowerCase();
                const groom = (ceremony.data?.groomName || '').toString().toLowerCase();
                const location = (ceremony.data?.location || '').toString().toLowerCase();
                const type = (ceremony.data?.type || '').toString().toLowerCase();
                const id = (ceremony.id || '').toString().toLowerCase();
                const startDate = ceremony.data?.startDateTime ? new Date(ceremony.data.startDateTime) : null;
                const endDate = ceremony.data?.endDateTime ? new Date(ceremony.data.endDateTime) : null;
                const startDateString = startDate ? startDate.toLocaleDateString('fr-FR') : '';
                const endDateString = endDate ? endDate.toLocaleDateString('fr-FR') : '';
                const guestMatch = ceremony.guests?.some(guest => guestMatchesQuery(guest, queryLower));
                const dateMatch = (startDateString.includes(queryLower) || endDateString.includes(queryLower) || (startDate && startDate.toLocaleString('fr-FR').toLowerCase().includes(queryLower)) || (endDate && endDate.toLocaleString('fr-FR').toLowerCase().includes(queryLower)));
                const parsedDateMatch = parsedDate && ((startDate && startDate.toDateString() === parsedDate.toDateString()) || (endDate && endDate.toDateString() === parsedDate.toDateString()));

                return name.includes(queryLower) || bride.includes(queryLower) || groom.includes(queryLower) || location.includes(queryLower) || type.includes(queryLower) || id.includes(queryLower) || guestMatch || dateMatch || parsedDateMatch;
            });

            renderHistorySearchResults(results);
            updateAccessLog(q);
        }

        const historySearchDebounced = debounce(performHistorySearch, 200);
        let historySearchInitialized = false;

        function initHistorySearch() {
            const searchInput = document.getElementById('historySearch');
            const clearBtn = document.getElementById('historyClearBtn');
            if (!searchInput || historySearchInitialized) return;

            searchInput.addEventListener('input', historySearchDebounced);
            searchInput.addEventListener('search', performHistorySearch);
            if (clearBtn) {
                clearBtn.addEventListener('click', function() {
                    searchInput.value = '';
                    const resultsEl = document.getElementById('historyResults');
                    if (resultsEl) resultsEl.innerHTML = '';
                    updateAccessLog();
                    searchInput.focus();
                });
            }
            historySearchInitialized = true;
        }

        (function onDocumentReady(fn) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', fn);
            } else {
                fn();
            }
        })(initHistorySearch);

        // Systhene d'alarme pour les invitations expirées et celles qui expirent bientôt
        function startAlarmSystem() {
            setInterval(function() {
                const now = new Date();
                const threeMinutesLater = new Date(now.getTime() + 3 * 60000);

                visitors.forEach(visitor => {
                    // Alerte d'expiration imminente (3 minutes avant)
                    if (visitor.endTime <= threeMinutesLater && visitor.endTime > now && !visitor.alertedBefore) {
                        const minutesLeft = Math.round((visitor.endTime - now) / 60000);
                        showAlarm(`${visitor.name} - Expire Bientôt!`, `L'invitation expire dans ${minutesLeft} minutes.`, 'warning');
                        visitor.alertedBefore = true;
                    }

                    // Alerte d'expiration (au moment exact)
                    if (now >= visitor.endTime && !visitor.alertedExpired) {
                        showAlarm(`${visitor.name} - Invitation Expirée!`, `L'invitation de ${visitor.name} pour ${visitor.location} a expiré.`);
                        visitor.alertedExpired = true;
                    }

                    // Réinitialiser les drapeaux si l'invitation est loin dans le futur
                    if (visitor.endTime > threeMinutesLater) {
                        visitor.alertedBefore = false;
                        visitor.alertedExpired = false;
                    }
                });
            }, 30000); // Vérifier toutes les 30 secondes
        }

        // Afficher l'alarme
        function showAlarm(title, message, type = 'danger') {
            const notification = document.getElementById('alarmNotification');
            const details = document.getElementById('alarmDetails');

            details.textContent = message;
            notification.classList.add('active');

            if (type === 'danger') {
                notification.classList.add('alarm-active');
            } else {
                notification.classList.remove('alarm-active');
            }

            playSound('alarm');

            setTimeout(function() {
                closeAlarm();
            }, 8000);
        }
        // Fermer l'alarme
        function closeAlarm() {
            const notification = document.getElementById('alarmNotification');
            notification.classList.remove('active');
            notification.classList.remove('alarm-active');
        }
        // Rapport Journalier
        function showDailyReport() {
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

            // Filtrer les visiteurs créés aujourd'hui
            const dailyVisitors = visitors.filter(v => {
                const createdDate = new Date(v.createdAt);
                return createdDate >= todayStart && createdDate < todayEnd;
            });

            // Filtrer les logs d'accès d'aujourd'hui
            const dailyAccessLog = accessLog.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate >= todayStart && logDate < todayEnd;
            });

            document.getElementById('reportContent').innerHTML = '<div class="report-section"><div class="report-title">📊 Bilan Journalier</div><div class="report-stats"><div class="report-stat"><div class="report-stat-value">' + dailyVisitors.length + '</div><div class="report-stat-label">Invitations Totales</div></div><div class="report-stat"><div class="report-stat-value">' + dailyVisitors.filter(v => { const startTime = (v.startTime instanceof Date) ? v.startTime : new Date(v.startTime); const endTime = (v.endTime instanceof Date) ? v.endTime : new Date(v.endTime); return new Date() >= startTime && new Date() <= endTime; }).length + '</div><div class="report-stat-label">Actives</div></div><div class="report-stat"><div class="report-stat-value">' + dailyVisitors.filter(v => { const endTime = (v.endTime instanceof Date) ? v.endTime : new Date(v.endTime); return new Date() > endTime; }).length + '</div><div class="report-stat-label">Expirées</div></div><div class="report-stat"><div class="report-stat-value">' + dailyAccessLog.length + '</div><div class="report-stat-label">Scans Total</div></div></div></div>';
            // Correction : conversion des dates
            document.getElementById('reportContent').innerHTML = '<div class="report-section"><div class="report-title">📊 Bilan Journalier</div><div class="report-stats"><div class="report-stat"><div class="report-stat-value">' + dailyVisitors.length + '</div><div class="report-stat-label">Invitations Totales</div></div><div class="report-stat"><div class="report-stat-value">' + dailyVisitors.filter(v => { const startTime = (v.startTime instanceof Date) ? v.startTime : new Date(v.startTime); const endTime = (v.endTime instanceof Date) ? v.endTime : new Date(v.endTime); return new Date() >= startTime && new Date() <= endTime; }).length + '</div><div class="report-stat-label">Actives</div></div><div class="report-stat"><div class="report-stat-value">' + dailyVisitors.filter(v => { const endTime = (v.endTime instanceof Date) ? v.endTime : new Date(v.endTime); return new Date() > endTime; }).length + '</div><div class="report-stat-label">Expirées</div></div><div class="report-stat"><div class="report-stat-value">' + dailyAccessLog.length + '</div><div class="report-stat-label">Scans Total</div></div></div></div>';
            document.getElementById('reportModal').classList.add('active');
            document.getElementById('reportModal').style.display = 'flex';
        }

        function downloadReport() {
            let csv = 'BILAN JOURNALIER\nTotal,' + visitors.length + '\nActifs,' + visitors.filter(v => { const startTime = (v.startTime instanceof Date) ? v.startTime : new Date(v.startTime); const endTime = (v.endTime instanceof Date) ? v.endTime : new Date(v.endTime); return new Date() >= startTime && new Date() <= endTime; }).length;
            const blob = new Blob([csv], { type: 'text/csv' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'bilan.csv';
            link.click();
            alert('✓ Téléchargé!');
        }

        function closeReportModal() {
            var modal = document.getElementById('reportModal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }
        }

        // Afficher la liste des détails selon le type
        function showDetailsList(type) {
            const now = new Date();
            const oneHourLater = new Date(now.getTime() + 60 * 60000);
            let filteredVisitors = [];
            let title = '';

            if (type === 'active') {
                title = '📌 Rendez-vous Actifs';
                filteredVisitors = visitors.filter(v => {
                    const startTime = (v.startTime instanceof Date) ? v.startTime : new Date(v.startTime);
                    const endTime = (v.endTime instanceof Date) ? v.endTime : new Date(v.endTime);
                    return now >= startTime && now <= endTime && v.category !== 'ceremonie';
                });
            } else if (type === 'created') {
                title = '📋 Total Créés';
                filteredVisitors = visitors.filter(v => v.category !== 'ceremonie');
            } else if (type === 'expiring') {
                title = '⏰ Expirations Proches';
                filteredVisitors = visitors.filter(v => {
                    const endTime = (v.endTime instanceof Date) ? v.endTime : new Date(v.endTime);
                    return now <= endTime && endTime <= oneHourLater;
                });
            } else if (type === 'ceremony') {
                title = '🎉 Cérémonies ';
                filteredVisitors = visitors.filter(v => {
                    const startTime = (v.startTime instanceof Date) ? v.startTime : new Date(v.startTime);
                    const endTime = (v.endTime instanceof Date) ? v.endTime : new Date(v.endTime);
                    return v.category === 'ceremonie' && now >= startTime && now <= endTime;
                });
            }

            document.getElementById('detailsListTitle').textContent = title;

            if (filteredVisitors.length === 0) {
                document.getElementById('detailsListContent').innerHTML = '<p style="text-align: center; color: var(--dark); opacity: 0.6; padding: 40px;">Aucun élément à afficher</p>';
            } else {
                let htmlContent = '';
                filteredVisitors.forEach(v => {
                    const endTimeStr = new Date(v.endTime).toLocaleString('fr-FR');
                    const photoHtml = v.photo ? `<img src="${v.photo}" alt="${v.name}">` : '<div style="width: 80px; height: 80px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 30px;">👤</div>';
                    let infoGrid = '';
                    if (v.sexe) infoGrid += `<div><strong>Sexe:</strong> ${v.sexe}</div>`;
                    if (v.phone) infoGrid += `<div><strong>Téléphone:</strong> ${v.phone}</div>`;
                    if (v.email) infoGrid += `<div><strong>Email:</strong> ${v.email}</div>`;
                    if (v.type) infoGrid += `<div><strong>Type:</strong> ${v.type}</div>`;
                    if (v.location) infoGrid += `<div><strong>Lieu:</strong> ${v.location}</div>`;
                    if (v.service) infoGrid += `<div><strong>Service:</strong> ${v.service}</div>`;
                    if (v.cerPlace) infoGrid += `<div><strong>Place Attitrée:</strong> <span style="color: #e11d48; font-weight: 600;">${v.cerPlace}</span></div>`;
                    if (v.capacity) infoGrid += `<div><strong>Nombre de Personnes:</strong> <span style="color: #0ea5e9; font-weight: 600;">${v.capacity}</span></div>`;
                    if (v.quickCode) infoGrid += `<div><strong>Code Rapide:</strong> <span style="color: #0ea5e9; font-weight: 600;">${v.quickCode}</span></div>`;
                    if (v.endTime) infoGrid += `<div><strong>Fin Valid:</strong> ${new Date(v.endTime).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</div>`;
                    htmlContent += `
                        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 15px; background: rgba(255, 250, 240, 0.5); display: flex; gap: 20px; position: relative;">
                            <button class="btn btn-primary btn-small" style="position: absolute; top: 10px; right: 10px; z-index: 2;" onclick="printCeremonyCard('${v.id}')">🖨️ Imprimer</button>
                            <div>${photoHtml}</div>
                            <div style="flex: 1;">
                                <div style="font-weight: 700; font-size: 16px; margin-bottom: 10px; color: var(--dark);">${v.name}</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">${infoGrid}</div>
                            </div>
                        </div>
                    `;
                });
                document.getElementById('detailsListContent').innerHTML = htmlContent;
            }

            // Affichage simple sans animation
            document.getElementById('detailsListModal').style.display = 'flex';
        }

        // Fermer le modal de détails
        function closeDetailsListModal() {
            // Fermeture simple sans animation
            document.getElementById('detailsListModal').style.display = 'none';
        }

        // Imprimer la fiche du visiteur
        function printVisitorCard(visitorId) {
            const visitor = visitors.find(v => v.id === visitorId);
            if (!visitor) return;
            const printWindow = window.open('', '_blank');
            const title = `Fiche Visiteur - ${visitor.name}`;
            const photoHtml = visitor.photo ? `<img src="${visitor.photo}" alt="${visitor.name}" style="width: 70px; height: 70px; border-radius: 8px; object-fit: cover; border: 2px solid #0ea5e9;">` : '<div style="width: 70px; height: 70px; background: #e5e7eb; border-radius: 8px; border: 2px solid #0ea5e9; display: flex; align-items: center; justify-content: center; font-size: 30px;">👤</div>';
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(visitor.id)}`;
            let infoGrid = '';
            let fields = [
                { key: 'sexe', label: 'Sexe' },
                { key: 'phone', label: 'Téléphone' },
                { key: 'email', label: 'Email' },
                { key: 'type', label: 'Type' },
                { key: 'location', label: 'Lieu' },
                { key: 'service', label: 'Service' },
            ];
            // ajout conditionnel du nombre de personnes si fourni
            // add capacity for non-ceremony entries (ceremonies handle their own field)
            if (visitor.capacity && visitor.category !== 'ceremonie') {
                fields.push({ key: 'capacity', label: 'Nombre de personnes' });
            }
            fields = fields.concat([
                { key: 'requestNumber', label: 'Numéro de Demande' },
                { key: 'scans', label: 'Total Scans', custom: v => v.scans && v.scans.length ? v.scans.length : null },
                { key: 'startTime', label: 'Début', custom: v => v.startTime ? new Date(v.startTime).toLocaleString('fr-FR') : null },
                { key: 'endTime', label: 'Fin', custom: v => v.endTime ? new Date(v.endTime).toLocaleString('fr-FR') : null }
            ]);
            // Ajout dynamique : place attitrée ou code rapide
            if (visitor.category === 'ceremonie') {
                // Pour cérémonie : afficher la place attitrée et le nombre de personnes, PAS le code rapide
                // On retire le champ quickCode s'il existe
                fields = fields.filter(f => f.key !== 'quickCode');
                // Ajoute la place attitrée (propriété "place" dans le modèle) et le nombre de personnes à la bonne position
                fields.splice(6, 0, { key: 'place', label: 'Place Attitrée' });
                fields.splice(7, 0, { key: 'capacity', label: 'Nombre de Personnes' });
                // Ajoute les noms des mariés si présents
                if (visitor.brideName) {
                    fields.splice(8, 0, { key: 'brideName', label: 'Nom de la Mariée' });
                }
                if (visitor.groomName) {
                    const insertPos = visitor.brideName ? 9 : 8;
                    fields.splice(insertPos, 0, { key: 'groomName', label: 'Nom du Marié' });
                }
            } else if (visitor.quickCode) {
                fields.splice(6, 0, { key: 'quickCode', label: 'Code Rapide' });
            }
            fields.forEach(f => {
                let value = f.custom ? f.custom(visitor) : visitor[f.key];
                if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
                    infoGrid += `<div class="info-item"><span class="info-label">${f.label}</span> <span class="info-value">${value}</span></div>`;
                }
            });
            printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    padding: 0;
                    margin: 0;
                    background: linear-gradient(135deg, #e0f2fe 0%, #f3e8ff 50%, #e0f2fe 100%);
                    animation: gradientAnimation 8s infinite alternate;
                }
                @keyframes gradientAnimation {
                    0% { background: linear-gradient(135deg, #e0f2fe 0%, #f3e8ff 50%, #e0f2fe 100%); }
                    50% { background: linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 50%, #f3e8ff 100%); }
                    100% { background: linear-gradient(135deg, #e0f2fe 0%, #f3e8ff 50%, #e0f2fe 100%); }
                }
                .print-card {
                    max-width: 360px;
                    margin: 40px auto;
                    background: linear-gradient(135deg, #ffffff 0%, #fef3c7 100%);
                    border-radius: 32px;
                    box-shadow: 0 8px 48px rgba(56,189,248,0.18);
                    border: 6px solid transparent;
                    background-clip: padding-box;
                    position: relative;
                    padding: 28px 28px 20px 28px;
                    transition: box-shadow 0.3s, transform 0.3s;
                    animation: pulseBorder 4s infinite;
                }
                .print-card:hover {
                    box-shadow: 0 16px 60px rgba(56,189,248,0.4);
                    transform: scale(1.04);
                }
                @keyframes pulseBorder {
                    0%,100% { border-color: #38bdf8; }
                    50% { border-color: #a21caf; }
                }
                /* confetti animation */
                @keyframes floatUp {
                    0% { opacity: 0; transform: translateY(0) scale(0.8); }
                    50% { opacity: 1; }
                    100% { opacity: 0; transform: translateY(-80px) scale(1); }
                }
                .print-card::before, .print-card::after {
                    content: '🎉💐';
                    position: absolute;
                    font-size: 24px;
                    top: 10px;
                    animation: floatUp 2s infinite;
                    opacity: 0;
                }
                .print-card::after { left: 90%; animation-delay: 1s; }
                .print-icon {
                    position: absolute;
                    top: -22px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 42px;
                    color: #a21caf;
                    background: #fff;
                    border-radius: 50%;
                    box-shadow: 0 2px 12px rgba(162,28,175,0.16);
                    padding: 8px;
                    z-index: 2;
                }
                .print-header {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                    border-bottom: 2px solid #38bdf8;
                    padding-bottom: 12px;
                    margin-bottom: 16px;
                }
                .print-photo {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 3px solid #38bdf8;
                    background: #e0f2fe;
                    box-shadow: 0 2px 8px rgba(56,189,248,0.08);
                }
                .print-qr {
                    width: 80px;
                    height: 80px;
                    border-radius: 12px;
                    border: 3px solid #a21caf;
                    background: #f3e8ff;
                    box-shadow: 0 2px 8px rgba(162,28,175,0.08);
                }
                .print-title {
                    font-size: 24px;
                    font-weight: 900;
                    color: #a21caf;
                    margin: 0;
                    letter-spacing: 2px;
                    text-shadow: 0 1px 2px #fde68a;
                    font-family: 'Brush Script MT', cursive;
                    position: relative;
                }
                .print-title::after {
                    content: '— ✨ —';
                    display: block;
                    margin-top: 4px;
                    color: #fde68a;
                    font-size: 14px;
                }
                .print-info-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                .print-info-item {
                    background: linear-gradient(90deg, #fefce8 0%, #ffedd5 100%);
                    padding: 12px 14px;
                    border-radius: 12px;
                    border-left: 6px solid #a21caf;
                    font-size: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 2px 6px rgba(162,28,175,0.08);
                    transition: background 0.2s, transform 0.2s;
                }
                .print-info-item:hover {
                    background: linear-gradient(90deg, #bae6fd 0%, #e9d5ff 100%);
                    transform: translateX(4px);
                }
                .print-info-label::before {
                    content: '🎯 ';
                    margin-right: 4px;
                }
                .print-info-item:hover {
                    background: linear-gradient(90deg, #bae6fd 0%, #e9d5ff 100%);
                }
                .print-info-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    color: #a21caf;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                .print-info-value {
                    font-size: 15px;
                    color: #0f172a;
                    font-weight: 600;
                }
                .print-footer {
                    text-align: center;
                    color: #a21caf;
                    font-size: 13px;
                    margin-top: 16px;
                    border-top: 1px solid #e0f2fe;
                    padding-top: 8px;
                    letter-spacing: 0.5px;
                    background: linear-gradient(90deg, #e0f2fe 0%, #f3e8ff 100%);
                    border-radius: 0 0 16px 16px;
                    position: relative;
                }
                .decoration {
                    position: absolute;
                    font-size: 26px;
                    opacity: 0.7;
                }
                .decoration.top-left { top: -14px; left: -14px; }
                .decoration.top-right { top: -14px; right: -14px; transform: rotate(90deg); }
                .decoration.bottom-left { bottom: -14px; left: -14px; transform: rotate(270deg); }
                .decoration.bottom-right { bottom: -14px; right: -14px; transform: rotate(180deg); }
                .print-footer::before {
                    content: '✨ QR-Access | Nous contacter : +243 991 048 061 ✨';
                    display: block;
                    font-size: 11px;
                    color: #0f172a;
                    margin-bottom: 4px;
                }            </style></head><body>`);
            printWindow.document.write(`
                <div class="company-info" style="text-align:center;font-size:12px;color:#6b7280;margin-bottom:8px;">
                    QR-Access<br>+243 991 048 061
                </div>
                <div class="print-card">
                   
                    <div class="print-icon"></div>
                    <div class="print-header">
                        <img class="print-photo" src="${visitor.photo ? visitor.photo : ''}" alt="Photo">
                        <img class="print-qr" src="${qrApiUrl}" alt="QR Code">
                        <div style="flex:1;">
                            <div class="print-title">${visitor.name}</div>
                        </div>
                    </div>
                    <div class="print-info-grid">${infoGrid}</div>
                    <div class="print-footer">Fiche générée le ${new Date().toLocaleString('fr-FR')}</div>
                </div>
            </body></html>
            `);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 300);
        }

        // Imprimer la fiche de cérémonie
        function printCeremonyCard(ceremonyId) {
            const ceremony = visitors.find(v => v.id === ceremonyId);
            if (!ceremony) return;
            const printWindow = window.open('', '_blank');
            const title = `Fiche Cérémonie - ${ceremony.name}`;
            const photoHtml = ceremony.photo ? `<img src="${ceremony.photo}" alt="${ceremony.name}" style="width: 70px; height: 70px; border-radius: 8px; object-fit: cover; border: 2px solid #0ea5e9;">` : '<div style="width: 70px; height: 70px; background: #e5e7eb; border-radius: 8px; border: 2px solid #0ea5e9; display: flex; align-items: center; justify-content: center; font-size: 30px;">👤</div>';
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(ceremony.id)}`;
            let infoGrid = '';
            const fields = [
                { key: 'sexe', label: 'Nom:' },
                { key: 'phone', label: 'Téléphone:' },
                { key: 'email', label: 'Email:' },
                { key: 'type', label: 'Type:' },
                { key: 'location', label: 'Lieu:' },
                { key: 'place', label: 'Place Attitrée:' },
                { key: 'capacity', label: 'Nombre de Personnes:' },
                { key: 'brideName', label: 'Nom de la Mariée:' },
                { key: 'groomName', label: 'Nom du Marié:' },
                { key: 'scans', label: 'Total Scans', custom: v => v.scans && v.scans.length ? v.scans.length : null },
            ];
            fields.forEach(f => {
                let value = f.custom ? f.custom(ceremony) : ceremony[f.key];
                if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
                    infoGrid += `<div class="info-item"><span class="info-label">${f.label}</span> <span class="info-value">${value}</span></div>`;
                }
            });
            printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
                body{font-family: Arial, sans-serif; padding: 10px; background: white;}
                .card{max-width: 220px; min-width: 180px; margin: 0 auto; border: 1px solid #0ea5e9; border-radius: 10px; padding: 10px 10px 6px 10px; background: #f9fafb;}
                .header{display: flex; align-items: center; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #0ea5e9; padding-bottom: 6px;}
                .photo-section{flex-shrink: 0;}
                .qr-section{flex-shrink: 0;}
                .info-section{flex: 1;}
                h1{color: #0f172a; margin: 0 0 4px 0; font-size: 13px;}
                .info-grid{display: grid; grid-template-columns: 1fr; gap: 2px; margin-bottom: 2px;}
                .info-item{background: white; padding: 2px 4px; border-radius: 3px; border-left: 2px solid #0ea5e9; font-size: 9px;}
                .info-label{font-size: 8px; text-transform: uppercase; color: #0ea5e9; font-weight: 600; margin-bottom: 1px;}
                .info-value{font-size: 9px; color: #1f2937; font-weight: 600;}
                .timestamp{text-align: center; color: #6b7280; font-size: 8px; margin-top: 4px; border-top: 1px solid #e5e7eb; padding-top: 2px;}
            </style></head><body>`);
            printWindow.document.write(`<div class="card">
                <div class="company-info" style="text-align:center;font-size:11px;color:#6b7280;margin-bottom:6px;">
                    QR-Access | +243 991 048 061
                </div>
                <div class="header">
                    <div class="photo-section">${photoHtml}</div>
                    <div class="qr-section"><img src="${qrApiUrl}" alt="QR Code" width="70" height="70"></div>
                    <div class="info-section"><h1>${ceremony.name}</h1></div>
                </div>
                <div class="info-grid">${infoGrid}</div>
                <div class="timestamp">Fiche générée le ${new Date().toLocaleString('fr-FR')}</div>
            </div></body></html>`);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 300);
        }

        // ======================== GESTION MULTI-CÉRÉMONIES ========================
        // Les cérémonies, activeCeremonyId et nextCeremonyId sont initialisées au début du script
        
        // Vérifier et migrer les anciens guests sans quickCode
        ceremonies.forEach(ceremony => {
            ceremony.guests.forEach(guest => {
                if (!guest.quickCode) {
                    guest.quickCode = generateQuickCode(ceremony);
                }
            });
        });
        localStorage.setItem('ceremonies', JSON.stringify(ceremonies));

        function getFieldValue(id) {
            const field = document.getElementById(id);
            return field ? field.value : '';
        }

        function setFieldValue(id, value) {
            const field = document.getElementById(id);
            if (field) field.value = value;
        }

        function renderCeremonyTabs() {
            const container = document.getElementById('ceremonyTabsContainer');
            if (!container) return;
            container.innerHTML = '';
            
            ceremonies.forEach(ceremony => {
                const tab = document.createElement('div');
                tab.className = 'ceremony-tab' + (ceremony.id === activeCeremonyId ? ' active' : '');
                
                // Get ceremony name or default
                const ceremonyName = ceremony.data?.name || `Cérémonie ${ceremony.id}`;
                
                tab.innerHTML = `
                    <span class="ceremony-tab-label" onclick="switchCeremony(${ceremony.id})">
                        <i class="fa-solid fa-champagne-glasses"></i>
                        <span>${ceremonyName}</span>
                    </span>
                    <button class="details-btn" onclick="openCeremonyDetails(${ceremony.id}); event.stopPropagation();" title="Voir détails">
                        <i class="fa-solid fa-circle-info"></i>
                    </button>
                    ${ceremonies.length > 1 ? `<button class="close-btn" onclick="removeCeremony(${ceremony.id}); event.stopPropagation();" title="Supprimer"><i class="fa-solid fa-xmark"></i></button>` : ''}
                `;
                container.appendChild(tab);
            });
            
            const countEl = document.getElementById('ceremoniesCount');
            if (countEl) countEl.textContent = ceremonies.length + ' cérémonie' + (ceremonies.length > 1 ? 's' : '');
        }

        function addNewCeremony() {
            const newCeremony = { id: nextCeremonyId++, data: {}, guests: [] };
            ceremonies.push(newCeremony);
            localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
            const countEl = document.getElementById('ceremoniesCount');
            if (countEl) countEl.textContent = ceremonies.length + ' cérémonie' + (ceremonies.length > 1 ? 's' : '');
            switchCeremony(newCeremony.id);
            renderCeremonyTabs();
            debouncedRenderGuestsTable();
            updateCeremonyInfoDisplay();
            refreshAppViews();
        }

        function removeCeremony(id) {
            if (ceremonies.length > 1) {
                ceremonies = ceremonies.filter(c => c.id !== id);
                localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
                if (activeCeremonyId === id) {
                    activeCeremonyId = ceremonies[0].id;
                }
                switchCeremony(activeCeremonyId);
                renderCeremonyTabs();
                refreshAppViews();
            }
        }

        function switchCeremony(id) {
            // Sauvegarder les modifications de la cérémonie active avant de basculer
            if (activeCeremonyId !== null && activeCeremonyId !== undefined) {
                const currentCeremony = ceremonies.find(c => c.id === activeCeremonyId);
                if (currentCeremony) {
                    saveCeremonyData();
                }
            }

            activeCeremonyId = id;
            const ceremony = ceremonies.find(c => c.id === id);
            if (!ceremony) return;

            // Mettre à jour les champs du formulaire
            setFieldValue('cerName', ceremony.data.name || '');
            setFieldValue('ceremonyNameDisplay', ceremony.data.name || `Cérémonie ${id}`);
            setFieldValue('cerPhone', ceremony.data.phone || '');
            setFieldValue('cerSex', ceremony.data.sex || '');
            setFieldValue('cerHonorific', ceremony.data.honorific || '');
            setFieldValue('cerPlace', ceremony.data.place || '');
            setFieldValue('cerCapacity', ceremony.data.capacity || '1');
            setFieldValue('cerType', ceremony.data.type || '');
            setFieldValue('cerLieu', ceremony.data.location || '');
            setFieldValue('cerAddress', ceremony.data.address || '');
            setFieldValue('cerCommune', ceremony.data.commune || '');
            setFieldValue('cerContactEmail', ceremony.data.contactEmail || '');
            setFieldValue('cerContactPhone', ceremony.data.contactPhone || '');
            setFieldValue('cerDressCode', ceremony.data.dressCode || '');
            setFieldValue('cerFamily1', ceremony.data.family1 || '');
            setFieldValue('cerFamily2', ceremony.data.family2 || '');
            setFieldValue('cerReception', ceremony.data.reception || '');
            setFieldValue('cerStart', ceremony.data.startDateTime || '');
            setFieldValue('cerEnd', ceremony.data.endDateTime || '');
            setFieldValue('cerNotes', ceremony.data.notes || '');

            // Champs mariage
            setFieldValue('cerBrideName', ceremony.data.brideName || '');
            setFieldValue('cerGroomName', ceremony.data.groomName || '');
            setFieldValue('cerEglise', ceremony.data.church || '');
            setFieldValue('cerEgliseAdresse', ceremony.data.churchAddress || '');
            setFieldValue('cerPhotographe', ceremony.data.photographer || '');

            // Rendre les onglets
            renderCeremonyTabs();
            debouncedRenderGuestsTable();
            updateCeremonyInfoDisplay();
        }

        function saveCeremonyData() {
            const ceremony = ceremonies.find(c => c.id === activeCeremonyId);
            if (!ceremony) return;

            ceremony.data = {
                name: getFieldValue('cerName'),
                phone: getFieldValue('cerPhone'),
                sex: getFieldValue('cerSex'),
                honorific: getFieldValue('cerHonorific'),
                place: getFieldValue('cerPlace'),
                capacity: getFieldValue('cerCapacity') || '1',
                type: getFieldValue('cerType'),
                location: getFieldValue('cerLieu'),
                family1: getFieldValue('cerFamily1'),
                family2: getFieldValue('cerFamily2'),
                address: getFieldValue('cerAddress'),
                contactEmail: getFieldValue('cerContactEmail'),
                contactPhone: getFieldValue('cerContactPhone'),
                dressCode: getFieldValue('cerDressCode'),
                program: getFieldValue('cerProgram') || (ceremony.data.program || ''),
                startDateTime: getFieldValue('cerStart'),
                endDateTime: getFieldValue('cerEnd'),
                notes: getFieldValue('cerNotes') || (ceremony.data.notes || ''),
                brideName: getFieldValue('cerBrideName'),
                groomName: getFieldValue('cerGroomName'),
                church: getFieldValue('cerEglise'),
                churchAddress: getFieldValue('cerEgliseAdresse'),
                commune: getFieldValue('cerCommune'),
                photographer: getFieldValue('cerPhotographe'),
                reception: getFieldValue('cerReception') || ''
            };
            
            // Sauvegarder dans le localStorage
            localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
            
            // Auto-synchronize to managedCeremonies if ceremony has bride and groom names
            syncCeremonyToManagement(activeCeremonyId);
        }

        function syncCeremonyToManagement(ceremonyId) {
            const ceremony = ceremonies.find(c => c.id === ceremonyId);
            if (!ceremony) return;

            // Synchroniser toutes les cérémonies créées, pas seulement celles avec noms de mariés
            const existingIndex = managedCeremonies.findIndex(mc => mc.id === ceremony.id);
            if (existingIndex === -1) {
                // Add to managed ceremonies
                const managedCeremony = {
                    id: ceremony.id,
                    name: ceremony.data.name || ceremony.name,
                    data: ceremony.data,
                    guests: ceremony.guests || [],
                    supplies: {},
                    drinks: {},
                    gifts: []
                };
                managedCeremonies.push(managedCeremony);
                localStorage.setItem('managedCeremonies', JSON.stringify(managedCeremonies));
            } else {
                // Update existing managed ceremony with latest data
                managedCeremonies[existingIndex].data = ceremony.data;
                managedCeremonies[existingIndex].name = ceremony.data.name || ceremony.name;
                managedCeremonies[existingIndex].guests = ceremony.guests || [];
                localStorage.setItem('managedCeremonies', JSON.stringify(managedCeremonies));
            }
        }

        function syncAllCeremonies() {
            // Synchronize all ceremonies to managedCeremonies
            ceremonies.forEach(ceremony => {
                syncCeremonyToManagement(ceremony.id);
            });
        }


        // NOUVELLES FONCTIONS POUR AJOUTER DES INVITÉS

        function createNewGuest(event) {
            if (event) event.preventDefault();
            console.log('Création d\'un nouvel invité (mode complet)');
            
            try {
                // Récupérer les valeurs du formulaire
                const lastNameEl = document.getElementById('guestLastName');
                const firstNameEl = document.getElementById('guestFirstName');
                
                if (!lastNameEl || !firstNameEl) {
                    console.error('Les éléments de formulaire ne sont pas trouvés');
                    qrNotifyError('Formulaire incomplet', 'Les champs du formulaire invité sont introuvables.');
                    return;
                }
                
                const guestData = {
                    lastName: lastNameEl.value ? lastNameEl.value.trim() : '',
                    firstName: firstNameEl.value ? firstNameEl.value.trim() : '',
                    honorific: document.getElementById('guestHonorific')?.value || '',
                    sex: document.getElementById('guestSex')?.value || '',
                    phone: document.getElementById('guestPhone')?.value || '',
                    seat: document.getElementById('guestSeat')?.value || '',
                    ceremonyType: document.getElementById('guestCeremonyType')?.value || '',
                    count: parseInt(document.getElementById('guestCount')?.value) || 1,
                    notes: document.getElementById('guestNotes')?.value || '',
                    photo: null
                };
                
                console.log('Données du formulaire:', guestData);
                
                // Validation basique
                if (!guestData.lastName && !guestData.firstName) {
                    qrNotifyError('Champ requis', 'Veuillez saisir au moins un nom ou un prénom pour l\'invité.');
                    return;
                }
                
                // Récupérer la photo si elle existe
                const photoImg = document.getElementById('guestPhotoImg');
                if (photoImg && photoImg.src && photoImg.style.display !== 'none') {
                    guestData.photo = photoImg.src;
                }
                
                // Vérifier que ceremonies existe
                if (!ceremonies || !Array.isArray(ceremonies)) {
                    console.error('ceremonies non disponible');
                    qrNotifyError('Erreur', 'Les cérémonies ne sont pas chargées.');
                    return;
                }
                
                // Trouver la cérémonie active
                const ceremony = ceremonies.find(c => c.id === activeCeremonyId);
                if (!ceremony) {
                    console.error('Cérémonie active non trouvée. activeCeremonyId:', activeCeremonyId);
                    qrNotifyError('Cérémonie requise', 'Aucune cérémonie active. Sélectionnez ou créez une cérémonie d\'abord.');
                    return;
                }
                
                // Initialiser le tableau des invités si nécessaire
                if (!ceremony.guests) {
                    ceremony.guests = [];
                }
                
                // Créer le nouvel invité
                const newGuest = {
                    id: Date.now() + Math.random(), // ID unique
                    ...guestData,
                    quickCode: generateQuickCode(ceremony),
                    scans: [],
                    createdAt: new Date().toISOString()
                };
                
                console.log('Nouvel invité:', newGuest);
                
                // Ajouter à la cérémonie
                ceremony.guests.push(newGuest);
                console.log('Invité ajouté:', newGuest);
                console.log('Total invités dans la cérémonie:', ceremony.guests.length);
                
                // Sauvegarder
                localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
                console.log('Données sauvegardées dans localStorage');
                
                // Synchronize ceremony to managed ceremonies if it has bride and groom names
                syncCeremonyToManagement(activeCeremonyId);
                
                // Mettre à jour l'affichageS
                debouncedRenderGuestsTable();
                
                qrPersist({
                    successTitle: 'Invité enregistré',
                    successMessage: 'L\'invité a été ajouté et sauvegardé dans la base de données.',
                    afterSuccess: resetGuestFullForm,
                });

            } catch (error) {
                console.error('Erreur dans createNewGuest:', error);
                qrNotifyError('Échec de l\'enregistrement', error.message);
            }
        }

        async function addGuestQuick() {
            try {
                const fullName = document.getElementById('guestFullNameSimple')?.value.trim() || '';
                const postName = document.getElementById('guestPostNameSimple')?.value.trim() || '';
                const seat = document.getElementById('guestSeatSimple')?.value.trim() || '';
                const phone = document.getElementById('guestPhoneSimple')?.value.trim() || '';
                const honorific = document.getElementById('guestHonorificSimple')?.value.trim() || '';
                const typeValue = document.getElementById('guestCountSimple')?.value || '1';
                let count = 1;
                let guestType = 'singleton';
                if (typeValue === '2') {
                    count = 2;
                    guestType = 'couple';
                } else if (typeValue === 'delegation') {
                    count = 1;
                    guestType = 'delegation';
                }

                if (!fullName) {
                    qrNotifyError('Champ requis', 'Veuillez saisir le nom complet de l\'invité.');
                    return;
                }

                const nameParts = fullName.split(' ').filter(part => part.trim() !== '');
                const lastName = nameParts.length > 1 ? nameParts.pop() : nameParts[0] || '';
                const firstName = nameParts.join(' ') || '';

                const ceremony = ceremonies.find(c => c.id === activeCeremonyId);
                if (!ceremony) {
                    qrNotifyError('Cérémonie requise', 'Aucune cérémonie active trouvée.');
                    return;
                }

                if (!ceremony.guests) {
                    ceremony.guests = [];
                }

                if (window.currentEditingGuestId) {
                    const existingGuest = ceremony.guests.find(g => g.id === window.currentEditingGuestId);
                    if (existingGuest) {
                        existingGuest.lastName = lastName;
                        existingGuest.firstName = firstName;
                        existingGuest.postName = postName;
                        existingGuest.seat = seat;
                        existingGuest.phone = phone;
                        existingGuest.honorific = honorific;
                        existingGuest.count = count;
                        existingGuest.guestType = guestType;
                        localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
                        syncCeremonyToManagement(activeCeremonyId);
                        debouncedRenderGuestsTable();
                        qrPersist({
                            successTitle: 'Invité mis à jour',
                            successMessage: 'Les modifications ont été sauvegardées dans la base de données.',
                            afterSuccess: resetGuestQuickForm,
                        });
                        return;
                    }
                }

                const newGuest = {
                    id: Date.now() + Math.random(),
                    lastName,
                    firstName,
                    postName,
                    phone,
                    seat,
                    count,
                    honorific,
                    guestType,
                    sex: '',
                    ceremonyType: '',
                    notes: '',
                    quickCode: generateQuickCode(ceremony),
                    scans: [],
                    createdAt: new Date().toISOString()
                };

                // Tenter d'enregistrer l'invité côté serveur, si disponible
                try {
                    const apiUrl = window.GATEFLOW_API_URL || 'http://localhost:3000/inviter';
                    const resp = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ceremonyId: ceremony.id,
                            firstName: newGuest.firstName,
                            lastName: newGuest.lastName,
                            phone: newGuest.phone,
                            seat: newGuest.seat,
                            count: newGuest.count,
                            quickCode: newGuest.quickCode,
                            createdAt: newGuest.createdAt,
                            notes: newGuest.notes
                        }),
                        keepalive: false
                    });

                    if (resp && resp.ok) {
                        const json = await resp.json();
                        // Si le serveur renvoie un identifiant DB, on l'utilise
                        if (json && (json.id || json.insertId)) {
                            newGuest.id = json.id || json.insertId;
                        }
                    } else {
                        console.warn('API invité a répondu avec erreur, sauvegarde locale utilisée');
                    }
                } catch (err) {
                    console.warn('Impossible de joindre l\'API invité, sauvegarde locale utilisée', err);
                }

                // Toujours ajouter localement pour affichage hors-ligne / fallback
                ceremony.guests.push(newGuest);
                localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
                syncCeremonyToManagement(activeCeremonyId);
                debouncedRenderGuestsTable();
                qrPersist({
                    successTitle: 'Invité enregistré',
                    successMessage: 'L\'invité a été ajouté et sauvegardé dans la base de données.',
                    afterSuccess: resetGuestQuickForm,
                });
            } catch (error) {
                console.error('Erreur dans addGuestQuick:', error);
                qrNotifyError('Échec de l\'enregistrement', error.message);
            }
        }

        function resetGuestQuickForm() {
            const fields = ['guestFullNameSimple', 'guestPostNameSimple', 'guestSeatSimple', 'guestPhoneSimple', 'guestHonorificSimple', 'guestCountSimple'];
            fields.forEach(id => {
                const field = document.getElementById(id);
                if (field) {
                    if (id === 'guestCountSimple') {
                        field.value = '1';
                    } else {
                        field.value = '';
                    }
                }
            });
            window.currentEditingGuestId = null;
        }

        function resetGuestFullForm() {
            ['guestLastName', 'guestFirstName', 'guestHonorific', 'guestSex', 'guestPhone', 'guestSeat', 'guestCeremonyType', 'guestNotes'].forEach(id => {
                const field = document.getElementById(id);
                if (field) field.value = '';
            });
            const countInput = document.getElementById('guestCount');
            if (countInput) countInput.value = '1';
            const photoImg = document.getElementById('guestPhotoImg');
            if (photoImg) {
                photoImg.src = '';
                photoImg.style.display = 'none';
            }
        }

        function resetCeremonyCreateForm() {
            const form = document.getElementById('createCeremonyForm');
            if (form) form.reset();
            const capacity = document.getElementById('cerCapacity');
            if (capacity) capacity.value = '100';
            const previewCer = document.getElementById('photoPreviewCer');
            if (previewCer) {
                previewCer.src = '';
                previewCer.style.display = 'none';
            }
            currentPhotoCanvasCer = null;
            const evenementsList = document.getElementById('evenementsList');
            if (evenementsList) evenementsList.innerHTML = '';
        }

        function editGuest(guestId) {
            try {
                const ceremony = ceremonies.find(c => c.id === activeCeremonyId);
                if (!ceremony) return;
                const guest = ceremony.guests.find(g => g.id === guestId);
                if (!guest) return;

                const fullName = [guest.firstName, guest.lastName].filter(Boolean).join(' ').trim();
                const fullNameInput = document.getElementById('guestFullNameSimple');
                if (fullNameInput) {
                    fullNameInput.value = fullName;
                    fullNameInput.focus();
                }

                const postNameInput = document.getElementById('guestPostNameSimple');
                if (postNameInput) postNameInput.value = guest.postName || '';

                const seatInput = document.getElementById('guestSeatSimple');
                if (seatInput) seatInput.value = guest.seat || '';

                const phoneInput = document.getElementById('guestPhoneSimple');
                if (phoneInput) phoneInput.value = guest.phone || '';

                const honorificInput = document.getElementById('guestHonorificSimple');
                if (honorificInput) honorificInput.value = guest.honorific || '';

                const countInput = document.getElementById('guestCountSimple');
                if (countInput) {
                    if (guest.guestType === 'couple' || guest.count === 2) {
                        countInput.value = '2';
                    } else if (guest.guestType === 'delegation') {
                        countInput.value = 'delegation';
                    } else {
                        countInput.value = '1';
                    }
                }

                window.currentEditingGuestId = guestId;
                alert('Vous pouvez modifier l\'invité dans le formulaire rapide puis cliquer sur Ajouter.');
            } catch (error) {
                console.error('Erreur dans editGuest:', error);
            }
        }

        // Générer un code rapide unique de 5 chiffres
        function generateQuickCode(ceremony) {
            let quickCode;
            let exists = true;
            while (exists) {
                quickCode = Math.floor(10000 + Math.random() * 90000).toString();
                exists = ceremony.guests.some(g => g.quickCode === quickCode);
            }
            return quickCode;
        }

        function capturePhotoFromCamera() {
            const input = document.getElementById('guestPhoto');
            if (input) {
                // Set input to capture from camera
                input.setAttribute('capture', 'environment');
                input.click();
            }
        }

        function removeGuest(guestId) {
            const ceremony = ceremonies.find(c => c.id === activeCeremonyId);
            if (!ceremony) return;
            if (confirm('Êtes-vous sûr de vouloir supprimer cet invité?')) {
                ceremony.guests = ceremony.guests.filter(g => g.id !== guestId);
                localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
                
                // Synchronize changes to managed ceremonies
                syncCeremonyToManagement(activeCeremonyId);
                
                debouncedRenderGuestsTable();
            }
        }

        function updateGuest(guestId, field, value) {
            const ceremony = ceremonies.find(c => c.id === activeCeremonyId);
            if (!ceremony) return;
            const guest = ceremony.guests.find(g => g.id === guestId);
            if (guest) {
                guest[field] = value;
                localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
                
                // Synchronize changes to managed ceremonies
                syncCeremonyToManagement(activeCeremonyId);
            }
        }

        let guestsSectionExpanded = true;

        function toggleGuestsSection() {
            guestsSectionExpanded = !guestsSectionExpanded;
            const container = document.getElementById('guestsTableContainer');
            const btn = document.getElementById('toggleGuestsSectionBtn');
            if (container) {
                container.style.display = guestsSectionExpanded ? 'block' : 'none';
            }
            if (btn) {
                const icon = btn.querySelector('i');
                const label = btn.querySelector('span');
                if (guestsSectionExpanded) {
                    if (icon) icon.className = 'fa-solid fa-chevron-up';
                    if (label) label.textContent = 'Plier la liste';
                } else {
                    if (icon) icon.className = 'fa-solid fa-chevron-down';
                    if (label) label.textContent = 'Déplier la liste';
                }
            }
        }

        function renderGuestsTable() {
            if (typeof reloadAppDataFromStorage === 'function') reloadAppDataFromStorage();
            const ceremony = ceremonies.find(c => String(c.id) === String(activeCeremonyId));
            if (!ceremony) return;

            // Update ceremony info display
            updateCeremonyInfoDisplay();

            let guestsHtml = document.getElementById('guestsTableContainer');
            if (!guestsHtml) {
                const section = document.querySelector('#guestsSection');
                if (!section) return;
                guestsHtml = document.createElement('div');
                guestsHtml.id = 'guestsTableContainer';
                section.appendChild(guestsHtml);
            }

            if (ceremony.guests.length === 0) {
                guestsHtml.innerHTML = '<div class="empty-state"><i class="fa-solid fa-users-slash"></i><p>Aucun invité pour cette cérémonie</p><p style="margin-top:8px;font-size:13px;">Utilisez le formulaire ci-dessus pour ajouter des invités</p></div>';
                return;
            }

            let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(500px, 1fr)); gap: 16px;">';

            ceremony.guests.forEach((guest, idx) => {
                const fullName = (guest.lastName || '') + ' ' + (guest.firstName || '');
                const qrId = `qr-${guest.id}`;
                const scanCount = (guest.scans && guest.scans.length) || 0;
                
                // Déterminer la couleur de la carte
                let cardStyle = 'background: white; border-color: #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.05);';
                if (scanCount === 1) {
                    cardStyle = 'background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-color: #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);';
                } else if (scanCount >= 2) {
                    cardStyle = 'background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-color: #ef4444; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);';
                }
                
                const doublonLabel = scanCount >= 2 ? `<div style="position: absolute; top: -12px; left: 12px; background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; z-index: 10;">🔴 DOUBLON</div>` : '';
                
                html += `
                    <div style="position: relative; border: 2px solid #e5e7eb; border-radius: 12px; padding: 16px; transition: all 0.3s ease; display: flex; gap: 16px; align-items: flex-start; ${cardStyle}">
                        ${doublonLabel}
                        
                        <!-- Section Infos -->
                        <div style="flex: 1; min-width: 0;">
                            <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid #f0f0f0;">
                                <p class="guest-name-white" style="margin: 0 0 4px 0; font-weight: 700; font-size: 16px; color: #1f2937;">#${idx + 1} ${fullName}</p>
                                <p style="margin: 0; font-size: 13px; color: #0ea5e9; font-weight: 600;">${guest.honorific || 'N/A'}</p>
                            </div>
                            
                            <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 13px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px;">
                                    <div>
                                        <p style="margin: 0 0 4px 0; color: #64748b; font-weight: 600;">📱 Tél:</p>
                                        <p style="margin: 0; color: #1f2937; font-weight: 500;">${guest.phone || '-'}</p>
                                    </div>
                                    <div>
                                        <p style="margin: 0 0 4px 0; color: #64748b; font-weight: 600;">📍 Place:</p>
                                        <p style="margin: 0; color: #1f2937; font-weight: 500;">${guest.seat || '-'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p style="margin: 0 0 4px 0; color: #64748b; font-weight: 600;">👥 Personnes:</p>
                                    <p style="margin: 0; background: #fff3cd; padding: 3px 8px; border-radius: 4px; display: inline-block; color: #856404; font-weight: 600;">${guest.count || 1}</p>
                                </div>
                            </div>
                            
                            ${guest.notes ? `<div style="background: #fef3c7; padding: 10px; border-radius: 6px; font-size: 12px; color: #92400e; border-left: 3px solid #f59e0b; margin-bottom: 8px;"><strong>📝</strong> ${guest.notes}</div>` : ''}
                            
                            <div style="display: flex; gap: 8px;">
                                <button class="btn-edit-guest" onclick="editGuest(${guest.id})" title="Modifier" style="flex: 1;">✏️ Modifier</button>
                                <button class="btn-delete-guest" onclick="removeGuest(${guest.id})" title="Supprimer" style="flex: 1;">🗑️ Supprimer</button>
                            </div>
                        </div>

                        <!-- Section QR Code et Code Rapide -->
                        <div style="flex-shrink: 0; width: 160px; display: flex; flex-direction: column; align-items: center; gap: 10px;" id="guestCardStatus-${guest.id}">
                            <div id="${qrId}" style="width: 120px; height: 120px; background: white; border: 2px solid #0f172a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #64748b;"></div>
                            
                            <!-- Code Rapide avec bouton copier -->
                            <div style="width: 100%; background: #f0f4ff; border: 2px solid #818cf8; border-radius: 6px; padding: 8px; text-align: center;">
                                <p style="margin: 0; font-size: 11px; color: #6366f1; font-weight: 600;">Code Rapide</p>
                                <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 4px;">
                                    <p style="margin: 0; font-size: 16px; font-weight: 900; color: #3730a3; letter-spacing: 3px; cursor: pointer; flex: 1;" onclick="verifyGuestQuickCode('${guest.quickCode}')" title="Cliquer pour vérifier ce code rapide">${guest.quickCode}</p>
                                    <button style="background: #818cf8; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s ease;" onclick="copyToClipboard('${guest.quickCode}', this)" title="Copier le code">📋</button>
                                </div>
                            </div>
                            
                            <button class="btn" style="background: #10b981; color: white; padding: 6px 10px; border-radius: 4px; border: none; cursor: pointer; font-size: 11px; font-weight: 600; width: 100%;" onclick="downloadGuestQRCard(${guest.id})" title="Télécharger">📥 DL</button>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
            guestsHtml.innerHTML = html;
            if (!guestsSectionExpanded) {
                document.getElementById('guestsTableContainer').style.display = 'none';
            }
            
            // Generate QR codes after DOM update
            ceremony.guests.forEach((guest) => {
                generateGuestQRInline(guest.id);
            });
        }

        function addCeremonyToManagement() {
            const ceremony = ceremonies.find(c => c.id === activeCeremonyId);
            if (!ceremony) {
                alert('Aucune cérémonie sélectionnée.');
                return;
            }

            // Save ceremony data first
            saveCeremonyData();

            // Check if ceremony has bride and groom names
            const brideName = ceremony.data?.brideName?.trim();
            const groomName = ceremony.data?.groomName?.trim();
            
            if (!brideName || !groomName) {
                alert('⚠️ Veuillez d\'abord remplir les noms de la mariée et du marié.');
                return;
            }

            // Synchronize ceremony to management
            syncCeremonyToManagement(ceremony.id);

            // Check if ceremony is now in management
            const isManaged = managedCeremonies.findIndex(mc => mc.id === ceremony.id) !== -1;
            if (isManaged) {
                // Update the ceremony selector in management tab
                loadCeremonySelector();

                // Switch to management tab and select the new ceremony
                switchTab('gestionceremonies');
                setTimeout(() => {
                    document.getElementById('ceremonySelector').value = ceremony.id;
                    loadCeremonySupplies();
                }, 300);

                alert('✅ Cérémonie ajoutée à la gestion avec succès!');
            }
        }

        function updateCeremonyInfoDisplay() {
            const ceremony = ceremonies.find(c => c.id === activeCeremonyId);
            if (!ceremony) return;

            const data = ceremony.data || {};
            
            // Update basic info - with null checks
            const infoCerType = document.getElementById('infoCerType');
            if (infoCerType) infoCerType.textContent = data.type || '-';
            
            const infoCerLocation = document.getElementById('infoCerLocation');
            if (infoCerLocation) infoCerLocation.textContent = data.location || '-';
            
            // Update date/time
            if (data.startDateTime) {
                const dt = new Date(data.startDateTime);
                const timeStr = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                const dateStr = dt.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                const infoCerDateTime = document.getElementById('infoCerDateTime');
                if (infoCerDateTime) infoCerDateTime.textContent = `${dateStr} à ${timeStr}`;
            } else {
                const infoCerDateTime = document.getElementById('infoCerDateTime');
                if (infoCerDateTime) infoCerDateTime.textContent = '-';
            }

            // Update church info (Église) - use current form value for real-time updates
            const churchValue = document.getElementById('cerEglise')?.value?.trim() || data.church;
            const infoCerChurchCard = document.getElementById('infoCerChurchCard');
            if (infoCerChurchCard) {
                if (churchValue) {
                    infoCerChurchCard.style.display = 'block';
                    const infoCerEglise = document.getElementById('infoCerEglise');
                    if (infoCerEglise) infoCerEglise.textContent = churchValue;
                } else {
                    infoCerChurchCard.style.display = 'none';
                }
            }

            // Update commune info - use current form value for real-time updates
            const communeValue = document.getElementById('cerCommune')?.value?.trim() || data.commune;
            const infoCerCommuneCard = document.getElementById('infoCerCommuneCard');
            if (infoCerCommuneCard) {
                if (communeValue) {
                    infoCerCommuneCard.style.display = 'block';
                    const infoCerCommune = document.getElementById('infoCerCommune');
                    if (infoCerCommune) infoCerCommune.textContent = communeValue;
                } else {
                    infoCerCommuneCard.style.display = 'none';
                }
            }

            // Update photography info (Prise de Vue) - use current form value for real-time updates
            const photoValue = document.getElementById('cerPhotographe')?.value?.trim() || data.photographer;
            const infoCerPhotoCard = document.getElementById('infoCerPhotoCard');
            if (infoCerPhotoCard) {
                if (photoValue) {
                    infoCerPhotoCard.style.display = 'block';
                    const infoCerPhotographe = document.getElementById('infoCerPhotographe');
                    if (infoCerPhotographe) infoCerPhotographe.textContent = photoValue;
                } else {
                    infoCerPhotoCard.style.display = 'none';
                }
            }

            // Update reception info - use current form value for real-time updates
            const receptionValue = document.getElementById('cerReception')?.value?.trim() || data.reception;
            const infoCerReceptionCard = document.getElementById('infoCerReceptionCard');
            if (infoCerReceptionCard) {
                if (receptionValue) {
                    infoCerReceptionCard.style.display = 'block';
                    const infoCerReception = document.getElementById('infoCerReception');
                    if (infoCerReception) infoCerReception.textContent = receptionValue;
                } else {
                    infoCerReceptionCard.style.display = 'none';
                }
            }

            // Update bride and groom names card - sync with form values
            const brideValue = document.getElementById('cerBrideName')?.value?.trim() || data.brideName;
            const groomValue = document.getElementById('cerGroomName')?.value?.trim() || data.groomName;
            const infoCerBrideGroomCard = document.getElementById('infoCerBrideGroomCard');
            if (infoCerBrideGroomCard) {
                if ((brideValue || groomValue) && data.type === 'Mariage') {
                    infoCerBrideGroomCard.style.display = 'block';
                    const infoCerBrideGroom = document.getElementById('infoCerBrideGroom');
                    if (infoCerBrideGroom) {
                        const brideText = brideValue || '-';
                        const groomText = groomValue || '-';
                        infoCerBrideGroom.textContent = `${brideText} & ${groomText}`;
                    }
                } else {
                    infoCerBrideGroomCard.style.display = 'none';
                }
            }

            // Still display program
            const infoCerProgram = document.getElementById('infoCerProgram');
            if (infoCerProgram) infoCerProgram.textContent = data.program || '-';

            // Handle families (for Mariage/Dote)
            if (data.family1) {
                const ceremonyFamiliesInfo = document.getElementById('ceremonyFamiliesInfo');
                if (ceremonyFamiliesInfo) {
                    ceremonyFamiliesInfo.style.display = 'block';
                    const infoCerFamily1 = document.getElementById('infoCerFamily1');
                    if (infoCerFamily1) infoCerFamily1.textContent = data.family1;
                }
                if (data.family2) {
                    const infoCerFamily2Container = document.getElementById('infoCerFamily2Container');
                    if (infoCerFamily2Container) {
                        infoCerFamily2Container.style.display = 'block';
                        const infoCerFamily2 = document.getElementById('infoCerFamily2');
                        if (infoCerFamily2) infoCerFamily2.textContent = data.family2;
                    }
                } else {
                    const infoCerFamily2Container = document.getElementById('infoCerFamily2Container');
                    if (infoCerFamily2Container) infoCerFamily2Container.style.display = 'none';
                }
            } else {
                const ceremonyFamiliesInfo = document.getElementById('ceremonyFamiliesInfo');
                if (ceremonyFamiliesInfo) ceremonyFamiliesInfo.style.display = 'none';
            }

            // Handle wedding details
            if (data.type === 'Mariage') {
                const ceremonyWeddingInfo = document.getElementById('ceremonyWeddingInfo');
                if (ceremonyWeddingInfo) {
                    ceremonyWeddingInfo.style.display = 'block';
                    const infoCerBrideName = document.getElementById('infoCerBrideName');
                    if (infoCerBrideName) infoCerBrideName.textContent = data.brideName || '-';
                    const infoCerGroomName = document.getElementById('infoCerGroomName');
                    if (infoCerGroomName) infoCerGroomName.textContent = data.groomName || '-';
                }
            } else {
                const ceremonyWeddingInfo = document.getElementById('ceremonyWeddingInfo');
                if (ceremonyWeddingInfo) ceremonyWeddingInfo.style.display = 'none';
            }

            // Update guest count stats
            const totalGuests = ceremony.guests.length;
            const totalPersons = ceremony.guests.reduce((sum, g) => sum + (parseInt(g.count) || 1), 0);
            document.getElementById('totalGuestCount').textContent = totalGuests;
            document.getElementById('totalPersonCount').textContent = totalPersons;
        }

        function showCeremonyForm() {
            if (activeCeremonyId) {
                const ceremony = ceremonies.find(c => c.id === activeCeremonyId);
                if (ceremony) {
                    switchCeremony(activeCeremonyId);
                }
            }
            const formContainer = document.getElementById('ceremonyFormContainer');
            formContainer.style.display = 'block';
        }

        function hideCeremonyForm() {
            const formContainer = document.getElementById('ceremonyFormContainer');
            formContainer.style.display = 'none';
        }

        // Initialiser les onglets au chargement
        // ======================== GESTION DES DÉTAILS DE CÉRÉMONIE ========================
        
        function openCeremonyDetails(ceremonyId) {
            loadCeremonyDetailsInModal(ceremonyId);
            document.getElementById('ceremonyDetailsModal').style.display = 'flex';
        }

        function closeCeremonyDetailsModal() {
            document.getElementById('ceremonyDetailsModal').style.display = 'none';
        }

        function loadCeremonyDetailsInModal(ceremonyId) {
            const ceremony = ceremonies.find(c => c.id === ceremonyId);
            if (!ceremony) return;

            const data = ceremony.data || {};

            // Set ceremony name
            document.getElementById('ceremonyNameInput').value = data.name || `Cérémonie ${ceremonyId}`;

            // Set basic info
            document.getElementById('detailType').textContent = data.type || '-';
            document.getElementById('detailLocation').textContent = data.location || '-';
            document.getElementById('detailContactPerson').textContent = data.honorific ? `${data.honorific} ${data.name || ''}`.trim() : (data.name || '-');

            // Format date
            if (data.startDateTime) {
                const dt = new Date(data.startDateTime);
                document.getElementById('detailDate').textContent = dt.toLocaleString('fr-FR');
            } else {
                document.getElementById('detailDate').textContent = '-';
            }

            // Handle families (for Mariage/Dote)
            if (data.family1) {
                document.getElementById('detailFamiliesSection').style.display = 'block';
                document.getElementById('detailFamily1').textContent = data.family1;
                if (data.family2) {
                    document.getElementById('detailFamily2Container').style.display = 'block';
                    document.getElementById('detailFamily2').textContent = data.family2;
                } else {
                    document.getElementById('detailFamily2Container').style.display = 'none';
                }
            } else {
                document.getElementById('detailFamiliesSection').style.display = 'none';
            }

            // Handle wedding details
            if (data.type === 'Mariage') {
                document.getElementById('detailWeddingSection').style.display = 'block';
                document.getElementById('detailBrideName').textContent = data.brideName || '-';
                document.getElementById('detailGroomName').textContent = data.groomName || '-';
            } else {
                document.getElementById('detailWeddingSection').style.display = 'none';
            }

            // Set program
            document.getElementById('detailProgram').textContent = data.program || '-';

            // Load guests
            loadGuestsInDetailsModal(ceremonyId);

            // Store current ceremony ID for modal operations
            window.currentDetailsCeremonyId = ceremonyId;
        }

        function loadGuestsInDetailsModal(ceremonyId) {
            const ceremony = ceremonies.find(c => c.id === ceremonyId);
            if (!ceremony) return;

            const container = document.getElementById('detailGuestsContainer');
            const toggleBtn = document.getElementById('toggleGuestListBtn');
            document.getElementById('guestCount').textContent = ceremony.guests.length;

            if (window.lastDetailsCeremonyId !== ceremonyId) {
                window.detailGuestsListExpanded = false;
                window.lastDetailsCeremonyId = ceremonyId;
            }

            const expanded = !!window.detailGuestsListExpanded;
            const totalGuests = ceremony.guests.length;
            const showGuests = expanded ? ceremony.guests : ceremony.guests.slice(-3);

            if (totalGuests > 3) {
                toggleBtn.style.display = 'inline-flex';
                toggleBtn.textContent = expanded ? 'Replier' : `Déplier (${totalGuests - 3} caché${totalGuests - 3 > 1 ? 's' : ''})`;
            } else {
                toggleBtn.style.display = 'none';
            }

            if (totalGuests === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 30px; color: #64748b;">Aucun invité</div>';
                return;
            }

            let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';

            if (!expanded && totalGuests > 3) {
                html += `<div style="padding: 12px 16px; border-radius: 8px; background: #eef2ff; color: #1d4ed8; font-size: 13px; border: 1px solid #bfdbfe;">
                            Derniers 3 invités enregistrés. Appuyez sur <strong>Déplier</strong> pour voir le reste.
                         </div>`;
            }

            showGuests.forEach(guest => {
                const fullName = `${guest.lastName || ''} ${guest.firstName || ''}`.trim();
                html += `
                    <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid var(--primary); display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <p class="detail-guest-name" style="margin: 0 0 4px 0; font-weight: 600; color: #1f2937;">${fullName}</p>
                            <p style="margin: 0; font-size: 12px; color: #64748b;">
                                ${guest.honorific || ''} • 📍 ${guest.seat || '-'} • 👥 ${guest.count || 1} pers.
                            </p>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">📞 ${guest.phone || '-'}</p>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <button class="btn" style="background: #10b981; color: white; padding: 6px 10px; border-radius: 4px; border: none; cursor: pointer; font-size: 12px;" onclick="generateGuestQRCode(${guest.id})" title="Générer QR">🔲 QR</button>
                            <button class="btn-edit-guest" onclick="editGuest(${guest.id})" title="Modifier">✏️</button>
                            <button class="btn-delete-guest" onclick="removeGuest(${guest.id})" title="Supprimer">🗑️</button>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
            container.innerHTML = html;
        }

        function toggleGuestList() {
            window.detailGuestsListExpanded = !window.detailGuestsListExpanded;
            if (window.lastDetailsCeremonyId) {
                loadGuestsInDetailsModal(window.lastDetailsCeremonyId);
            }
        }

        function updateCeremonyName() {
            const newName = document.getElementById('ceremonyNameInput').value.trim();
            if (!newName) {
                alert('Le nom de la cérémonie ne peut pas être vide');
                return;
            }

            const ceremony = ceremonies.find(c => c.id === window.currentDetailsCeremonyId);
            if (!ceremony) return;

            ceremony.data.name = newName;
            saveCeremonyData();
            renderCeremonyTabs();

            // Update title
            document.getElementById('ceremonyDetailsTitle').textContent = `Détails - ${newName}`;
            alert('✓ Nom de la cérémonie mis à jour');
        }

        function openAddGuestFromDetails() {
            resetGuestQuickForm();
            document.getElementById('guestFullNameSimple')?.focus();
            currentEditingGuestId = null;
        }

        function downloadCeremonyDetails() {
            const ceremony = ceremonies.find(c => c.id === window.currentDetailsCeremonyId);
            if (!ceremony) return;

            const data = ceremony.data;
            const guests = ceremony.guests;

            let content = `DÉTAILS DE LA CÉRÉMONIE\n`;
            content += `${'='.repeat(60)}\n\n`;
            content += `Nom: ${data.name || 'Sans titre'}\n`;
            content += `Type: ${data.type || '-'}\n`;
            content += `Lieu: ${data.location || '-'}\n`;
            content += `Date: ${data.startDateTime || '-'}\n`;
            content += `Responsable: ${data.honorific || ''} ${data.name || ''}\n`;
            content += `Programme:\n${data.program || '-'}\n\n`;

            content += `INVITÉS (${guests.length})\n`;
            content += `${'-'.repeat(60)}\n`;

            guests.forEach((guest, idx) => {
                content += `\n${idx + 1}. ${guest.lastName} ${guest.firstName}\n`;
                content += `   Titre: ${guest.honorific || '-'}\n`;
                content += `   Téléphone: ${guest.phone || '-'}\n`;
                content += `   Place: ${guest.seat || '-'}\n`;
                content += `   Personnes: ${guest.count || 1}\n`;
                if (guest.notes) content += `   Notes: ${guest.notes}\n`;
            });

            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
            element.setAttribute('download', `Ceremonie_${window.currentDetailsCeremonyId}_${new Date().getTime()}.txt`);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }

        // ======================== GESTION DES QR CODES INVITÉS ========================

        function renderQRIntoElement(container, text, size, options) {
            if (!container || !text) return false;
            size = size || 120;
            options = options || {};
            container.innerHTML = '';

            const correctLevel = options.correctLevel === 'H'
                ? (typeof QRCode !== 'undefined' ? QRCode.CorrectLevel.H : undefined)
                : (options.correctLevel === 'L' && typeof QRCode !== 'undefined' ? QRCode.CorrectLevel.L : (typeof QRCode !== 'undefined' ? QRCode.CorrectLevel.M : undefined));

            try {
                if (typeof QRCode !== 'undefined') {
                    new QRCode(container, {
                        text: String(text),
                        width: size,
                        height: size,
                        colorDark: options.colorDark || '#0f172a',
                        colorLight: options.colorLight || '#ffffff',
                        correctLevel: correctLevel
                    });
                    return true;
                }
            } catch (error) {
                console.warn('QRCode library error:', error);
            }

            const img = document.createElement('img');
            img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(String(text));
            img.alt = 'QR Code';
            img.width = size;
            img.height = size;
            img.style.display = 'block';
            img.style.maxWidth = '100%';
            container.appendChild(img);
            return true;
        }

        function buildGuestQRPayload(ceremony, guest) {
            if (!guest.quickCode) {
                guest.quickCode = String(Math.floor(10000 + Math.random() * 90000));
                localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
            }
            return 'QRA:' + ceremony.id + ':' + guest.id + ':' + guest.quickCode;
        }

        function renderGuestQRIntoElement(container, ceremony, guest, size) {
            if (!container || !ceremony || !guest) return false;
            size = size || 120;
            const payload = buildGuestQRPayload(ceremony, guest);
            container.innerHTML = '';
            container.classList.add('guest-qr-branded');

            const frame = document.createElement('div');
            frame.className = 'guest-qr-frame';

            const qrInner = document.createElement('div');
            qrInner.className = 'guest-qr-canvas';

            const label = document.createElement('div');
            label.className = 'guest-qr-code-label';
            label.textContent = guest.quickCode || '';

            frame.appendChild(qrInner);
            frame.appendChild(label);
            container.appendChild(frame);

            return renderQRIntoElement(qrInner, payload, size, {
                correctLevel: 'H',
                colorDark: '#1e3a8a',
                colorLight: '#ffffff',
            });
        }

        function buildGuestQRData(ceremony, guest) {
            if (!guest.quickCode) {
                guest.quickCode = String(Math.floor(10000 + Math.random() * 90000));
                localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
            }
            const data = ceremony.data || {};
            return {
                type: 'GUEST',
                id: guest.id,
                quickCode: guest.quickCode,
                ceremonyId: ceremony.id,
                guest: {
                    id: guest.id,
                    lastName: guest.lastName || '',
                    firstName: guest.firstName || '',
                    postName: guest.postName || '',
                    honorific: guest.honorific || '',
                    phone: guest.phone || '',
                    seat: guest.seat || '',
                    personCount: guest.count || guest.personCount || 1,
                    notes: guest.notes || ''
                },
                ceremony: {
                    id: ceremony.id,
                    name: data.name || ceremony.name || `Cérémonie ${ceremony.id}`,
                    type: data.type || '-',
                    location: data.location || '-',
                    startDateTime: data.startDateTime || '',
                    families: data.family1 ? [data.family1, data.family2].filter(Boolean) : [],
                    brideName: data.brideName || '',
                    groomName: data.groomName || ''
                },
                timestamp: new Date().toISOString()
            };
        }

        function generateGuestQRInline(guestId) {
            if (typeof reloadAppDataFromStorage === 'function') reloadAppDataFromStorage();
            const ceremony = ceremonies.find(c => String(c.id) === String(activeCeremonyId));
            if (!ceremony) {
                console.warn(`Ceremony ${activeCeremonyId} not found`);
                return;
            }

            const guest = (ceremony.guests || []).find(g => String(g.id) === String(guestId));
            if (!guest) {
                console.warn(`Guest ${guestId} not found in ceremony`);
                return;
            }

            setTimeout(() => {
                const qrContainer = document.getElementById(`qr-${guest.id}`);
                if (!qrContainer) {
                    console.warn(`QR Container qr-${guest.id} not found in DOM`);
                    return;
                }

                try {
                    const guestQRData = buildGuestQRData(ceremony, guest);
                    const ok = renderGuestQRIntoElement(qrContainer, ceremony, guest, 120);
                    if (!ok) {
                        qrContainer.innerHTML = '<p style="font-size: 10px; color: #ef4444; text-align: center; padding: 20px 8px;">QR indisponible</p>';
                    }

                    if (!window.guestQRData) window.guestQRData = {};
                    window.guestQRData[guest.id] = guestQRData;
                } catch (error) {
                    console.error(`Error generating QR for guest ${guest.id}:`, error);
                    qrContainer.innerHTML = '<p style="font-size: 10px; color: #ef4444; text-align: center; padding: 20px 8px;">Erreur QR</p>';
                }
            }, 200);
        }

        function downloadGuestQRCard(guestId) {
            // Reuse local generation logic for the guest QR modal
            generateGuestQRCode(guestId);
        }


        function generateGuestQRCode(guestId) {
            if (typeof reloadAppDataFromStorage === 'function') reloadAppDataFromStorage();
            const ceremony = ceremonies.find(c => String(c.id) === String(activeCeremonyId));
            if (!ceremony) return;

            const guest = (ceremony.guests || []).find(g => String(g.id) === String(guestId));
            if (!guest) return;

            const guestQRData = buildGuestQRData(ceremony, guest);

            window.currentGuestQRData = guestQRData;
            document.getElementById('guestQRName').textContent = `${guest.lastName} ${guest.postName ? ' ' + guest.postName : ''} ${guest.firstName}`;
            document.getElementById('guestQRCeremony').textContent = ceremony.data?.name || `Cérémonie ${ceremony.id}`;
            document.getElementById('guestQRSeat').textContent = guest.seat || '-';
            document.getElementById('guestQRCount').textContent = `${guest.count || 1} personne(s)`;
            document.getElementById('guestQuickCodeDisplay').textContent = guest.quickCode || '-';

            try {
                const qrContainer = document.getElementById('guestQRCodeContainer');
                if (!qrContainer) return;
                renderGuestQRIntoElement(qrContainer, ceremony, guest, 256);

                document.getElementById('guestQRModal').style.display = 'flex';
            } catch (error) {
                console.error('Error generating guest QR:', error);
                alert('Erreur lors de la génération du code QR');
            }
        }

        function closeGuestQRModal() {
            document.getElementById('guestQRModal').style.display = 'none';
        }

        // Vérifier le code rapide et mettre à jour le statut
        function verifyGuestQuickCode(quickCode) {
            // Chercher l'invité dans la cérémonie active
            const ceremony = ceremonies.find(c => c.id === activeCeremonyId);
            if (!ceremony) return;
            
            const guest = ceremony.guests.find(g => g.quickCode === quickCode);
            if (!guest) {
                alert('❌ Invité non trouvé');
                return;
            }

            // Enregistrer le scan
            if (!guest.scans) guest.scans = [];
            guest.scans.push({ timestamp: new Date().toISOString(), source: 'quick-code' });

            // Sauvegarder dans localStorage et synchroniser
            localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
            syncCeremonyToManagement(activeCeremonyId);

            // Mettre à jour la couleur de la carte
            updateGuestCardColor(guest);

            // Afficher les données de l'invité dans l'onglet vérifier
            const guestQRData = {
                type: 'GUEST',
                id: guest.id,
                quickCode: guest.quickCode,
                ceremonyId: ceremony.id,
                guest: {
                    id: guest.id,
                    lastName: guest.lastName || '',
                    firstName: guest.firstName || '',
                    honorific: guest.honorific || '',
                    phone: guest.phone || '',
                    seat: guest.seat || '',
                    personCount: guest.count || 1,
                    notes: guest.notes || ''
                },
                ceremony: {
                    id: ceremony.id,
                    name: ceremony.data?.name || `Cérémonie ${ceremony.id}`,
                    type: ceremony.data?.type || '-',
                    location: ceremony.data?.location || '-',
                    startDateTime: ceremony.data?.startDateTime || '',
                    families: ceremony.data?.family1 ? [ceremony.data.family1, ceremony.data.family2].filter(f => f) : [],
                    brideName: ceremony.data?.brideName || '',
                    groomName: ceremony.data?.groomName || ''
                },
                timestamp: new Date().toISOString()
            };

            // Afficher dans l'onglet vérifier
            const resultDiv = document.getElementById('verifyResult');
            const contentDiv = document.getElementById('verifyContent');
            if (resultDiv && contentDiv) {
                resultDiv.style.display = 'block';
                displayGuestVerificationResult(guestQRData, resultDiv, contentDiv);
            }

            // Afficher une notification
            const scanCount = guest.scans.length;
            if (scanCount === 1) {
                showAlarm('Scan #1', `✅ ${guest.firstName} ${guest.lastName} - Bienvenu!`, 'success');
            } else if (scanCount === 2) {
                alert('⚠️ DOUBLON !!! Cette même invitation a déjà été scannée.');
                showAlarm('⚠️ DOUBLON', `Code scanné 2 fois! Vérifiez ${guest.firstName} ${guest.lastName}`, 'warning');
            } else {
                showAlarm('⚠️ Attention', `Scan #${scanCount} pour ${guest.firstName} ${guest.lastName}`, 'warning');
            }

            debouncedRenderGuestsTable();
        }

        // Mettre à jour la couleur de la carte de l'invité
        function updateGuestCardColor(guest) {
            const cardElement = document.getElementById(`guestCardStatus-${guest.id}`);
            if (!cardElement) return;

            const parentCard = cardElement.closest('[style*="background: white"]');
            if (!parentCard) return;

            const scanCount = (guest.scans && guest.scans.length) || 0;

            if (scanCount === 0) {
                // Couleur par défaut (gris)
                parentCard.style.borderColor = '#e5e7eb';
                parentCard.style.background = 'white';
                parentCard.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            } else if (scanCount === 1) {
                // Verde après le premier scan
                parentCard.style.borderColor = '#10b981';
                parentCard.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
                parentCard.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
            } else {
                // Rouge après le deuxième scan (doublon)
                parentCard.style.borderColor = '#ef4444';
                parentCard.style.background = 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
                parentCard.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
                
                // Ajouter un label "DOUBLON"
                if (!parentCard.querySelector('.doublon-label')) {
                    const label = document.createElement('div');
                    label.className = 'doublon-label';
                    label.style.cssText = `
                        position: absolute;
                        top: -12px;
                        left: 12px;
                        background: #ef4444;
                        color: white;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 11px;
                        font-weight: 700;
                        letter-spacing: 1px;
                    `;
                    label.textContent = '🔴 DOUBLON';
                    parentCard.style.position = 'relative';
                    parentCard.appendChild(label);
                }
            }
        }

        function downloadGuestQR() {
            if (!window.currentGuestQRData) return;

            const data = window.currentGuestQRData;
            const element = document.createElement('a');
            const qrCanvas = document.querySelector('#guestQRCodeContainer canvas') || document.querySelector('#guestQRCodeContainer img');

            if (qrCanvas && qrCanvas.tagName === 'CANVAS') {
                element.setAttribute('href', qrCanvas.toDataURL('image/png'));
            } else if (qrCanvas && qrCanvas.tagName === 'IMG') {
                element.setAttribute('href', qrCanvas.src);
            } else {
                alert('Impossible de télécharger le QR code');
                return;
            }

            element.setAttribute('download', `QR_${data.guest.lastName}_${data.guest.postName || ''}_${data.guest.firstName}_${data.quickCode}.png`);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }

        function printGuestQR() {
            if (!window.currentGuestQRData) return;

            const data = window.currentGuestQRData;
            const qrContainer = document.querySelector('#guestQRCodeContainer');
            const qrImage = qrContainer.querySelector('canvas') || qrContainer.querySelector('img');

            if (!qrImage) {
                alert('Impossible d\'imprimer le QR code');
                return;
            }

            const printContent = document.createElement('div');
            printContent.style.cssText = 'text-align: center; padding: 30px; font-family: Arial, sans-serif;';

            const qrImageClone = qrImage.cloneNode(true);
            if (qrImage.tagName === 'CANVAS') {
                const img = document.createElement('img');
                img.src = qrImage.toDataURL('image/png');
                img.style.cssText = 'width: 256px; height: 256px; border-radius: 8px;';
                printContent.appendChild(img);
            } else {
                qrImageClone.style.cssText = 'width: 256px; height: 256px; border-radius: 8px;';
                printContent.appendChild(qrImageClone);
            }

            const infoDiv = document.createElement('div');
            infoDiv.style.cssText = 'margin-top: 20px; text-align: center;';
            infoDiv.innerHTML = `
                <h2>${data.guest.lastName} ${data.guest.postName ? ' ' + data.guest.postName : ''} ${data.guest.firstName}</h2>
                <p style="margin: 0 0 6px 0; color: #374151; font-weight: 500;">Post-nom: ${data.guest.postName || '-'}</p>
                <p><strong>Cérémonie:</strong> ${data.ceremony.name}</p>
                <p><strong>Place:</strong> ${data.guest.seat}</p>
                <p><strong>Code Rapide:</strong> ${data.quickCode}</p>
                <p style="font-size: 12px; color: #666; margin-top: 20px;"><em>Veuillez présenter ce code QR à l'entrée</em></p>
            `;
            printContent.appendChild(infoDiv);

            const printWindow = window.open('', '', 'left=0;top=0;width=800;height=600');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>QR Invité - ${data.guest.lastName} ${data.guest.postName ? ' ' + data.guest.postName : ''} ${data.guest.firstName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        * { box-sizing: border-box; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
                </html>
            `);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 300);
        }

        window.addEventListener('load', () => {
            renderCeremonyTabs();
        });

        // ======================== CLICK-OUTSIDE MODAL HANDLERS ========================
        document.addEventListener('click', function(event) {
            const ceremonyDetailsModal = document.getElementById('ceremonyDetailsModal');
            const guestQRModal = document.getElementById('guestQRModal');

            // Close ceremony details modal if click outside
            if (ceremonyDetailsModal && event.target === ceremonyDetailsModal) {
                closeCeremonyDetailsModal();
            }

            // Close guest QR modal if click outside
            if (guestQRModal && event.target === guestQRModal) {
                closeGuestQRModal();
            }
        });

        // ======================== PHOTO INPUT HANDLER ========================
        document.getElementById('guestPhoto')?.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    document.getElementById('guestPhotoImg').src = event.target.result;
                    document.getElementById('guestPhotoImg').style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        // ======================== GESTION DES RAPPORTS DE CÉRÉMONIES ========================
        
        function reloadCeremonyReport() {
            openCeremonySelectionModal();
        }

        function openCeremonySelectionModal() {
            const visitorsData = JSON.parse(localStorage.getItem('visitors') || '[]');
            const allCeremonies = visitorsData.filter(v => v.category === 'ceremonie');
            
            // Filter ceremonies to only show those with both bride and groom names
            const ceremonies = allCeremonies.filter(c => {
                return c.brideName && c.brideName.trim() !== '' && c.groomName && c.groomName.trim() !== '';
            });
            
            let html = '';
            if (ceremonies.length === 0) {
                html = '<div style="text-align: center; padding: 40px; color: #9ca3af;"><p style="font-size: 18px; margin: 0;">📭 Aucune cérémonie avec noms de mariés enregistrés</p><p style="font-size: 14px; margin: 10px 0 0 0; color: #6b7280;">Veuillez d\'abord enregistrer les noms de la mariée et du marié</p></div>';
            } else {
                ceremonies.forEach((ceremony, index) => {
                    const createdDate = new Date(ceremony.createdAt).toLocaleDateString('fr-FR');
                    const guestCount = ceremony.guests ? ceremony.guests.length : 0;
                    const scanCount = ceremony.scans ? ceremony.scans.length : 0;
                    
                    html += `
                        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; border-radius: 12px; padding: 15px; cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; gap: 10px;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 30px rgba(14,165,233,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'" onclick="displayCeremonyDetailedReport('${ceremony.id}')">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                                <div>
                                    <h3 style="margin: 0 0 5px 0; font-size: 18px; font-weight: 700; color: #1f2937;">${ceremony.name}</h3>
                                    <p style="margin: 0; font-size: 12px; color: #64748b;"><strong>💍 Mariés:</strong> ${ceremony.brideName} & ${ceremony.groomName}</p>
                                </div>
                                <span style="background: #0ea5e9; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; white-space: nowrap;">${index + 1}</span>
                            </div>
                            <p style="margin: 0; font-size: 13px; color: #475569;"><strong>📍 Lieu:</strong> ${ceremony.location}</p>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;">
                                <div style="background: white; padding: 8px; border-radius: 6px; text-align: center; border-left: 3px solid #10b981;">
                                    <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Invités</p>
                                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #10b981;">${guestCount}</p>
                                </div>
                                <div style="background: white; padding: 8px; border-radius: 6px; text-align: center; border-left: 3px solid #3b82f6;">
                                    <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Scans</p>
                                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #3b82f6;">${scanCount}</p>
                                </div>
                            </div>
                            <p style="margin: 0; font-size: 12px; color: #94a3b8;">📅 ${createdDate}</p>
                            <button style="background: #0ea5e9; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px; margin-top: 8px; transition: all 0.2s ease;" onmouseover="this.style.background='#0284c7'" onmouseout="this.style.background='#0ea5e9'">
                                📊 Voir le Rapport
                            </button>
                        </div>
                    `;
                });
            }
            
            document.getElementById('ceremonySelectionList').innerHTML = html;
            document.getElementById('ceremonySelectionModal').style.display = 'flex';
        }

        function closeCeremonySelectionModal() {
            document.getElementById('ceremonySelectionModal').style.display = 'none';
        }

        function filterCeremoniesSelection() {
            const searchInput = document.getElementById('ceremonySearchInput').value.toLowerCase();
            const cards = document.getElementById('ceremonySelectionList').querySelectorAll('div[onclick*="displayCeremonyDetailedReport"]');
            
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(searchInput)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        function displayCeremonyDetailedReport(ceremonyId) {
            const visitorsData = JSON.parse(localStorage.getItem('visitors') || '[]');
            const ceremony = visitorsData.find(v => v.id === ceremonyId && v.category === 'ceremonie');
            
            if (!ceremony) {
                alert('Cérémonie non trouvée');
                return;
            }

            // Calculer les statistiques pour cette cérémonie
            let totalGuests = 0;
            let totalPersons = 0;
            let totalScans = 0;
            let gifts = [];
            let supplies = { plates: 0, forks: 0, glasses: 0 };
            let drinks = { total: 0, consumed: 0, notConsumed: 0 };

            if (ceremony.guests && Array.isArray(ceremony.guests)) {
                ceremony.guests.forEach(guest => {
                    totalGuests++;
                    totalPersons += parseInt(guest.personCount || 1);
                    totalScans += guest.scans ? guest.scans.length : 0;
                    
                });
            }

            // Récupérer les fournitures et boissons
            if (ceremony.supplies) {
                supplies = ceremony.supplies;
            }
            if (ceremony.drinks) {
                drinks = ceremony.drinks;
            }

            const scanRate = totalGuests > 0 ? Math.round((totalScans / totalGuests) * 100) : 0;
            const createdDate = new Date(ceremony.createdAt).toLocaleString('fr-FR');

            // Construire le rapport HTML
            let reportHTML = `
                <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; border-radius: 12px; padding: 25px; margin-bottom: 20px;">
                    <h1 style="margin: 0 0 10px 0; color: #0284c7; font-size: 28px; display: flex; align-items: center; gap: 10px;">
                        🎉 ${ceremony.name}
                    </h1>
                    <p style="margin: 0; color: #475569; font-size: 14px;">📅 Créée le ${createdDate}</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                    <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 15px; border-radius: 12px; border-left: 4px solid #0284c7;">
                        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">👥 Total Invités</p>
                        <p style="margin: 0; font-size: 32px; font-weight: 900; color: #0284c7;">${totalGuests}</p>
                    </div>
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); padding: 15px; border-radius: 12px; border-left: 4px solid #d97706;">
                        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">👨👩👧👦 Personnes</p>
                        <p style="margin: 0; font-size: 32px; font-weight: 900; color: #d97706;">${totalPersons}</p>
                    </div>
                    <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 15px; border-radius: 12px; border-left: 4px solid #16a34a;">
                        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">✓ Scans</p>
                        <p style="margin: 0; font-size: 32px; font-weight: 900; color: #16a34a;">${totalScans}</p>
                    </div>
                    <div style="background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%); padding: 15px; border-radius: 12px; border-left: 4px solid #dc2626;">
                        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">📊 Taux Scan</p>
                        <p style="margin: 0; font-size: 32px; font-weight: 900; color: #dc2626;">${scanRate}%</p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                    <div style="background: #f9f9f9; border: 2px dashed var(--border); border-radius: 12px; padding: 15px;">
                        <h3 style="margin: 0 0 12px 0; color: var(--primary);">📋 Informations Générales</h3>
                        <div style="font-size: 13px; line-height: 1.8;">
                            <p style="margin: 0;"><strong>Type:</strong> ${ceremony.type}</p>
                            <p style="margin: 0;"><strong>Lieu:</strong> ${ceremony.location}</p>
                            <p style="margin: 0;"><strong>Responsable:</strong> ${ceremony.honorific} ${ceremony.name}</p>
                            <p style="margin: 0;"><strong>Téléphone:</strong> ${ceremony.phone || '-'}</p>
                        </div>
                    </div>

                    <div style="background: #f9f9f9; border: 2px dashed var(--border); border-radius: 12px; padding: 15px;">
                        <h3 style="margin: 0 0 12px 0; color: #7c3aed;">🍽️ Fournitures Utilisées</h3>
                        <div style="font-size: 13px; line-height: 1.8;">
                            <p style="margin: 0;"><strong>🍽️ Plats:</strong> ${supplies.plates || 0}</p>
                            <p style="margin: 0;"><strong>🍴 Fourchettes:</strong> ${supplies.forks || 0}</p>
                            <p style="margin: 0;"><strong>🥤 Verres:</strong> ${supplies.glasses || 0}</p>
                        </div>
                    </div>
                </div>

                <div style="background: linear-gradient(135deg, #fef3c7 0%, #ffeaa7 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
                    <h3 style="margin: 0 0 12px 0; color: #d97706;">🍷 Boissons</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 13px;">
                        <div style="background: white; padding: 10px; border-radius: 8px; border-left: 3px solid #d97706; text-align: center;">
                            <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600;">Total</p>
                            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #d97706;">${drinks.total || 0}</p>
                        </div>
                        <div style="background: white; padding: 10px; border-radius: 8px; border-left: 3px solid #10b981; text-align: center;">
                            <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600;">✓ Consommées</p>
                            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #10b981;">${drinks.consumed || 0}</p>
                        </div>
                        <div style="background: white; padding: 10px; border-radius: 8px; border-left: 3px solid #ef4444; text-align: center;">
                            <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600;">✗ Non Consommées</p>
                            <p style="margin: 0; font-size: 24px; font-weight: 700; color: #ef4444;">${drinks.notConsumed || 0}</p>
                        </div>
                    </div>
                </div>
            `;

            // Ajouter les cadeaux s'il y en a
            if (gifts.length > 0) {
                reportHTML += `
                    <div style="background: linear-gradient(135deg, #faf5ff 0%, #f5f0ff 100%); border: 2px solid #a855f7; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
                        <h3 style="margin: 0 0 12px 0; color: #7c3aed;">🎁 Cadeaux Enregistrés (${gifts.length})</h3>
                        <div style="display: grid; gap: 8px;">
                `;
                
                gifts.forEach(gift => {
                    reportHTML += `
                        <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #a855f7; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <p style="margin: 0; font-weight: 600; color: #1f2937;">${gift.type}</p>
                                <p style="margin: 0; font-size: 12px; color: #64748b;">Offert par: ${gift.from}</p>
                            </div>
                            <span style="font-size: 12px; color: #94a3b8;">${gift.date}</span>
                        </div>
                    `;
                });

                reportHTML += `
                        </div>
                    </div>
                `;
            }

            // Ajouter la liste des invités
            if (ceremony.guests && ceremony.guests.length > 0) {
                reportHTML += `
                    <div style="background: #f9f9f9; border: 2px dashed var(--border); border-radius: 12px; padding: 15px; margin-bottom: 25px;">
                        <h3 style="margin: 0 0 12px 0; color: var(--primary); display: flex; align-items: center; gap: 8px;">👥 Invités (${ceremony.guests.length})</h3>
                        <div style="display: grid; gap: 8px; max-height: 300px; overflow-y: auto;">
                `;

                ceremony.guests.forEach(guest => {
                    const scans = guest.scans ? guest.scans.length : 0;
                    reportHTML += `
                        <div style="background: white; padding: 10px; border-radius: 8px; border-left: 3px solid ${scans > 0 ? '#10b981' : '#ef4444'}; display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                            <div>
                                <span style="font-weight: 600;">${guest.firstName} ${guest.lastName}</span>
                                <span style="color: #64748b; margin-left: 8px;">${guest.honorific || ''}</span>
                            </div>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <span style="background: ${scans > 0 ? '#dcfce7' : '#fee2e2'}; color: ${scans > 0 ? '#10b981' : '#ef4444'}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                                    ${scans > 0 ? '✓ Scanné' : '✗ Non scanné'} (${scans})
                                </span>
                                <span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                                    ${guest.personCount || 1} pers.
                                </span>
                            </div>
                        </div>
                    `;
                });

                reportHTML += `
                        </div>
                    </div>
                `;
            }

            document.getElementById('detailedReportTitle').textContent = '📊 Rapport - ' + ceremony.name;
            document.getElementById('ceremonyDetailedReportContent').innerHTML = reportHTML;
            document.getElementById('ceremonyDetailedReportModal').style.display = 'flex';
        }

        function closeCeremonyDetailedReportModal() {
            document.getElementById('ceremonyDetailedReportModal').style.display = 'none';
        }

        function downloadCeremonyDetailedReport() {
            const reportTitle = document.getElementById('detailedReportTitle').textContent;
            const reportContent = document.getElementById('ceremonyDetailedReportContent').innerText;
            
            let text = reportTitle + '\n';
            text += '='.repeat(reportTitle.length) + '\n\n';
            text += reportContent;

            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Rapport-' + new Date().toISOString().split('T')[0] + '.txt';
            link.click();
        }

        function openCeremonyManagement(ceremonyId) {
            // Basculer vers l'onglet "ceremonie"
            switchTab('ceremonie', document.querySelector('button[onclick*="switchTab(\'ceremonie\'"]'));
            
            // Charger la cérémonie spécifique
            const visitorsData = JSON.parse(localStorage.getItem('visitors') || '[]');
            const ceremony = visitorsData.find(v => v.id === ceremonyId && v.category === 'ceremonie');
            
            if (ceremony) {
                // Charger la cérémonie dans le système de gestion
                activeCeremonyId = ceremonyId;
                loadCeremonyDetailsInModal(ceremonyId);
                
                // Ouvrir automatiquement les détails de la cérémonie
                setTimeout(() => {
                    openCeremonyDetails(ceremonyId);
                }, 500);
            }
        }

        function loadCeremoniesQuickList() {
            const visitorsData = JSON.parse(localStorage.getItem('visitors') || '[]');
            const allCeremonies = visitorsData.filter(v => v.category === 'ceremonie');
            
            // Filter to only show ceremonies with bride and groom names
            const ceremonies = allCeremonies.filter(c => {
                return c.brideName && c.brideName.trim() !== '' && c.groomName && c.groomName.trim() !== '';
            });
            
            const container = document.getElementById('ceremoniesToLoadQuick');
            
            if (ceremonies.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 20px; grid-column: 1 / -1;">📭 Aucune cérémonie avec noms de mariés</div>';
                return;
            }

            let html = '';
            ceremonies.forEach((ceremony, index) => {
                const createdDate = new Date(ceremony.createdAt).toLocaleDateString('fr-FR');
                const guestCount = ceremony.guests ? ceremony.guests.length : 0;
                const scanCount = ceremony.scans ? ceremony.scans.length : 0;
                const scanRate = guestCount > 0 ? Math.round((scanCount / guestCount) * 100) : 0;
                
                html += `
                    <div style="background: white; border: 2px solid #0ea5e9; border-radius: 10px; padding: 12px; cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; justify-content: space-between;" 
                         onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 20px rgba(14,165,233,0.15)'" 
                         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
                         onclick="openCeremonyManagement('${ceremony.id}')">
                        <div style="margin-bottom: 10px;">
                            <h4 style="margin: 0 0 5px 0; font-size: 14px; font-weight: 700; color: #0284c7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ceremony.name}</h4>
                            <p style="margin: 0; font-size: 11px; color: #64748b;"><strong>${ceremony.type}</strong> • ${ceremony.location}</p>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 8px;">
                            <div style="background: #f0f9ff; padding: 6px; border-radius: 6px; text-align: center; border-left: 2px solid #3b82f6;">
                                <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600;">Invités</p>
                                <p style="margin: 0; font-size: 16px; font-weight: 700; color: #3b82f6;">${guestCount}</p>
                            </div>
                            <div style="background: #f0f9ff; padding: 6px; border-radius: 6px; text-align: center; border-left: 2px solid #10b981;">
                                <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600;">Scans</p>
                                <p style="margin: 0; font-size: 16px; font-weight: 700; color: #10b981;">${scanCount}</p>
                            </div>
                            <div style="background: #fef3c7; padding: 6px; border-radius: 6px; text-align: center; border-left: 2px solid #d97706;">
                                <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600;">%</p>
                                <p style="margin: 0; font-size: 16px; font-weight: 700; color: #d97706;">${scanRate}%</p>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <p style="margin: 0; font-size: 10px; color: #94a3b8;">📅 ${createdDate}</p>
                            <button style="background: #0ea5e9; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;" onclick="event.stopPropagation(); displayCeremonyDetailedReport('${ceremony.id}')">📊</button>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        }

        function loadCeremonySelector() {
            try {
                const selector = document.getElementById('ceremonySelector');
                if (!selector) {
                    console.error('ceremonySelector non trouvé');
                    return;
                }
                
                const previousValue = selector.value;
                selector.innerHTML = '<option value="">-- Choisir une cérémonie --</option>';
                
                // Afficher les cérémonies gérées
                if (!managedCeremonies || !Array.isArray(managedCeremonies)) {
                    console.warn('managedCeremonies non disponible');
                    return;
                }
                
                console.log('Chargement des cérémonies:', managedCeremonies.length);
                
                if (managedCeremonies.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = '📭 Aucune cérémonie disponible';
                    option.disabled = true;
                    selector.appendChild(option);
                    return;
                }
                
                managedCeremonies.forEach(ceremony => {
                    const option = document.createElement('option');
                    option.value = ceremony.id;
                    
                    // Afficher le nom et les mariés
                    const displayName = ceremony.data?.brideName && ceremony.data?.groomName
                        ? `💍 ${ceremony.data.brideName} & ${ceremony.data.groomName} (${ceremony.data?.type || 'Cérémonie'})`
                        : ceremony.name + ' (' + (ceremony.data?.type || 'Cérémonie') + ')';
                    
                    option.textContent = displayName;
                    if (previousValue && previousValue === String(ceremony.id)) {
                        option.selected = true;
                    }
                    selector.appendChild(option);
                });
                
                console.log('Cérémonies chargées:', selector.options.length - 1);
                
            } catch (error) {
                console.error('Erreur dans loadCeremonySelector:', error);
            }
        }

        function loadCeremonySupplies() {
            const ceremonyId = document.getElementById('ceremonySelector').value;
            if (!ceremonyId) {
                // Réinitialiser les champs
                document.getElementById('editPlates').value = '';
                document.getElementById('editForks').value = '';
                document.getElementById('editGlasses').value = '';
                document.getElementById('editDrinksTotal').value = '';
                document.getElementById('editDrinksConsumed').value = '';
                document.getElementById('editDrinksNotConsumed').value = '';
                
                // Supprimer les event listeners existants
                removeSuppliesListeners();
                return;
            }

            const ceremony = managedCeremonies.find(mc => mc.id === ceremonyId);
            
            if (ceremony) {
                // Charger les fournitures
                if (ceremony.supplies) {
                    document.getElementById('editPlates').value = ceremony.supplies.plates || 0;
                    document.getElementById('editForks').value = ceremony.supplies.forks || 0;
                    document.getElementById('editGlasses').value = ceremony.supplies.glasses || 0;
                } else {
                    document.getElementById('editPlates').value = '';
                    document.getElementById('editForks').value = '';
                    document.getElementById('editGlasses').value = '';
                }

                // Charger les boissons
                if (ceremony.drinks) {
                    document.getElementById('editDrinksTotal').value = ceremony.drinks.total || 0;
                    document.getElementById('editDrinksConsumed').value = ceremony.drinks.consumed || 0;
                    document.getElementById('editDrinksNotConsumed').value = ceremony.drinks.notConsumed || 0;
                } else {
                    document.getElementById('editDrinksTotal').value = '';
                    document.getElementById('editDrinksConsumed').value = '';
                    document.getElementById('editDrinksNotConsumed').value = '';
                }

                // Ajouter les event listeners pour la synchronisation en temps réel
                addSuppliesListeners();
            }
        }

        function addSuppliesListeners() {
            const supplyFields = ['editPlates', 'editForks', 'editGlasses', 'editDrinksTotal', 'editDrinksConsumed', 'editDrinksNotConsumed'];
            supplyFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.removeEventListener('input', updateSuppliesRealtime);
                    field.addEventListener('input', updateSuppliesRealtime);
                }
            });
        }

        function removeSuppliesListeners() {
            const supplyFields = ['editPlates', 'editForks', 'editGlasses', 'editDrinksTotal', 'editDrinksConsumed', 'editDrinksNotConsumed'];
            supplyFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.removeEventListener('input', updateSuppliesRealtime);
                }
            });
        }

        function updateSuppliesRealtime() {
            const ceremonyId = document.getElementById('ceremonySelector')?.value;
            if (!ceremonyId) return;

            const ceremonyIndex = managedCeremonies.findIndex(mc => mc.id === ceremonyId);
            if (ceremonyIndex === -1) return;

            // Initialiser les objets s'ils n'existent pas
            if (!managedCeremonies[ceremonyIndex].supplies) {
                managedCeremonies[ceremonyIndex].supplies = {};
            }
            if (!managedCeremonies[ceremonyIndex].drinks) {
                managedCeremonies[ceremonyIndex].drinks = {};
            }

            // Sauvegarder les fournitures
            managedCeremonies[ceremonyIndex].supplies.plates = parseInt(document.getElementById('editPlates').value) || 0;
            managedCeremonies[ceremonyIndex].supplies.forks = parseInt(document.getElementById('editForks').value) || 0;
            managedCeremonies[ceremonyIndex].supplies.glasses = parseInt(document.getElementById('editGlasses').value) || 0;

            // Sauvegarder les boissons
            managedCeremonies[ceremonyIndex].drinks.total = parseInt(document.getElementById('editDrinksTotal').value) || 0;
            managedCeremonies[ceremonyIndex].drinks.consumed = parseInt(document.getElementById('editDrinksConsumed').value) || 0;
            managedCeremonies[ceremonyIndex].drinks.notConsumed = parseInt(document.getElementById('editDrinksNotConsumed').value) || 0;

            // Sauvegarder dans localStorage
            localStorage.setItem('managedCeremonies', JSON.stringify(managedCeremonies));
            
            // Mettre à jour le rapport en temps réel
            debouncedUpdateCeremonyReport();
        }

        function saveCeremonySupplies() {
            const ceremonyId = document.getElementById('ceremonySelector').value;
            if (!ceremonyId) {
                alert('Veuillez sélectionner une cérémonie');
                return;
            }

            // La sauvegarde se fait déjà en temps réel via updateSuppliesRealtime()
            // On confirme simplement à l'utilisateur
            updateSuppliesRealtime();
            alert('✅ Fournitures et boissons synchronisées avec succès !');
        }

        function addGiftToCeremony() {
            const ceremonyId = document.getElementById('ceremonySelector').value;
            const giftType = document.getElementById('giftType').value.trim();
            const giftFrom = document.getElementById('giftFrom').value.trim();
            const giftDate = document.getElementById('giftDate').value;

            if (!ceremonyId) {
                alert('Veuillez sélectionner une cérémonie');
                return;
            }

            if (!giftType || !giftFrom) {
                alert('Veuillez remplir le type de cadeau et le nom du donateur');
                return;
            }

            const ceremonyIndex = managedCeremonies.findIndex(mc => mc.id === ceremonyId);
            
            if (ceremonyIndex !== -1) {
                // Initialiser la liste des cadeaux si elle n'existe pas
                if (!managedCeremonies[ceremonyIndex].gifts) {
                    managedCeremonies[ceremonyIndex].gifts = [];
                }

                // Ajouter le cadeau
                const newGift = {
                    id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    type: giftType,
                    from: giftFrom,
                    date: giftDate || new Date().toISOString().split('T')[0],
                    addedAt: new Date().toISOString()
                };

                managedCeremonies[ceremonyIndex].gifts.push(newGift);

                // Sauvegarder dans localStorage
                localStorage.setItem('managedCeremonies', JSON.stringify(managedCeremonies));
                
                // Mettre à jour le rapport
                debouncedUpdateCeremonyReport();
                
                // Réinitialiser les champs
                document.getElementById('giftType').value = '';
                document.getElementById('giftFrom').value = '';
                document.getElementById('giftDate').value = '';
                
                alert('🎁 Cadeau ajouté avec succès !');
            }
        }
 
        function updateCeremonyReport() {
            // Charger les données depuis localStorage
            const visitorsData = JSON.parse(localStorage.getItem('visitors') || '[]');
            
            // Filtrer les cérémonies (category === 'ceremonie')
            const ceremonies = visitorsData.filter(v => v.category === 'ceremonie');
            
            // Initialiser les compteurs
            let totalInvitations = 0;
            let totalScanned = 0;
            let giftEntries = [];
            let totalPlates = 0;
            let totalForks = 0;
            let totalGlasses = 0;
            let totalDrinks = 0;
            let consumedDrinks = 0;
            let notConsumedDrinks = 0;

            // Boucler dans toutes les cérémonies
            ceremonies.forEach(ceremony => {
                // Compter les invitations générées (par nombre de personnes)
                if (ceremony.guests && Array.isArray(ceremony.guests)) {
                    ceremony.guests.forEach(guest => {
                        totalInvitations += parseInt(guest.personCount || 1);
                        
                        // Compter les scans
                        if (guest.scans && Array.isArray(guest.scans)) {
                            totalScanned += guest.scans.length;
                        }
                    });
                }
            });

            // Lire les fournitures, boissons et cadeaux depuis managedCeremonies
            managedCeremonies.forEach(managedCeremony => {
                // Compter les fournitures
                if (managedCeremony.supplies) {
                    totalPlates += parseInt(managedCeremony.supplies.plates || 0);
                    totalForks += parseInt(managedCeremony.supplies.forks || 0);
                    totalGlasses += parseInt(managedCeremony.supplies.glasses || 0);
                }

                // Compter les boissons
                if (managedCeremony.drinks) {
                    totalDrinks += parseInt(managedCeremony.drinks.total || 0);
                    consumedDrinks += parseInt(managedCeremony.drinks.consumed || 0);
                    notConsumedDrinks += parseInt(managedCeremony.drinks.notConsumed || 0);
                }

                // Récupérer les cadeaux
                if (managedCeremony.gifts && Array.isArray(managedCeremony.gifts)) {
                    managedCeremony.gifts.forEach(gift => {
                        giftEntries.push({
                            type: gift.type,
                            from: gift.from,
                            date: gift.date || '-'
                        });
                    });
                }
            });

            // Calculer le taux de scan
            const scanRate = totalInvitations > 0 ? Math.round((totalScanned / totalInvitations) * 100) : 0;

            // Mettre à jour les éléments du DOM
            const totalGen = document.getElementById('totalInvitationsGenerated');
            if (totalGen) totalGen.textContent = totalInvitations;
            
            const totalScanned_el = document.getElementById('totalInvitationsScanned');
            if (totalScanned_el) totalScanned_el.textContent = totalScanned;
            
            const scanRateEl = document.getElementById('totalScanRate');
            if (scanRateEl) scanRateEl.textContent = scanRate + '%';
            
            const platesEl = document.getElementById('platesUsed');
            if (platesEl) platesEl.textContent = totalPlates;
            
            const forksEl = document.getElementById('forksUsed');
            if (forksEl) forksEl.textContent = totalForks;
            
            const glassesEl = document.getElementById('glassesUsed');
            if (glassesEl) glassesEl.textContent = totalGlasses;
            
            const drinksEl = document.getElementById('drinksCount');
            if (drinksEl) drinksEl.textContent = totalDrinks;
            
            const consumedEl = document.getElementById('drinksConsumed');
            if (consumedEl) consumedEl.textContent = consumedDrinks;
            
            const notConsumedEl = document.getElementById('drinksNotConsumed');
            if (notConsumedEl) notConsumedEl.textContent = notConsumedDrinks;

            // Mettre à jour la liste des cadeaux
            const giftsList = document.getElementById('giftsList');
            if (giftsList) {
                if (giftEntries.length > 0) {
                    let giftsHTML = '';
                    giftEntries.forEach(gift => {
                        giftsHTML += `
                            <div style="background: white; padding: 12px; margin-bottom: 8px; border-radius: 8px; border-left: 4px solid #a855f7; display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;">
                                <div>
                                    <p style="margin: 0; font-weight: 600; color: #1f2937;">${gift.type}</p>
                                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Offert par : ${gift.from}</p>
                                </div>
                                <span style="background: #a855f7; color: white; padding: 6px 10px; border-radius: 999px; font-weight: 600; font-size: 12px; white-space: nowrap;">${gift.date}</span>
                            </div>
                        `;
                    });
                    giftsList.innerHTML = giftsHTML;
                } else {
                    giftsList.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 20px;">Aucun cadeau enregistré</div>';
                }
            }

            // Charger la liste rapide des cérémonies disponibles
            loadCeremoniesQuickList();
            
            // Charger le sélecteur de cérémonies pour l'édition
            loadCeremonySelector();
        }

        function downloadCeremonyReport() {
            // Charger les données
            const visitorsData = JSON.parse(localStorage.getItem('visitors') || '[]');
            const allCeremonies = visitorsData.filter(v => v.category === 'ceremonie');
            
            // Filter to only include ceremonies with bride and groom names
            const ceremonies = allCeremonies.filter(c => {
                return c.brideName && c.brideName.trim() !== '' && c.groomName && c.groomName.trim() !== '';
            });
            
            // Créer le rapport textuel
            let reportText = '📊 RAPPORT COMPLET DES CÉRÉMONIES\n';
            reportText += '================================\n';
            reportText += 'Généré le : ' + new Date().toLocaleString('fr-FR') + '\n\n';
            
            reportText += '📈 STATISTIQUES GÉNÉRALES\n';
            reportText += '------------------------\n';
            reportText += 'Invitations Générées : ' + document.getElementById('totalInvitationsGenerated').textContent + '\n';
            reportText += 'Invitations Scannées : ' + document.getElementById('totalInvitationsScanned').textContent + '\n';
            reportText += 'Taux de Scan : ' + document.getElementById('totalScanRate').textContent + '\n\n';
            
            reportText += '🍽️ FOURNITURES UTILISÉES\n';
            reportText += '------------------------\n';
            reportText += 'Plats : ' + document.getElementById('platesUsed').textContent + '\n';
            reportText += 'Fourchettes : ' + document.getElementById('forksUsed').textContent + '\n';
            reportText += 'Verres : ' + document.getElementById('glassesUsed').textContent + '\n\n';
            
            reportText += '🍷 BOISSONS\n';
            reportText += '------------------------\n';
            reportText += 'Total : ' + document.getElementById('drinksCount').textContent + '\n';
            reportText += 'Consommées : ' + document.getElementById('drinksConsumed').textContent + '\n';
            reportText += 'Non Consommées : ' + document.getElementById('drinksNotConsumed').textContent + '\n\n';
            
            reportText += '🎁 CADEAUX ENREGISTRÉS\n';
            reportText += '------------------------\n';
            const giftsList = document.getElementById('giftsList');
            const gifts = giftsList.querySelectorAll('div:not(:only-child)');
            if (gifts.length > 0) {
                gifts.forEach(gift => {
                    const text = gift.textContent.trim();
                    reportText += '• ' + text + '\n';
                });
            } else {
                reportText += 'Aucun cadeau enregistré\n';
            }
            
            reportText += '\n\n🏛️ DÉTAILS PAR CÉRÉMONIE\n';
            reportText += '========================\n';
            ceremonies.forEach((ceremony, index) => {
                reportText += '\n' + (index + 1) + '. ' + ceremony.name + '\n';
                reportText += '   Type : ' + ceremony.type + '\n';
                reportText += '   Lieu : ' + ceremony.location + '\n';
                reportText += '   Invités : ' + (ceremony.guests ? ceremony.guests.length : 0) + '\n';
                reportText += '   Date de création : ' + new Date(ceremony.createdAt).toLocaleString('fr-FR') + '\n';
                reportText += '   Nombre de scans : ' + (ceremony.scans ? ceremony.scans.length : 0) + '\n';
            });

            // Créer un blob et télécharger
            const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Rapport-Ceremonies-' + new Date().toISOString().split('T')[0] + '.txt';
            link.click();
        }

        // Initialiser le rapport au chargement de la page
        document.addEventListener('DOMContentLoaded', function() {
            // Si on a des données, charger le rapport au démarrage
            debouncedUpdateCeremonyReport();
        });

        // Écouter les changements de données pour mettre à jour le rapport
        window.addEventListener('storage', function(e) {
            if (e.key === 'visitors') {
                debouncedUpdateCeremonyReport();
            }
        });

        function updateThemeButton() {
            const btn = document.getElementById('themeToggleBtn');
            if (!btn) return;
            const icon = btn.querySelector('i');
            const span = btn.querySelector('span');
            if (document.body.classList.contains('dark-theme')) {
                if (icon) icon.className = 'fa-solid fa-sun';
                if (span) span.textContent = 'Mode jour';
            } else {
                if (icon) icon.className = 'fa-solid fa-moon';
                if (span) span.textContent = 'Mode nuit';
            }
        }

        function toggleTheme() {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('themeMode', isDark ? 'dark' : 'light');
            updateThemeButton();
        }

        document.addEventListener('DOMContentLoaded', function() {
            const savedTheme = localStorage.getItem('themeMode');
            // Appliquer le mode sombre par défaut
            if (savedTheme === 'light') {
                document.body.classList.remove('dark-theme');
            } else {
                document.body.classList.add('dark-theme');
            }
            updateThemeButton();
        });

        // ======================== NOUVELLES FONCTIONS POUR LA GESTION DES CÉRÉMONIES ========================

        // Variables globales pour la gestion des cérémonies
        let currentCeremonyId = null;

        // Boissons prédéfinies par catégorie
        const drinkCategories = {
            'Vin': [],
            'Champagne': [],
            'Liqueur': [],
            'Bière': [],
            'Eau': [],
            'Canette': [],
            'Personnalisé': []
        };

        // Afficher la liste des cérémonies
        function renderCeremoniesList() {
            const ceremoniesList = document.getElementById('ceremoniesList');
            if (!ceremoniesList) return;

            // Charger les données depuis localStorage
            const storedCeremonies = JSON.parse(localStorage.getItem('ceremonies') || '[]');
            const storedManagedCeremonies = JSON.parse(localStorage.getItem('managedCeremonies') || '[]');

            // Combiner les cérémonies avec les données de gestion
            const allCeremonies = storedCeremonies.map(cer => {
                const managed = storedManagedCeremonies.find(mc => mc.id === cer.id);
                return {
                    ...cer,
                    managedData: managed || null
                };
            });

            if (allCeremonies.length === 0) {
                ceremoniesList.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i class="fa-solid fa-champagne-glasses"></i>
                        <p>Aucune cérémonie créée</p>
                        <p style="margin-top:8px;font-size:13px;">Cliquez sur « Nouvelle cérémonie » pour commencer</p>
                    </div>
                `;
                return;
            }

            ceremoniesList.innerHTML = allCeremonies.map(ceremony => {
                const guestCount = ceremony.guests ? ceremony.guests.length : 0;
                const managedData = ceremony.managedData;
                const brideName = managedData?.data?.brideName || ceremony.data?.brideName || '';
                const groomName = managedData?.data?.groomName || ceremony.data?.groomName || '';
                const weddingDate = managedData?.data?.weddingDate || ceremony.data?.startDateTime || '';

                // Calculer les statistiques d'invitations
                let scannedCount = 0;
                let notScannedCount = 0;

                if (ceremony.guests && ceremony.guests.length > 0) {
                    ceremony.guests.forEach(guest => {
                        if (guest.scans && guest.scans.length > 0) {
                            scannedCount++;
                        } else {
                            notScannedCount++;
                        }
                    });
                }

                // Formater la date
                let dateDisplay = 'Date non définie';
                if (weddingDate) {
                    try {
                        const date = new Date(weddingDate);
                        dateDisplay = date.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                    } catch (e) {
                        dateDisplay = weddingDate;
                    }
                }

                return `
                    <div class="ceremony-list-card" onclick="openCeremonyForm('${ceremony.id}')">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
                            <h3 onclick="event.stopPropagation(); toggleCeremonyCardInfo('${ceremony.id}')">${ceremony.name || ceremony.data?.name || 'Cérémonie sans nom'}</h3>
                            <div class="ceremony-list-badges">
                                <span class="badge-type">${ceremony.data?.type || 'Non défini'}</span>
                                <span class="badge-count">${guestCount} invité${guestCount > 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        <div class="ceremony-list-meta">
                            ${brideName && groomName ? `
                                <div class="ceremony-list-meta-row">
                                    <i class="fa-solid fa-heart"></i>
                                    <span>${brideName} & ${groomName}</span>
                                </div>
                            ` : ''}
                            <div class="ceremony-list-meta-row">
                                <i class="fa-solid fa-calendar"></i>
                                <span>${dateDisplay}</span>
                            </div>
                            <div class="ceremony-list-meta-row">
                                <i class="fa-solid fa-location-dot"></i>
                                <span>${ceremony.location || ceremony.data?.location || 'Lieu non défini'}</span>
                            </div>
                        </div>

                        <div id="ceremonyInfo_${ceremony.id}" style="display:none; margin-top:12px; border-top:1px dashed var(--border); padding-top:12px;">
                            <div style="font-size:13px; color:var(--text-muted); margin-bottom:8px;">${ceremony.data?.notes || ''}</div>
                            <div style="margin-bottom:8px;">
                                <strong style="font-size:13px;">Invités (aperçu)</strong>
                                <div style="margin-top:8px;">
                                    ${ (ceremony.guests && ceremony.guests.length>0) ? ceremony.guests.slice(0,3).map(g => `<div style="padding:8px 10px; background:var(--light); border-radius:8px; margin-bottom:6px; border:1px solid var(--border); font-size:13px;">${(g.firstName || g.lastName || g.fullName || g.nom) ? (g.firstName?g.firstName+' ':'') + (g.lastName?g.lastName:g.fullName||g.nom) : (g.nom || g.lastName || 'Invité')}</div>`).join('') : '<div style="color:var(--text-muted); font-size:13px;">Aucun invité</div>' }
                                </div>
                                ${ (guestCount>3) ? `<div id="moreGuests_${ceremony.id}" style="display:none; margin-top:8px;">${ ceremony.guests.slice(3).map(g=>`<div style="padding:8px 10px; background:var(--light); border-radius:8px; margin-bottom:6px; border:1px solid var(--border); font-size:13px;">${(g.firstName?g.firstName+' ':'')+(g.lastName?g.lastName:g.fullName||g.nom)}</div>`).join('') }</div>
                                <button type="button" class="btn btn-ghost btn-small" data-ceremony-id="${ceremony.id}" data-count="${guestCount-3}" onclick="event.stopPropagation(); toggleGuestPreview('${ceremony.id}');">Afficher ${guestCount-3} de plus</button>` : '' }
                            </div>
                        </div>

                        <div class="ceremony-stats-row">
                            <div class="ceremony-stats-grid">
                                <div>
                                    <div class="num">${guestCount}</div>
                                    <div class="lbl">Créées</div>
                                </div>
                                <div>
                                    <div class="num" style="color:#16a34a;">${scannedCount}</div>
                                    <div class="lbl">Scannées</div>
                                </div>
                                <div>
                                    <div class="num" style="color:#d97706;">${notScannedCount}</div>
                                    <div class="lbl">En attente</div>
                                </div>
                            </div>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; color:var(--primary); font-size:13px; font-weight:600;">
                            <span><i class="fa-solid fa-users"></i> ${guestCount} invité${guestCount > 1 ? 's' : ''}</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Toggle visible details in ceremony card (details & guest preview)
        function toggleCeremonyCardInfo(ceremonyId) {
            const el = document.getElementById('ceremonyInfo_' + ceremonyId);
            if (!el) return;
            el.style.display = (el.style.display === 'block') ? 'none' : 'block';
        }

        function toggleGuestPreview(ceremonyId) {
            const more = document.getElementById('moreGuests_' + ceremonyId);
            if (!more) return;
            const isVisible = more.style.display === 'block';
            more.style.display = isVisible ? 'none' : 'block';
            // Update button label(s) that control this preview using data attribute
            const buttons = document.querySelectorAll(`button[data-ceremony-id="${ceremonyId}"]`);
            buttons.forEach(b => {
                const count = parseInt(b.getAttribute('data-count') || '0', 10) || 0;
                b.textContent = isVisible ? `Afficher ${count} de plus` : 'Masquer';
            });
        }

        // Ouvrir le formulaire de gestion d'une cérémonie
        function openCeremonyForm(ceremonyId) {
            currentCeremonyId = ceremonyId;
            const form = document.getElementById('ceremonyManagementForm');
            const title = document.getElementById('ceremonyFormTitle');

            // Trouver la cérémonie
            const ceremony = ceremonies.find(c => c.id == ceremonyId);
            const managedCeremony = managedCeremonies.find(mc => mc.id == ceremonyId);

            if (!ceremony) {
                alert('Cérémonie non trouvée');
                return;
            }

            // Remplir le titre
            title.textContent = `Gestion de ${ceremony.name || ceremony.data?.name || 'la Cérémonie'}`;

            // Remplir les informations des mariés
            document.getElementById('brideName').value = managedCeremony?.data?.brideName || ceremony.data?.brideName || '';
            document.getElementById('groomName').value = managedCeremony?.data?.groomName || ceremony.data?.groomName || '';

            // Remplir la date du mariage
            const weddingDate = managedCeremony?.data?.weddingDate || ceremony.data?.startDateTime || '';
            document.getElementById('weddingDate').value = weddingDate ? new Date(weddingDate).toISOString().slice(0, 16) : '';

            // Remplir les fournitures
            const supplies = managedCeremony?.supplies || {};
            document.getElementById('suppliesPlates').value = supplies.plates || '';
            document.getElementById('suppliesForks').value = supplies.forks || '';
            document.getElementById('suppliesGlasses').value = supplies.glasses || '';
            renderCustomSupplies(supplies.custom || []);

            // Afficher les cards de catégories de boissons
            renderDrinkCategoryCards(managedCeremony?.drinks || []);

            // Remplir les boissons
            renderDrinkTypes(managedCeremony?.drinks || {});

            // Remplir les cadeaux
            renderGiftTypes(managedCeremony?.gifts || []);
            renderOrganizerList(managedCeremony || { organizers: ceremony.data?.organizers || [] });
            totalGuestListExpanded = false;
            renderCeremonyGuestList(ceremony);

            // Afficher le formulaire avec animation
            form.style.display = 'block';
            form.scrollIntoView({ behavior: 'smooth' });
        }

        function getManagedCeremony(ceremonyId) {
            return managedCeremonies.find(mc => mc.id == ceremonyId);
        }

        function findOrCreateManagedCeremony(ceremonyId) {
            let managedCeremony = getManagedCeremony(ceremonyId);
            const ceremony = ceremonies.find(c => c.id == ceremonyId);
            if (!managedCeremony) {
                managedCeremony = {
                    id: ceremonyId,
                    name: ceremony?.name || ceremony?.data?.name || `Cérémonie ${ceremonyId}`,
                    data: ceremony?.data || {},
                    guests: ceremony?.guests || [],
                    supplies: {},
                    drinks: [],
                    gifts: [],
                    organizers: ceremony?.data?.organizers ? [...ceremony.data.organizers] : []
                };
                managedCeremonies.push(managedCeremony);
            }
            if (!managedCeremony.organizers) {
                managedCeremony.organizers = ceremony?.data?.organizers ? [...ceremony.data.organizers] : [];
            }
            return managedCeremony;
        }

        let totalGuestListExpanded = false;

        function persistManagedCeremonies() {
            localStorage.setItem('managedCeremonies', JSON.stringify(managedCeremonies));
        }

        function resetOrganizerForm() {
            ['organizerFirstName', 'organizerLastName', 'organizerEmail', 'organizerPhone', 'organizerService'].forEach(id => {
                const field = document.getElementById(id);
                if (field) field.value = '';
            });
        }

        function resetCeremonyManagementForm() {
            ['brideName', 'groomName', 'weddingDate'].forEach(id => {
                const field = document.getElementById(id);
                if (field) field.value = '';
            });
            ['suppliesPlates', 'suppliesForks', 'suppliesGlasses'].forEach(id => {
                const field = document.getElementById(id);
                if (field) field.value = '';
            });
            const customContainer = document.getElementById('customSuppliesContainer');
            if (customContainer) customContainer.innerHTML = '';
            const giftContainer = document.getElementById('giftTypesContainer');
            if (giftContainer) giftContainer.innerHTML = '';
            renderDrinkCategoryCards([]);
            renderDrinkTypes([]);
            resetOrganizerForm();
        }

        function toggleTotalGuestList() {
            totalGuestListExpanded = !totalGuestListExpanded;
            const ceremony = ceremonies.find(c => c.id == currentCeremonyId);
            renderCeremonyGuestList(ceremony);
        }

        function addOrganizer() {
            if (!currentCeremonyId) return;

            const firstName = document.getElementById('organizerFirstName')?.value.trim();
            const lastName = document.getElementById('organizerLastName')?.value.trim();
            const email = document.getElementById('organizerEmail')?.value.trim();
            const phone = document.getElementById('organizerPhone')?.value.trim();
            const service = document.getElementById('organizerService')?.value.trim();

            if (!firstName && !lastName) {
                qrNotifyError('Champs requis', 'Saisissez au moins un nom ou un post-nom pour le membre du comité.');
                return;
            }
            if (!email && !phone) {
                qrNotifyError('Contact requis', 'Saisissez une adresse e-mail ou un numéro de téléphone.');
                return;
            }

            const managedCeremony = findOrCreateManagedCeremony(currentCeremonyId);
            const duplicate = managedCeremony.organizers.find(org => (email && org.email === email) || (phone && org.phone === phone) || ((org.firstName === firstName && org.lastName === lastName) && (firstName || lastName)));
            if (duplicate) {
                qrNotifyError('Doublon', 'Ce membre du comité existe déjà.');
                return;
            }

            const organizer = {
                id: Date.now(),
                firstName,
                lastName,
                email,
                phone,
                service
            };
            managedCeremony.organizers.push(organizer);
            persistManagedCeremonies();

            const ceremony = ceremonies.find(c => c.id == currentCeremonyId);
            if (ceremony) {
                if (!ceremony.data) ceremony.data = {};
                ceremony.data.organizers = managedCeremony.organizers;
                localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
            }

            renderOrganizerList(managedCeremony);

            qrPersist({
                successTitle: 'Organisateur ajouté',
                successMessage: 'Le membre du comité a été enregistré dans la base de données.',
                afterSuccess: resetOrganizerForm,
            });
        }

        function removeOrganizer(organizerId) {
            if (!currentCeremonyId) return;
            const managedCeremony = findOrCreateManagedCeremony(currentCeremonyId);
            managedCeremony.organizers = managedCeremony.organizers.filter(org => org.id !== organizerId);
            persistManagedCeremonies();

            const ceremony = ceremonies.find(c => c.id == currentCeremonyId);
            if (ceremony) {
                if (!ceremony.data) ceremony.data = {};
                ceremony.data.organizers = managedCeremony.organizers;
                localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
            }

            renderOrganizerList(managedCeremony);
        }

        function renderOrganizerList(managedCeremony) {
            const container = document.getElementById('organizerListContainer');
            if (!container) return;
            const organizers = managedCeremony?.organizers || [];
            if (organizers.length === 0) {
                container.innerHTML = '<div style="padding: 16px; border-radius: 12px; background: #000; color: #f8fafc; border: 1px solid #111;">Aucun membre du comité ajouté pour cette cérémonie.</div>';
                return;
            }

            container.innerHTML = organizers.map((org, idx) => `
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; background: #000; border: 1px solid #111; border-radius: 12px; padding: 16px;">
                    <div>
                        <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #ffffff;">${idx + 1}. ${org.firstName || ''} ${org.lastName || ''}</p>
                        <p style="margin: 0 0 4px 0; color: #d1d5db; font-size: 13px;">Service : ${org.service || 'Non précisé'}</p>
                        <p style="margin: 0; color: #9ca3af; font-size: 13px;">✉️ ${org.email || 'Non renseigné'} • 📞 ${org.phone || 'Non renseigné'}</p>
                    </div>
                    <button type="button" class="btn btn-secondary btn-small" onclick="removeOrganizer(${org.id})" style="padding: 10px 14px; background: transparent; border: 1px solid #374151; color: #fff;">Supprimer</button>
                </div>
            `).join('');
        }

        function renderCeremonyGuestList(ceremony) {
            const summary = document.getElementById('guestListSummary');
            const container = document.getElementById('totalGuestListContainer');
            const toggleButton = document.getElementById('toggleGuestListButton');
            if (!summary || !container || !toggleButton) return;
            const guests = ceremony?.guests || [];
            const totalPeople = guests.reduce((sum, guest) => sum + (parseInt(guest.count, 10) || 1), 0);
            summary.textContent = `Invités totaux : ${guests.length} · Personnes : ${totalPeople}`;

            if (guests.length === 0) {
                container.innerHTML = '<div style="padding: 16px; border-radius: 12px; background: #f8fafc; color: #475569; border: 1px solid #e2e8f0;">Aucun invité créé pour cette cérémonie.</div>';
                toggleButton.style.display = 'none';
                return;
            }

            const previewLimit = 3;
            const collapsed = !totalGuestListExpanded && guests.length > previewLimit;
            const displayedGuests = collapsed ? guests.slice(0, previewLimit) : guests;
            const hiddenCount = guests.length - previewLimit;

            if (hiddenCount > 0) {
                toggleButton.style.display = 'inline-flex';
                toggleButton.textContent = totalGuestListExpanded ? 'Replier la liste des invités' : `Déplier la liste des invités (${hiddenCount} caché${hiddenCount > 1 ? 's' : ''})`;
            } else {
                toggleButton.style.display = 'none';
            }

            container.innerHTML = displayedGuests.map((guest, idx) => {
                const fullName = `${guest.honorific ? guest.honorific + ' ' : ''}${guest.lastName || guest.fullName || ''} ${guest.firstName || ''}`.trim();
                const seat = guest.seat ? ` • Place : ${guest.seat}` : '';
                const phone = guest.phone ? ` • 📞 ${guest.phone}` : '';
                return `
                    <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: white; display: flex; justify-content: space-between; gap: 12px; align-items: center;">
                        <div>
                            <p style="margin: 0 0 6px 0; font-weight: 700; color: #1f2937;">${idx + 1}. ${fullName || 'Invité sans nom'}</p>
                            <p style="margin: 0; color: #475569; font-size: 13px;">${guest.count || 1} personne(s)${seat}${phone}</p>
                        </div>
                        <span style="font-size: 12px; color: #64748b; background: #f1f5f9; border-radius: 999px; padding: 6px 10px;">${guest.quickCode || '—'}</span>
                    </div>
                `;
            }).join('');

            if (collapsed && guests.length > previewLimit) {
                const info = document.createElement('div');
                info.style.color = '#475569';
                info.style.fontSize = '13px';
                info.style.marginTop = '4px';
                info.textContent = `Affichage des ${previewLimit} premiers invités. Cliquez sur le bouton pour voir la liste entière.`;
                container.appendChild(info);
            }
        }

        // Fermer le formulaire
        function closeCeremonyForm() {
            const form = document.getElementById('ceremonyManagementForm');
            form.style.display = 'none';
            currentCeremonyId = null;
        }

        // Sauvegarder les détails de la cérémonie
        function saveCeremonyDetails() {
            if (!currentCeremonyId) return;

            // Récupérer les valeurs du formulaire
            const brideName = document.getElementById('brideName').value.trim();
            const groomName = document.getElementById('groomName').value.trim();
            const weddingDate = document.getElementById('weddingDate').value;

            // Récupérer les fournitures
            const supplies = {
                plates: parseInt(document.getElementById('suppliesPlates').value) || 0,
                forks: parseInt(document.getElementById('suppliesForks').value) || 0,
                glasses: parseInt(document.getElementById('suppliesGlasses').value) || 0,
                custom: []
            };

            document.querySelectorAll('.custom-supply-row').forEach(row => {
                const name = row.querySelector('.custom-supply-name')?.value.trim();
                const quantity = parseInt(row.querySelector('.custom-supply-count')?.value) || 0;
                if (name && quantity > 0) {
                    supplies.custom.push({ name, quantity });
                }
            });

            // Récupérer les boissons
            const drinks = [];
            document.querySelectorAll('.drink-type-row').forEach(row => {
                const category = row.querySelector('.drink-category')?.value || '';
                const type = row.querySelector('.drink-type')?.value || '';
                const count = parseInt(row.querySelector('.drink-count')?.value) || 0;
                if (category && type && count > 0) {
                    drinks.push({ category, type, count });
                }
            });

            // Récupérer les cadeaux
            const gifts = [];
            document.querySelectorAll('.gift-type-row').forEach(row => {
                const type = row.querySelector('.gift-type-desc')?.value.trim();
                const from = row.querySelector('.gift-type-from')?.value.trim();
                const date = row.querySelector('.gift-type-date')?.value;
                if (type && from) {
                    gifts.push({ type, from, date });
                }
            });

            // Validation basique
            if (!brideName || !groomName) {
                qrNotifyError('Champs requis', 'Veuillez saisir les noms de la mariée et du marié.');
                return;
            }

            // Trouver ou créer la cérémonie gérée
            let managedCeremony = managedCeremonies.find(mc => mc.id == currentCeremonyId);
            if (!managedCeremony) {
                const ceremony = ceremonies.find(c => c.id == currentCeremonyId);
                managedCeremony = {
                    id: currentCeremonyId,
                    name: ceremony?.name || ceremony?.data?.name || 'Cérémonie',
                    data: ceremony?.data || {},
                    guests: ceremony?.guests || [],
                    supplies: {},
                    drinks: [],
                    gifts: []
                };
                managedCeremonies.push(managedCeremony);
            }

            // Mettre à jour les données
            managedCeremony.data.brideName = brideName;
            managedCeremony.data.groomName = groomName;
            managedCeremony.data.weddingDate = weddingDate;
            managedCeremony.supplies = supplies;
            managedCeremony.drinks = drinks;
            managedCeremony.gifts = gifts;
            managedCeremony.organizers = managedCeremony.organizers || [];

            // Sauvegarder dans localStorage
            localStorage.setItem('managedCeremonies', JSON.stringify(managedCeremonies));

            const ceremony = ceremonies.find(c => c.id == currentCeremonyId);
            if (ceremony) {
                if (!ceremony.data) ceremony.data = {};
                ceremony.data.brideName = brideName;
                ceremony.data.groomName = groomName;
                ceremony.data.weddingDate = weddingDate;
                ceremony.data.startDateTime = weddingDate;
                ceremony.data.organizers = managedCeremony.organizers;
                localStorage.setItem('ceremonies', JSON.stringify(ceremonies));
            }

            debouncedRenderCeremoniesList();

            qrPersist({
                successTitle: 'Gestion enregistrée',
                successMessage: 'Les détails de la cérémonie ont été sauvegardés dans la base de données.',
                afterSuccess: function () {
                    resetCeremonyManagementForm();
                    closeCeremonyForm();
                },
            });
        }

        function renderGiftTypes(gifts = []) {
            const container = document.getElementById('giftTypesContainer');
            if (!container) return;
            container.innerHTML = '';

            if (gifts.length === 0) return;

            gifts.forEach(gift => {
                addGiftTypeRow(gift.type || '', gift.from || '', gift.date || '');
            });
        }

        function renderCustomSupplies(customSupplies = []) {
            const container = document.getElementById('customSuppliesContainer');
            if (!container) return;
            container.innerHTML = '';

            if (customSupplies.length === 0) return;

            customSupplies.forEach(item => {
                addCustomSupplyRow(item.name || '', item.quantity || 0);
            });
        }

        function addCustomSupplyRow(name = '', quantity = 0) {
            const container = document.getElementById('customSuppliesContainer');
            if (!container) return;

            const row = document.createElement('div');
            row.className = 'custom-supply-row';
            row.style.display = 'grid';
            row.style.gridTemplateColumns = '2fr 1fr auto';
            row.style.gap = '12px';
            row.style.alignItems = 'center';
            row.style.background = '#f8fafc';
            row.style.padding = '12px';
            row.style.borderRadius = '10px';
            row.style.border = '1px solid #d1d5db';

            row.innerHTML = `
                <input type="text" class="custom-supply-name" value="${name}" placeholder="Nom de la fourniture" style="width: 100%; padding: 12px 14px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                <input type="number" class="custom-supply-count" value="${quantity}" min="0" placeholder="Qté" style="width: 100%; padding: 12px 14px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                <button type="button" onclick="removeCustomSupplyRow(this)" class="btn btn-danger btn-small" style="padding: 10px 14px;">✕</button>
            `;

            container.appendChild(row);
        }

        function removeCustomSupplyRow(button) {
            const row = button.closest('.custom-supply-row');
            if (row) {
                row.remove();
            }
        }

        function addGiftTypeRow(type = '', from = '', date = '') {
            const container = document.getElementById('giftTypesContainer');
            if (!container) return;

            const index = Date.now() + Math.random();
            const row = document.createElement('div');
            row.className = 'gift-type-row';
            row.style.display = 'grid';
            row.style.gridTemplateColumns = '1fr 1fr 1fr auto';
            row.style.gap = '12px';
            row.style.alignItems = 'center';
            row.style.background = '#f8fafc';
            row.style.padding = '12px';
            row.style.borderRadius = '10px';
            row.style.border = '1px solid #d1d5db';

            row.innerHTML = `
                <input type="text" class="gift-type-desc" value="${type}" placeholder="Type de cadeau (ex: Fleurs, Argent...)" style="width: 100%; padding: 12px 14px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                <input type="text" class="gift-type-from" value="${from}" placeholder="Offert par (nom de l'invité)" style="width: 100%; padding: 12px 14px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                <input type="date" class="gift-type-date" value="${date}" style="width: 100%; padding: 12px 14px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                <button type="button" onclick="removeGiftTypeRow(this)" class="btn btn-danger btn-small" style="padding: 10px 14px;">✕</button>
            `;

            container.appendChild(row);
        }

        function removeGiftTypeRow(button) {
            const row = button.closest('.gift-type-row');
            if (row) {
                row.remove();
            }
        }

        function renderDrinkCategoryCards(drinks = []) {
            const container = document.getElementById('drinkCategoryCards');
            if (!container) return;
            container.innerHTML = '';
            const categories = ['Eau', 'Bière', 'Champagne', 'Canette', 'Liqueur', 'Personnalisé'];
            const icons = {
                'Eau': '💧',
                'Bière': '🍺',
                'Champagne': '🥂',
                'Canette': '🥤',
                'Liqueur': '🥃',
                'Personnalisé': '✍️'
            };

            if (!Array.isArray(drinks)) {
                if (Array.isArray(drinks.items)) {
                    drinks = drinks.items;
                } else if (Array.isArray(drinks.types)) {
                    drinks = drinks.types;
                } else if (drinks && typeof drinks === 'object') {
                    drinks = Object.entries(drinks).map(([category, value]) => ({ category, type: '', count: parseInt(value) || 0 }));
                } else {
                    drinks = [];
                }
            }

            const counts = categories.reduce((acc, category) => {
                acc[category] = 0;
                return acc;
            }, {});

            drinks.forEach(drink => {
                const category = drink.category || 'Personnalisé';
                counts[category] = (counts[category] || 0) + (parseInt(drink.count) || 0);
            });

            categories.forEach(category => {
                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'drink-category-card';
                card.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 16px; border-radius: 16px; border: 1px solid #d1d5db; background: #f8fafc; color: #1f2937; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; text-align: left;';
                card.onmouseover = () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 6px 18px rgba(15, 23, 42, 0.12)'; };
                card.onmouseout = () => { card.style.transform = ''; card.style.boxShadow = ''; };
                card.onclick = () => {
                    addDrinkTypeRow(category, '', 0);
                };
                const summary = counts[category] > 0 ? `${counts[category]} bouteille${counts[category] > 1 ? 's' : ''}` : 'Ajouter une boisson';
                card.innerHTML = `<div style="font-size: 24px;">${icons[category] || '🍹'}</div><div style="font-weight: 700;">${category}</div><div style="font-size: 12px; color: #6b7280;">${summary}</div>`;
                container.appendChild(card);
            });
        }

        function renderDrinkTypes(drinks = {}) {
            const container = document.getElementById('drinkTypesContainer');
            if (!container) return;
            container.innerHTML = '';

            let drinkRows = [];
            if (Array.isArray(drinks.items) && drinks.items.length) {
                drinkRows = drinks.items;
            } else if (Array.isArray(drinks) && drinks.length) {
                drinkRows = drinks;
            } else if (drinks && typeof drinks === 'object') {
                drinkRows = Object.entries(drinks).map(([key, value]) => {
                    if (Array.isArray(value)) {
                        return value;
                    }
                    return { category: key, type: '', count: parseInt(value) || 0 };
                }).flat();
            }

            if (drinkRows.length === 0) {
                drinkRows = [{ category: 'Eau', type: '', count: 0 }];
            }

            drinkRows.forEach(row => addDrinkTypeRow(row.category || 'Eau', row.type || '', row.count || 0));
        }

        function addDrinkTypeRow(category = 'Eau', type = '', count = 0) {
            const container = document.getElementById('drinkTypesContainer');
            if (!container) return;

            const row = document.createElement('div');
            row.className = 'drink-type-row';
            row.style.display = 'grid';
            row.style.gridTemplateColumns = '1fr 1.5fr 0.8fr auto';
            row.style.gap = '12px';
            row.style.alignItems = 'center';
            row.style.background = '#f8fafc';
            row.style.padding = '12px';
            row.style.borderRadius = '10px';
            row.style.border = '1px solid #d1d5db';

            // Créer les options de la catégorie
            const categoryOptions = Object.keys(drinkCategories).map(cat => 
                `<option value="${cat}" ${cat === category ? 'selected' : ''}>${cat}</option>`
            ).join('');

            // Toujours utiliser un champ texte pour saisir le nom exact de la boisson
            const typeField = `<input type="text" class="drink-type" placeholder="Entrez le nom de la boisson" value="${type}" style="width: 100%; padding: 12px 14px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white;">`;

            row.innerHTML = `
                <select class="drink-category" style="width: 100%; padding: 12px 14px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; cursor: pointer;" onchange="updateDrinkTypes(this)">
                    ${categoryOptions}
                </select>
                ${typeField}
                <input type="number" class="drink-count" value="${count}" min="0" placeholder="Qté" style="width: 100%; padding: 12px 14px; border: 2px solid #d1d5db; border-radius: 8px; font-size: 14px;">
                <button type="button" onclick="removeDrinkTypeRow(this)" class="btn btn-danger btn-small" style="padding: 10px 14px;">✕</button>
            `;

            container.appendChild(row);
        }

        function updateDrinkTypes(selectElement) {
            // Le type reste un champ texte personnalisé. Aucun champ supplémentaire n'est nécessaire ici.
            return;
        }

        function removeDrinkTypeRow(button) {
            const row = button.closest('.drink-type-row');
            if (row) {
                row.remove();
            }
        }

        // Afficher les cadeaux de la cérémonie actuelle
        function renderCeremonyGifts() {
            const giftsList = document.getElementById('ceremonyGiftsList');
            if (!giftsList || !currentCeremonyId) return;

            const managedCeremony = managedCeremonies.find(mc => mc.id == currentCeremonyId);
            const gifts = managedCeremony?.gifts || [];

            if (gifts.length === 0) {
                giftsList.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 20px;">Aucun cadeau enregistré</div>';
                return;
            }

            giftsList.innerHTML = gifts.map((gift, index) => `
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${gift.type}</div>
                        <div style="font-size: 12px; color: #6b7280;">Offert par: ${gift.from} • ${new Date(gift.date).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <button onclick="removeGiftFromCeremony(${index})" class="btn btn-danger btn-small" style="padding: 4px 8px; font-size: 12px;">✕</button>
                </div>
            `).join('');
        }

        // Ajouter un cadeau à la cérémonie actuelle
        function addGiftToCurrentCeremony() {
            if (!currentCeremonyId) return;

            const giftType = document.getElementById('giftTypeInput').value.trim();
            const giftFrom = document.getElementById('giftFromInput').value.trim();
            const giftDate = document.getElementById('giftDateInput').value;

            if (!giftType || !giftFrom || !giftDate) {
                alert('Veuillez remplir tous les champs du cadeau');
                return;
            }

            let managedCeremony = managedCeremonies.find(mc => mc.id == currentCeremonyId);
            if (!managedCeremony) {
                const ceremony = ceremonies.find(c => c.id == currentCeremonyId);
                managedCeremony = {
                    id: currentCeremonyId,
                    name: ceremony?.name || 'Cérémonie',
                    data: ceremony?.data || {},
                    guests: ceremony?.guests || [],
                    supplies: {},
                    drinks: {},
                    gifts: []
                };
                managedCeremonies.push(managedCeremony);
            }

            if (!managedCeremony.gifts) managedCeremony.gifts = [];

            managedCeremony.gifts.push({
                type: giftType,
                from: giftFrom,
                date: giftDate
            });

            localStorage.setItem('managedCeremonies', JSON.stringify(managedCeremonies));

            // Vider les champs
            document.getElementById('giftTypeInput').value = '';
            document.getElementById('giftFromInput').value = '';
            document.getElementById('giftDateInput').value = '';

            // Rafraîchir l'affichage
            renderCeremonyGifts();
        }

        // Supprimer un cadeau
        function removeGiftFromCeremony(giftIndex) {
            if (!currentCeremonyId) return;

            const managedCeremony = managedCeremonies.find(mc => mc.id == currentCeremonyId);
            if (managedCeremony && managedCeremony.gifts) {
                managedCeremony.gifts.splice(giftIndex, 1);
                localStorage.setItem('managedCeremonies', JSON.stringify(managedCeremonies));
                renderCeremonyGifts();
            }
        }

        // Initialiser la liste des cérémonies au chargement de la page
        // Ajouter wrappers débouncés pour opérations lourdes
        const debouncedRenderCeremoniesList = debounce(() => { if (typeof renderCeremoniesList === 'function') renderCeremoniesList(); }, 120);
        const debouncedUpdateDashboard = debounce(() => { if (typeof updateDashboard === 'function') updateDashboard(); }, 150, true);
        const debouncedRenderGuestsTable = debounce(() => { if (typeof renderGuestsTable === 'function') renderGuestsTable(); }, 120);
        const debouncedUpdateCeremonyReport = debounce(() => { if (typeof updateCeremonyReport === 'function') updateCeremonyReport(); }, 200);

        document.addEventListener('DOMContentLoaded', function() {
            // ... existing code ...

            // Initialiser la liste des cérémonies quand on ouvre l'onglet gestion
            const gestionTab = document.getElementById('gestionceremonies');
            if (gestionTab) {
                // Attendre que l'onglet soit visible pour initialiser
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                            const display = window.getComputedStyle(gestionTab).display;
                            if (display !== 'none') {
                                debouncedRenderCeremoniesList();
                            }
                        }
                    });
                });
                observer.observe(gestionTab, { attributes: true, attributeFilter: ['style'] });
            }
        });

        // Rafraîchir la liste quand on revient à l'onglet
        function refreshCeremoniesList() {
            debouncedRenderCeremoniesList();
        }