    <!-- Rapport journalier -->
    <div id="reportModal" class="modal">
        <div class="modal-content modal-content-large">
            <div class="modal-header">
                <h2 class="modal-title"><i class="fa-solid fa-chart-pie"></i> Bilan journalier</h2>
                <button type="button" class="modal-close" onclick="closeReportModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div id="reportContent" style="max-height: 70vh; overflow-y: auto;"></div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-secondary" onclick="closeReportModal()">Fermer</button>
                <button type="button" class="btn btn-primary btn-icon" onclick="downloadReport()">
                    <i class="fa-solid fa-download"></i> Télécharger
                </button>
            </div>
        </div>
    </div>

    <!-- Modal pour afficher les détails des rendez-vous et cérémonies -->
    <div id="detailsListModal" class="modal">
        <div class="modal-content modal-content-large">
            <div class="modal-header">
                <h2 class="modal-title" id="detailsListTitle">Détails</h2>
                <button type="button" class="modal-close" onclick="closeDetailsListModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div id="detailsListContent" style="max-height: 70vh; overflow-y: auto;">
                <!-- Les détails seront remplis par JavaScript -->
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="closeDetailsListModal()">Fermer</button>
            </div>
        </div>
    </div>

    <!-- Modal A propos -->
    <div id="aboutModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title"><i class="fa-solid fa-circle-info"></i> À propos</h2>
                <button type="button" class="modal-close" onclick="closeAboutModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="about-modal-body">
                <div class="about-avatar"><i class="fa-solid fa-user"></i></div>
                <div class="about-name">BUYBUY UWASE Benit</div>
                <span class="about-tag">QR-Access Solutions</span>
                <a href="mailto:qraccess@gmail.com" class="about-tag" style="text-decoration:none;">qraccess@gmail.com</a>
                <p style="font-size: 14px; color: var(--text-muted); margin: 20px 0; line-height: 1.6;">
                    QR-Access propose des solutions innovantes pour la gestion d'accès, la génération et la vérification de QR codes pour événements, entreprises et organisations.
                </p>
                <span class="about-tag">© 2026 QR-Access Manager</span>
                <div class="about-contact-links">
                    <span><i class="fa-solid fa-phone"></i> +243 991 048 061</span>
                    <span><i class="fa-solid fa-phone"></i> +243 901 869 926</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Sélection des Cérémonies pour Rapport -->
    <div id="ceremonySelectionModal" class="modal">
        <div class="modal-content modal-content-large">
            <div class="modal-header">
                <h2 class="modal-title"><i class="fa-solid fa-magnifying-glass"></i> Rechercher rapport par cérémonie</h2>
                <button type="button" class="modal-close" onclick="closeCeremonySelectionModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div style="padding: 20px; max-height: 70vh; overflow-y: auto;">
                <div style="margin-bottom: 20px;">
                    <input type="text" id="ceremonySearchInput" placeholder="Rechercher une cérémonie…" style="width: 100%;" onkeyup="filterCeremoniesSelection()">
                </div>
                <div id="ceremonySelectionList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                    <!-- Les cérémonies seront insérées ici -->
                </div>
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end; padding: 20px; border-top: 1px solid #e5e7eb;">
                <button class="btn btn-secondary" onclick="closeCeremonySelectionModal()">Fermer</button>
            </div>
        </div>
    </div>

    <!-- Modal Rapport Détaillé de Cérémonie -->
    <div id="ceremonyDetailedReportModal" class="modal">
        <div class="modal-content modal-content-large">
            <div class="modal-header">
                <h2 class="modal-title" id="detailedReportTitle"><i class="fa-solid fa-chart-line"></i> Rapport détaillé</h2>
                <button type="button" class="modal-close" onclick="closeCeremonyDetailedReportModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div id="ceremonyDetailedReportContent" style="padding: 20px; max-height: 70vh; overflow-y: auto;">
                <!-- Rapport détaillé sera inséré ici -->
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end; padding: 20px; border-top: 1px solid #e5e7eb;">
                <button class="btn btn-secondary" onclick="closeCeremonyDetailedReportModal()">Fermer</button>
                <button type="button" class="btn btn-primary btn-icon" onclick="downloadCeremonyDetailedReport()">
                    <i class="fa-solid fa-download"></i> Télécharger
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Détails de la Cérémonie -->
    <div id="ceremonyDetailsModal" class="modal">
        <div class="modal-content modal-content-large" style="max-width: 900px;">
            <div class="modal-header">
                <div style="flex: 1;">
                    <h2 class="modal-title" id="ceremonyDetailsTitle">Détails de la Cérémonie</h2>
                    <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
                        <input type="text" id="ceremonyNameInput" placeholder="Nom de la cérémonie" style="flex: 1; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; font-weight: 600;">
                        <button class="btn btn-success btn-small" onclick="updateCeremonyName()" title="Sauvegarder le nom">✓</button>
                    </div>
                </div>
                <button type="button" class="modal-close" onclick="closeCeremonyDetailsModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; max-height: 60vh; overflow-y: auto;">
                <!-- Colonne Gauche: Informations de la Cérémonie -->
                <div style="border-right: 1px solid #e5e7eb; padding-right: 20px;">
                    <h3 style="color: var(--primary); margin-top: 0; margin-bottom: 15px;">📋 Informations de la Cérémonie</h3>
                    
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="margin-bottom: 12px;">
                            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Type</span>
                            <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600;" id="detailType">-</p>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Lieu</span>
                            <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600;" id="detailLocation">-</p>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Date & Heure</span>
                            <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600;" id="detailDate">-</p>
                        </div>
                        <div>
                            <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Responsable</span>
                            <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600;" id="detailContactPerson">-</p>
                        </div>
                    </div>

                    <div id="detailFamiliesSection" style="display: none; margin-bottom: 15px;">
                        <h4 style="color: #0ea5e9; margin-bottom: 10px;">👨👩👧👦 Familles</h4>
                        <div style="background: linear-gradient(135deg, #ffd6e8 0%, #ffb3d9 100%); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                            <span style="font-size: 12px; color: #666; display: block;">Famille 1</span>
                            <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 600;" id="detailFamily1">-</p>
                        </div>
                        <div id="detailFamily2Container" style="display: none; background: linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%); padding: 12px; border-radius: 8px;">
                            <span style="font-size: 12px; color: #666; display: block;">Famille 2</span>
                            <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 600;" id="detailFamily2">-</p>
                        </div>
                    </div>
                    <div id="detailWeddingSection" style="display: none; margin-bottom: 15px;">
                        <h4 style="color: #f43f5e; margin-bottom: 10px;">💕 Détails du Mariage</h4>
                        <div style="background: #fff5e6; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                            <span style="font-size: 12px; color: #666; display: block;">👰 La Mariée</span>
                            <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 600;" id="detailBrideName">-</p>
                        </div>
                        <div style="background: #e8f5ff; padding: 12px; border-radius: 8px;">
                            <span style="font-size: 12px; color: #666; display: block;">🤵 Le Marié</span>
                            <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 600;" id="detailGroomName">-</p>
                        </div>
                    </div>

                    <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; border-left: 4px solid var(--success);">
                        <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Programme</span>
                        <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.6; color: #1f2937;" id="detailProgram">-</p>
                    </div>
                </div>

                <!-- Colonne Droite: Gestion des Invités -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="color: var(--accent); margin: 0;">👥 Invités (<span id="guestCount">0</span>)</h3>
                        <button class="btn btn-success btn-small" onclick="openAddGuestFromDetails()">➕ Ajouter</button>
                    </div>
                    
                    <div id="detailGuestsContainer" style="max-height: 400px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; background: #fafafa;">
                        <div style="text-align: center; padding: 30px; color: #64748b;">
                            Aucun invité
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                        <button id="toggleGuestListBtn" class="btn btn-secondary btn-small" onclick="toggleGuestList()" style="display: none;">Déplier</button>
                    </div>
                </div>
            </div>

            <div style="padding: 20px; border-top: 1px solid #e5e7eb; display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="closeCeremonyDetailsModal()">Fermer</button>
                <button type="button" class="btn btn-primary btn-icon" onclick="downloadCeremonyDetails()">
                    <i class="fa-solid fa-download"></i> Télécharger
                </button>
            </div>
        </div>
    </div>

    <!-- Modal QR Code Invité -->
    <div id="guestQRModal" class="modal">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2 class="modal-title" id="guestQRTitle">Code QR Invité</h2>
                <button type="button" class="modal-close" onclick="closeGuestQRModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            
            <div style="padding: 30px; text-align: center;">
                <!-- Code QR -->
                <div style="background: white; padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
                    <div id="guestQRCodeContainer"></div>
                </div>
                
                <!-- Code Rapide -->
                <div style="background: linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%); padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 2px solid #818cf8;">
                    <p style="margin: 0 0 10px 0; color: #6366f1; font-size: 12px; text-transform: uppercase; font-weight: 700;">⚡ Code Rapide</p>
                    <p style="margin: 0; font-size: 28px; font-weight: 900; color: #3730a3; letter-spacing: 4px;" id="guestQuickCodeDisplay">-</p>
                </div>
                
                <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
                    <p style="margin: 0 0 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Invité</p>
                    <p style="margin: 0 0 10px 0; font-weight: 600; font-size: 16px;" id="guestQRName">-</p>
                    
                    <p style="margin: 0 0 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Cérémonie</p>
                    <p style="margin: 0 0 10px 0; font-weight: 600; font-size: 14px;" id="guestQRCeremony">-</p>
                    
                    <p style="margin: 0 0 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Place Attitrée</p>
                    <p style="margin: 0 0 10px 0; font-weight: 600; font-size: 14px;" id="guestQRSeat">-</p>
                    
                    <p style="margin: 0 0 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Nombre de Personnes</p>
                    <p style="margin: 0; font-weight: 600; font-size: 14px;" id="guestQRCount">-</p>
                </div>

                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn btn-secondary" onclick="closeGuestQRModal()">Fermer</button>
                    <button type="button" class="btn btn-primary btn-icon" onclick="downloadGuestQR()">
                        <i class="fa-solid fa-download"></i> Télécharger
                    </button>
                    <button class="btn btn-success" onclick="printGuestQR()">🖨️ Imprimer</button>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal Inscription -->
    <div id="signupModal" class="modal" style="display:none;">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">📝 S'inscrire</h2>
                <button type="button" class="modal-close" onclick="closeSignUpModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div style="padding:16px;">
                <form id="signupForm" onsubmit="handleSignUp(event)">
                    <label for="signupEmail">Email</label>
                    <input id="signupEmail" type="email" required style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border);border-radius:6px;">
                    <label for="signupPassword">Mot de passe</label>
                    <input id="signupPassword" type="password" required style="width:100%;padding:8px;margin:8px 0;border:1px solid var(--border);border-radius:6px;">
                    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
                        <button type="button" class="btn btn-secondary" onclick="closeSignUpModal()">Annuler</button>
                        <button type="submit" class="btn btn-primary">S'inscrire</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Scanner QR global (accessible depuis toute l'application) -->
    <div id="globalQrScannerModal" class="global-qr-scanner-modal" aria-hidden="true" role="dialog" aria-label="Scanner QR">
        <div class="global-qr-scanner-backdrop" onclick="closeGlobalQrScanner()"></div>
        <div class="global-qr-scanner-sheet">
            <div class="global-qr-scanner-header">
                <h3><i class="fa-solid fa-qrcode"></i> Scanner une invitation</h3>
                <button type="button" class="modal-close" onclick="closeGlobalQrScanner()" aria-label="Fermer">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="global-qr-scanner-viewport">
                <video id="globalScanVideo" autoplay playsinline muted></video>
                <canvas id="globalScanCanvas" style="display:none;"></canvas>
                <div class="global-qr-scan-frame" aria-hidden="true"></div>
            </div>
            <p id="globalScanStatus" class="global-qr-scanner-status">Initialisation de la caméra…</p>
            <p class="global-qr-scanner-hint">Placez le QR code dans le cadre — détection automatique</p>
        </div>
    </div>

    <!-- Popup résultat après scan -->
    <div id="qrScanResultPopup" class="qr-scan-popup" aria-hidden="true" role="dialog" aria-label="Résultat du scan">
        <div class="qr-scan-popup-backdrop" onclick="closeQrScanPopup()"></div>
        <div class="qr-scan-popup-card">
            <button type="button" class="qr-scan-popup-close" onclick="closeQrScanPopup()" aria-label="Fermer">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div id="qrScanPopupContent"></div>
            <div class="qr-scan-popup-actions">
                <button type="button" class="btn btn-secondary btn-small" onclick="closeQrScanPopup()">Fermer</button>
                <button type="button" class="btn btn-primary btn-small" onclick="goToVerifyFromPopup()">
                    <i class="fa-solid fa-clipboard-check"></i> Détails complets
                </button>
            </div>
        </div>
    </div>
