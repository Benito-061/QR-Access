<div id="gestionceremonies" class="tab-content pro-page">
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