<div class="app-layout">
        @include('partials.sidebar', ['activeTab' => $activeTab ?? 'dashboard'])
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar(false)"></div>
        <main class="main-wrapper">
            <div class="mobile-topbar">
                <button type="button" class="sidebar-toggle" onclick="toggleSidebar()" aria-label="Menu">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <span class="mobile-title">QR Access Manager</span>
            </div>
            <div class="container">
        @php($active = $activeTab ?? 'dashboard')
        <!-- Tableau de bord -->
        <div id="dashboard" class="tab-content{{ $active === 'dashboard' ? ' active' : '' }}"@if($active === 'dashboard') style="display:block"@endif>
            <div class="page-header">
                <div>
                    <h1 class="page-title">Tableau de bord</h1>
                    <p class="page-subtitle">Vue d'ensemble de vos invitations et cérémonies</p>
                </div>
                <button type="button" class="btn-report" onclick="showDailyReport()">
                    <i class="fa-solid fa-chart-pie"></i>
                    Bilan journalier
                </button>
            </div>

            <div class="stats-grid" id="statsGrid">
                <div class="stat-box stat-box--blue">
                    <div class="stat-icon"><i class="fa-solid fa-user-check"></i></div>
                    <div class="stat-content">
                        <div class="stat-label">Rendez-vous actifs</div>
                        <div class="stat-value" id="activeCount">0</div>
                    </div>
                </div>
                <div class="stat-box stat-box--slate">
                    <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
                    <div class="stat-content">
                        <div class="stat-label">Total créés</div>
                        <div class="stat-value" id="totalCount">0</div>
                    </div>
                </div>
                <div class="stat-box stat-box--amber">
                    <div class="stat-icon"><i class="fa-solid fa-hourglass-half"></i></div>
                    <div class="stat-content">
                        <div class="stat-label">Expirations proches</div>
                        <div class="stat-value" id="expiringCount">0</div>
                    </div>
                </div>
                <div class="stat-box stat-box--teal" onclick="showDetailsList('ceremony')">
                    <div class="stat-icon"><i class="fa-solid fa-champagne-glasses"></i></div>
                    <div class="stat-content">
                        <div class="stat-label">Cérémonies actives</div>
                        <div class="stat-value" id="ceremonyCount">0</div>
                    </div>
                </div>
            </div>

            <div class="main-content">
                <div class="card">
                    <div class="card-header">
                        <h2><i class="fa-solid fa-circle-check"></i> Rendez-vous actifs</h2>
                        <span class="card-badge" id="activeBadge">0 actifs</span>
                    </div>
                    <div class="visitors-grid" id="visitorsActive"></div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2><i class="fa-solid fa-triangle-exclamation"></i> Alertes et expirations</h2>
                        <span class="card-badge" id="expiringBadge">0 alertes</span>
                    </div>
                    <div class="visitors-grid" id="visitorsExpiring"></div>
                </div>
            </div>
        </div>

        <!-- Creer un onglet -->
        <!-- Cérémonie Multi -->
        <div id="ceremonie" class="tab-content{{ $active === 'ceremonie' ? ' active' : '' }}"@if($active === 'ceremonie') style="display:block"@endif>
            <div class="page-header">
                <div>
                    <h1 class="page-title">Ajouter une cérémonie</h1>
                    <p class="page-subtitle">Créez vos événements et gérez les listes d'invités</p>
                </div>
                <button type="button" class="btn btn-success btn-icon btn-small" onclick="addNewCeremony()" title="Nouvelle cérémonie">
                    <i class="fa-solid fa-plus"></i> Nouvelle cérémonie
                </button>
            </div>

            <div class="ceremony-layout">
                <div class="card">
                    <div class="card-header">
                        <h2><i class="fa-solid fa-layer-group"></i> Mes cérémonies</h2>
                        <span class="card-badge" id="ceremoniesCount">1 cérémonie</span>
                    </div>
                    <div class="ceremony-tabs-bar">
                        <div id="ceremonyTabsContainer"></div>
                    </div>
                </div>

                <div class="card" id="activeCeremonyCard">
                    <div id="ceremonyInfoSection">
                        <div class="ceremony-section-header">
                            <h3 class="ceremony-section-title"><i class="fa-solid fa-circle-info"></i> Informations de la cérémonie</h3>
                            <button type="button" class="btn btn-secondary btn-icon btn-small" onclick="showCeremonyForm()" id="showCeremonyFormBtn">
                                <i class="fa-solid fa-pen-to-square"></i> Éditer
                            </button>
                        </div>

                        <div class="ceremony-name-field">
                            <label for="ceremonyNameDisplay">Nom de la cérémonie</label>
                            <input type="text" id="ceremonyNameDisplay" placeholder="Entrez le nom de la cérémonie">
                        </div>

                        <div id="ceremonyInfoDisplay" class="info-tiles-grid">
                            <div class="info-tile info-tile--type">
                                <div class="info-tile-label"><i class="fa-solid fa-masks-theater"></i> Type</div>
                                <div class="info-tile-value" id="infoCerType">-</div>
                            </div>
                            <div class="info-tile info-tile--location">
                                <div class="info-tile-label"><i class="fa-solid fa-location-dot"></i> Lieu</div>
                                <div class="info-tile-value" id="infoCerLocation">-</div>
                            </div>
                            <div class="info-tile info-tile--time">
                                <div class="info-tile-label"><i class="fa-solid fa-clock"></i> Horaire</div>
                                <div class="info-tile-value" id="infoCerDateTime">-</div>
                            </div>
                            <div class="info-tile info-tile--church" id="infoCerChurchCard" style="display: none;">
                                <div class="info-tile-label"><i class="fa-solid fa-church"></i> Église</div>
                                <div class="info-tile-value" id="infoCerEglise">-</div>
                            </div>
                            <div class="info-tile info-tile--commune" id="infoCerCommuneCard" style="display: none;">
                                <div class="info-tile-label"><i class="fa-solid fa-house"></i> Commune</div>
                                <div class="info-tile-value" id="infoCerCommune">-</div>
                            </div>
                            <div class="info-tile info-tile--photo" id="infoCerPhotoCard" style="display: none;">
                                <div class="info-tile-label"><i class="fa-solid fa-camera"></i> Prise de vue</div>
                                <div class="info-tile-value" id="infoCerPhotographe">-</div>
                            </div>
                            <div class="info-tile info-tile--reception" id="infoCerReceptionCard" style="display: none;">
                                <div class="info-tile-label"><i class="fa-solid fa-utensils"></i> Réception</div>
                                <div class="info-tile-value" id="infoCerReception">-</div>
                            </div>
                        </div>

                        <div id="ceremonyDetailsInfo" class="ceremony-details-box">
                            <div class="detail-block">
                                <div class="detail-block-label"><i class="fa-solid fa-book-open"></i> Programme</div>
                                <p id="infoCerProgram">-</p>
                            </div>
                            <div id="ceremonyWeddingInfo" style="display: none; padding-top: 16px; border-top: 1px solid var(--border);">
                                <div class="detail-block-label"><i class="fa-solid fa-heart"></i> Détails du mariage</div>
                                <div class="wedding-details-grid">
                                    <div class="wedding-detail-card">
                                        <div class="label"><i class="fa-solid fa-person-dress"></i> Mariée</div>
                                        <div class="value" id="infoCerBrideName">-</div>
                                    </div>
                                    <div class="wedding-detail-card">
                                        <div class="label"><i class="fa-solid fa-person"></i> Marié</div>
                                        <div class="value" id="infoCerGroomName">-</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="ceremonyFormContainer" class="ceremony-form-panel" style="display: none;">
                        <form id="createCeremonyForm" onsubmit="createCeremony(event)">

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
                                <div class="form-group">
                                    <label for="cerName">Nom de la Cérémonie</label>
                                    <input type="text" id="cerName" required placeholder="Ex: Mariage de Jean & Marie" style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>

                                <div class="form-group">
                                    <label for="cerType">Type</label>
                                    <select id="cerType" required style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                        <option value="">-- Sélectionner --</option>
                                        <option value="Mariage">Mariage</option>
                                        <option value="Anniversaire">Anniversaire</option>
                                        <option value="Dote">Dote</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="cerLieu">Lieu (Nom)</label>
                                    <input type="text" id="cerLieu" required placeholder="Ex: Salle des Fêtes" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>

                                <div class="form-group">
                                    <label for="cerAddress">Adresse</label>
                                    <input type="text" id="cerAddress" placeholder="Adresse complète (rue, n°)" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>

                                <div class="form-group">
                                    <label for="cerCommune">Commune / Ville</label>
                                    <input type="text" id="cerCommune" placeholder="Ex: Kinshasa" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>

                                <div class="form-group">
                                    <label for="cerCapacity">Capacité (personnes)</label>
                                    <input type="number" id="cerCapacity" min="1" value="100" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>
                            </div>

                            <hr style="margin: 18px 0; border: none; border-top: 1px solid #eef2ff;">

                            <!-- Preview rapide des mariés / familles (utilisé par le script) -->
                            <div id="displayMariesDiv" style="display:none; margin-bottom:12px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                    <div style="background:#fff; padding:10px; border-radius:8px; border:1px solid #f0f4ff; text-align:center;">
                                        <div style="font-size:12px; color:#6b21a8; font-weight:700;">👰 Mariée</div>
                                        <div id="displayBrideName" style="font-weight:700; color:#111827;">-</div>
                                    </div>
                                    <div style="background:#fff; padding:10px; border-radius:8px; border:1px solid #f0f4ff; text-align:center;">
                                        <div style="font-size:12px; color:#0ea5e9; font-weight:700;">🤵 Marié</div>
                                        <div id="displayGroomName" style="font-weight:700; color:#111827;">-</div>
                                    </div>
                                </div>
                            </div>

                            <div id="displayFamiliesDiv" style="display:none; margin-bottom:12px;">
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                                    <div style="background:#fff; padding:10px; border-radius:8px; border:1px solid #f0f4ff;">
                                        <div style="font-size:12px; color:#0c4a6e; font-weight:700;">Famille 1</div>
                                        <div id="displayFamily1" style="font-weight:700; color:#111827;">-</div>
                                    </div>
                                    <div style="background:#fff; padding:10px; border-radius:8px; border:1px solid #f0f4ff;">
                                        <div style="font-size:12px; color:#0c4a6e; font-weight:700;">Famille 2</div>
                                        <div id="displayFamily2" style="font-weight:700; color:#111827;">-</div>
                                    </div>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
                                <div class="form-group">
                                    <label for="cerBrideName">Nom de la Mariée</label>
                                    <input type="text" id="cerBrideName" placeholder="Ex: Marie Dupont" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>

                                <div class="form-group">
                                    <label for="cerGroomName">Nom du Marié</label>
                                    <input type="text" id="cerGroomName" placeholder="Ex: Jean Martin" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>

                                <div class="form-group">
                                    <label for="cerFamily1">Famille 1</label>
                                    <input type="text" id="cerFamily1" placeholder="Nom famille / contact" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>

                                <div id="cerFamily2Group" class="form-group">
                                    <label for="cerFamily2">Famille 2</label>
                                    <input type="text" id="cerFamily2" placeholder="Nom famille / contact" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>
                            </div>

                            <hr style="margin: 18px 0; border: none; border-top: 1px solid #eef2ff;">

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
                                <div class="form-group">
                                    <label for="cerPhotographe">Photographe / Vidéo</label>
                                    <input type="text" id="cerPhotographe" placeholder="Nom / Contact" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>

                                <div class="form-group">
                                    <label for="cerReception">Lieu de la Réception</label>
                                    <input type="text" id="cerReception" placeholder="Ex: Hôtel ABC" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>

                                <div class="form-group">
                                    <label for="cerContactEmail">Email de contact</label>
                                    <input type="email" id="cerContactEmail" placeholder="contact@example.com" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>

                                <div class="form-group">
                                    <label for="cerContactPhone">Téléphone de contact</label>
                                    <input type="tel" id="cerContactPhone" placeholder="Ex: +243 991 048 061" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>

                                <div class="form-group">
                                    <label for="cerDressCode">Dress code</label>
                                    <input type="text" id="cerDressCode" placeholder="Ex: Tenue de soirée" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>
                            </div>

                            <hr style="margin: 18px 0; border: none; border-top: 1px solid #eef2ff;">

                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
                                <div class="form-group">
                                    <label for="cerStart">Date & Heure de Début</label>
                                    <input type="datetime-local" id="cerStart" required style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>

                                <div class="form-group">
                                    <label for="cerEnd">Date & Heure de Fin</label>
                                    <input type="datetime-local" id="cerEnd" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
                                </div>

                                <div class="form-group" style="grid-column: 1 / -1;">
                                    <label for="cerNotes">Notes / Informations supplémentaires</label>
                                    <textarea id="cerNotes" placeholder="Notes pour l'équipe (accès, instructions)" style="width:100%; min-height: 90px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;"></textarea>
                                </div>
                            </div>

                            <div class="ceremony-form-actions">
                                <button type="button" class="btn btn-primary btn-icon btn-small" onclick="saveCeremonyDataWithNotify()">
                                    <i class="fa-solid fa-floppy-disk"></i> Enregistrer
                                </button>
                                <button type="button" class="btn btn-secondary btn-icon btn-small" onclick="hideCeremonyForm()" style="margin-left: auto;">
                                    <i class="fa-solid fa-eye-slash"></i> Masquer le formulaire
                                </button>
                                <span class="ceremony-form-hint">Les champs obligatoires sont marqués</span>
                            </div>
                        </form>
                    </div>

                    <div id="guestsSection">
                        <div class="guests-section-header">
                            <div>
                                <h3 class="ceremony-section-title"><i class="fa-solid fa-users"></i> Invités de la cérémonie</h3>
                                <p class="guests-section-meta">
                                    Total : <strong id="totalGuestCount">0</strong> invité(s) ·
                                    <strong id="totalPersonCount">0</strong> personne(s)
                                </p>
                            </div>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button id="toggleGuestsSectionBtn" type="button" class="btn btn-secondary btn-icon btn-small" onclick="toggleGuestsSection()">
                                    <i class="fa-solid fa-chevron-up"></i><span>Plier la liste</span>
                                </button>
                                <button id="addGuestBtn" type="button" class="btn btn-success btn-icon btn-small" onclick="document.getElementById('guestFullNameSimple')?.focus()">
                                    <i class="fa-solid fa-user-plus"></i> Ajouter un invité
                                </button>
                            </div>
                        </div>
                        <div id="simpleGuestAddForm" class="guest-quick-form">
                            <h3><i class="fa-solid fa-user-plus"></i> Ajouter un invité</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="guestCountSimple">Nombre d'invités</label>
                                    <select id="guestCountSimple" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;">
                                        <option value="1">Singletons (1)</option>
                                        <option value="2">Couple (2)</option>
                                        <option value="delegation">Délégations</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="guestFullNameSimple">Nom </label>
                                    <input type="text" id="guestFullNameSimple" placeholder="Benito" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;">
                                </div>
                                <div class="form-group">
                                    <label for="guestPostNameSimple">Post-nom</label>
                                    <input type="text" id="guestPostNameSimple" placeholder="Ex: Uwase" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;">
                                </div>
                                <div class="form-group">
                                    <label for="guestHonorificSimple">Titre honorifique</label>
                                    <select id="guestHonorificSimple" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;">
                                        <option value="">-- Sélectionner --</option>
                                        <option value="M.">M.</option>
                                        <option value="Mme">Mme</option>
                                        <option value="Mlle">Mlle</option>
                                        <option value="Dr">Dr</option>
                                        <option value="Pr">Pr</option>
                                        <option value="Ing">Ing</option>
                                        <option value="Me">Me</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="guestPhoneSimple">Téléphone</label>
                                    <input type="tel" id="guestPhoneSimple" placeholder="Ex: +243 991 048 061" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;">
                                </div>
                                <div class="form-group">
                                    <label for="guestSeatSimple">Place attitrée</label>
                                    <input type="text" id="guestSeatSimple" placeholder="Ex: Table 1" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px;">
                                </div>
                            </div>
                            <div style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 10px;">
                                <button type="button" class="btn btn-secondary btn-icon btn-small" onclick="resetGuestQuickForm()">
                                    <i class="fa-solid fa-eraser"></i> Effacer
                                </button>
                                <button type="button" class="btn btn-primary btn-icon btn-small" onclick="addGuestQuick()">
                                    <i class="fa-solid fa-check"></i> Ajouter l'invité
                                </button>
                            </div>
                        </div>
                        <div id="guestsTableContainer"></div>
                    </div>

                </div>
            </div>
        </div>

        <!-- Onlglet verifier -->
        <div id="verify" class="tab-content pro-page{{ $active === 'verify' ? ' active' : '' }}"@if($active === 'verify') style="display:block"@endif>
            <div class="page-header">
                <div>
                    <h1 class="page-title">Vérifier une invitation</h1>
                    <p class="page-subtitle">Scannez ou saisissez un code QR, un code rapide ou un identifiant</p>
                </div>
            </div>

            <div class="main-content">
                <div id="verifyCard" class="card">
                    <div class="card-header">
                        <h2><i class="fa-solid fa-clipboard-check"></i> Vérification</h2>
                    </div>
                    <div class="form-group">
                        <label for="verifyCode">Code de vérification</label>
                        <div class="input-with-actions">
                            <input type="text" id="verifyCode" placeholder="QR code, code 5 chiffres ou ID">
                            <button id="pasteVerifyBtn" type="button" class="btn btn-ghost btn-small" onclick="pasteIntoVerify('verifyCode','pasteVerifyBtn', true)" title="Coller">
                                <i class="fa-solid fa-paste"></i>
                            </button>
                            <button id="startScanBtn" type="button" class="btn btn-ghost btn-small" onclick="toggleVerifyScanner()" title="Scanner">
                                <i class="fa-solid fa-camera"></i>
                            </button>
                        </div>
                    </div>
                    <button id="verifyButton" type="button" class="btn btn-success btn-icon" style="width: 100%;" onclick="verifyCode()">
                        <i class="fa-solid fa-check"></i> Vérifier
                    </button>

                    <div id="verifyScanner" class="scanner-panel" style="display:none;">
                        <video id="verifyVideo" autoplay playsinline></video>
                        <canvas id="verifyCanvas" style="display:none;"></canvas>
                        <div style="display:flex;gap:8px;align-items:center;margin-top:10px;">
                            <button type="button" class="btn btn-danger btn-icon btn-small" onclick="stopVerifyCamera()">
                                <i class="fa-solid fa-stop"></i> Arrêter
                            </button>
                            <span id="verifyCameraStatus" class="scanner-status">Caméra inactive</span>
                        </div>
                    </div>

                    <div id="verifyResult" style="margin-top: 20px; display: none;">
                        <div id="verifyContent"></div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2><i class="fa-solid fa-qrcode"></i> Scanner QR</h2>
                    </div>
                    <div class="info-panel">
                        <i class="fa-solid fa-mobile-screen"></i>
                        <p style="color: var(--text-muted); margin-bottom: 6px;">Utilisez le scanner pour automatiser la vérification</p>
                        <p style="font-size: 12px; color: var(--text-muted);">Les codes détectés seront vérifiés automatiquement</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Onglet historique -->
        <div id="history" class="tab-content pro-page{{ $active === 'history' ? ' active' : '' }}"@if($active === 'history') style="display:block"@endif>
            <div class="page-header">
                <div>
                    <h1 class="page-title">Historique des accès</h1>
                    <p class="page-subtitle">Recherchez et consultez les cérémonies et scans enregistrés</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2><i class="fa-solid fa-clock-rotate-left"></i> Journal et recherche</h2>
                </div>
                <div class="history-search-bar">
                    <input id="historySearch" type="search" placeholder="Cérémonie, invité, date, code rapide…">
                    <button id="historyClearBtn" type="button" class="btn btn-secondary btn-icon btn-small">
                        <i class="fa-solid fa-eraser"></i> Effacer
                    </button>
                </div>
                <p class="history-hint">Les données proviennent des cérémonies créées dans l'onglet Ajouter une cérémonie.</p>
                <div id="historyResults" style="margin-top: 16px;"></div>
                <div id="accessLog" style="margin-top: 24px;"></div>
            </div>
        </div>

        <!-- Gestions de cérémonies -->
        <div id="gestionceremonies" class="tab-content pro-page{{ $active === 'gestionceremonies' ? ' active' : '' }}"@if($active === 'gestionceremonies') style="display:block"@endif>
            <div class="page-header">
                <div>
                    <h1 class="page-title">Gestion des cérémonies</h1>
                    <p class="page-subtitle">Suivi complet : invités, fournitures, boissons et cadeaux</p>
                </div>
                <button type="button" onclick="addNewCeremony()" class="btn btn-success btn-icon btn-small">
                    <i class="fa-solid fa-plus"></i> Nouvelle cérémonie
                </button>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2><i class="fa-solid fa-building-columns"></i> Cérémonies disponibles</h2>
                </div>

                <div class="mgmt-toolbar">
                    <select id="ceremonySelector">
                        <option value="">— Choisir une cérémonie —</option>
                    </select>
                    <button type="button" onclick="const selected = document.getElementById('ceremonySelector').value; if (selected) openCeremonyForm(selected);" class="btn btn-secondary btn-icon btn-small">
                        <i class="fa-solid fa-folder-open"></i> Ouvrir
                    </button>
                </div>

                <div id="ceremoniesList" class="ceremonies-list-grid"></div>

                <div id="ceremonyManagementForm" class="ceremony-management-form" style="display: none;">
                    <div class="ceremony-section-header">
                        <h3 class="ceremony-section-title">
                            <i class="fa-solid fa-ring"></i>
                            <span id="ceremonyFormTitle">Gestion de la cérémonie</span>
                        </h3>
                        <button type="button" onclick="closeCeremonyForm()" class="btn btn-secondary btn-icon btn-small">
                            <i class="fa-solid fa-xmark"></i> Fermer
                        </button>
                    </div>

                    <!-- Informations des Mariés -->
                    <div class="mgmt-panel">
                        <h4><i class="fa-solid fa-heart"></i> Informations des mariés</h4>

                        <div class="form-grid">
                            <div class="form-group">
                                <label for="brideName">Nom de la mariée</label>
                                <input type="text" id="brideName" placeholder="Ex: Marie Dupont">
                            </div>
                            <div class="form-group">
                                <label for="groomName">Nom du marié</label>
                                <input type="text" id="groomName" placeholder="Ex: Jean Martin">
                            </div>
                        </div>
                        <div class="form-group" style="margin-top: 16px;">
                            <label for="weddingDate">Date du mariage</label>
                            <input type="datetime-local" id="weddingDate">
                        </div>
                    </div>

                    <!-- Comité organisateur -->
                    <div class="mgmt-panel">
                        <h4><i class="fa-solid fa-people-group"></i> Comité organisateur</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="organizerFirstName">Nom</label>
                                <input type="text" id="organizerFirstName" placeholder="Ex: Jean">
                            </div>
                            <div class="form-group">
                                <label for="organizerLastName">Post-nom</label>
                                <input type="text" id="organizerLastName" placeholder="Ex: Kabila">
                            </div>
                            <div class="form-group">
                                <label for="organizerEmail">Adresse mail</label>
                                <input type="email" id="organizerEmail" placeholder="exemple@domaine.com">
                            </div>
                            <div class="form-group">
                                <label for="organizerPhone">N° de téléphone</label>
                                <input type="tel" id="organizerPhone" placeholder="Ex: +243 991 048 061">
                            </div>
                            <div class="form-group" style="grid-column: 1 / -1;">
                                <label for="organizerService">Service rendu</label>
                                <input type="text" id="organizerService" placeholder="Ex: Logistique">
                            </div>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; flex-wrap: wrap;">
                            <button type="button" class="btn btn-secondary btn-icon btn-small" onclick="resetOrganizerForm()">
                                <i class="fa-solid fa-eraser"></i> Effacer
                            </button>
                            <button type="button" class="btn btn-primary btn-icon btn-small" onclick="addOrganizer()">
                                <i class="fa-solid fa-plus"></i> Ajouter
                            </button>
                        </div>
                        <div id="organizerListContainer" style="margin-top: 20px;"></div>
                    </div>

                    <!-- Liste totale des invités -->
                    <div class="mgmt-panel">
                        <h4><i class="fa-solid fa-list"></i> Liste totale des invités</h4>
                        <p id="guestListSummary" style="margin: 0 0 14px 0; color: #475569; font-size: 14px;">Chargement de la liste...</p>
                        <button id="toggleGuestListButton" type="button" class="btn btn-secondary btn-small" onclick="toggleTotalGuestList()" style="margin-bottom: 16px; display: none; padding: 10px 16px;">Déplier la liste des invités</button>
                        <div id="totalGuestListContainer" style="display: grid; gap: 12px;"></div>
                    </div>

                    <!-- Fournitures -->
                    <div class="mgmt-panel">
                        <h4><i class="fa-solid fa-utensils"></i> Fournitures utilisées</h4>

                        <div class="form-grid">
                            <div class="form-group">
                                <label for="suppliesPlates">Plats</label>
                                <input type="number" id="suppliesPlates" min="0" placeholder="0">
                            </div>
                            <div class="form-group">
                                <label for="suppliesForks">Fourchettes</label>
                                <input type="number" id="suppliesForks" min="0" placeholder="0">
                            </div>
                            <div class="form-group">
                                <label for="suppliesGlasses">Verres</label>
                                <input type="number" id="suppliesGlasses" min="0" placeholder="0">
                            </div>
                        </div>

                        <div id="customSuppliesSection" style="margin-top: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <h5 style="margin: 0; font-size: 14px; font-weight: 600;">Fournitures personnalisées</h5>
                                <button type="button" onclick="addCustomSupplyRow()" class="btn btn-secondary btn-icon btn-small">
                                    <i class="fa-solid fa-plus"></i> Ajouter
                                </button>
                            </div>
                            <div id="customSuppliesContainer" style="display: grid; gap: 12px;"></div>
                        </div>
                    </div>

                    <!-- Boissons -->
                    <div class="mgmt-panel">
                        <h4><i class="fa-solid fa-wine-glass"></i> Boissons enregistrées</h4>

                        <div id="drinkCategoryCards" style="display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap: 12px; margin-bottom: 20px;"></div>

                        <div id="drinkTypesContainer" style="display: grid; gap: 12px; margin-bottom: 20px;"></div>

                        <button type="button" onclick="addDrinkTypeRow()" class="btn btn-secondary btn-icon btn-small">
                            <i class="fa-solid fa-plus"></i> Ajouter un type de boisson
                        </button>
                    </div>

                    <!-- Cadeaux -->
                    <div class="mgmt-panel">
                        <h4><i class="fa-solid fa-gift"></i> Cadeaux enregistrés</h4>

                        <div id="giftTypesContainer" style="display: grid; gap: 12px; margin-bottom: 20px;"></div>

                        <button type="button" onclick="addGiftTypeRow()" class="btn btn-secondary btn-icon btn-small">
                            <i class="fa-solid fa-plus"></i> Ajouter un cadeau
                        </button>
                    </div>

                    <div class="mgmt-form-footer">
                        <button type="button" onclick="closeCeremonyForm()" class="btn btn-secondary btn-icon">
                            <i class="fa-solid fa-xmark"></i> Annuler
                        </button>
                        <button type="button" onclick="saveCeremonyDetails()" class="btn btn-primary btn-icon">
                            <i class="fa-solid fa-floppy-disk"></i> Sauvegarder
                        </button>
                    </div>
                </div>
            </div>
        </div>
            </div>
        </main>
    </div>


    