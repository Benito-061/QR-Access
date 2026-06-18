<div id="dashboard" class="tab-content">
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