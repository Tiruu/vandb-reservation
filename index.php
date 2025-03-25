<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion des Réservations | Gestion Tireuses</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
    <link rel="stylesheet" href="styles/main.css">
    <link rel="icon" type="image/png" href="medias/logo-vandb-noir-plein.png" />
</head>
<body>
    <?php include('nav.php'); ?>

    <div class="container-fluid mt-4">
        <h2 class="mb-4">Gestion des Réservations</h2>
        <button class="btn bg-blue-green mb-3" id="addReservationBtn">+ Ajouter une Réservation</button>

        <!-- Accordéon pour les réservations -->
        <div class="accordion" id="reservationsAccordion">
            <!-- Accordéon des réservations annuelles -->
            <div class="accordion-item">
                <h2 class="accordion-header" id="annualReservationsHeader">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#annualReservationsCollapse" aria-expanded="true" aria-controls="annualReservationsCollapse">
                        Réservations Annuelles <span class="badge bg-light-orange ms-2">0</span>
                    </button>
                </h2>
                <div id="annualReservationsCollapse" class="accordion-collapse collapse show" aria-labelledby="annualReservationsHeader">
                    <div class="accordion-body p-0">
                        <div class="table-responsive">
                            <table class="table table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>Raison sociale</th>
                                        <th>Nom / prénom</th>
                                        <th>Téléphone</th>
                                        <th>Début</th>
                                        <th>Fin</th>
                                        <th>Tireuse</th>
                                        <th>Fûts</th>
                                        <th>Options</th>
                                        <th>Commentaires</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="annualReservationsTableBody">
                                    <!-- Les réservations annuelles seront injectées ici -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Accordéon des réservations classiques -->
            <div class="accordion-item">
                <h2 class="accordion-header" id="regularReservationsHeader">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#regularReservationsCollapse" aria-expanded="true" aria-controls="regularReservationsCollapse">
                        Réservations Classiques <span class="badge bg-light-orange ms-2">0</span>
                    </button>
                </h2>
                <div id="regularReservationsCollapse" class="accordion-collapse collapse show" aria-labelledby="regularReservationsHeader">
                    <div class="accordion-body p-0">
                        <div class="table-responsive">
                            <table class="table table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>Raison sociale</th>
                                        <th>Client</th>
                                        <th>Téléphone</th>
                                        <th>Début</th>
                                        <th>Fin</th>
                                        <th>Tireuse</th>
                                        <th>Fûts</th>
                                        <th>Options</th>
                                        <th>Commentaires</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="regularReservationsTableBody">
                                    <!-- Les réservations classiques seront injectées ici -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Accordéon des réservations archivées (NOUVEAU) -->
            <div class="accordion-item">
                <h2 class="accordion-header" id="archivedReservationsHeader">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#archivedReservationsCollapse" aria-expanded="true" aria-controls="archivedReservationsCollapse">
                        Archives <span class="badge bg-light-orange ms-2">0</span>
                    </button>
                </h2>
                <div id="archivedReservationsCollapse" class="accordion-collapse collapse show" aria-labelledby="archivedReservationsHeader">
                    <div class="accordion-body p-0">
                        <div class="table-responsive">
                            <table class="table table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>Raison sociale</th>
                                        <th>Client</th>
                                        <th>Téléphone</th>
                                        <th>Début</th>
                                        <th>Fin</th>
                                        <th>Tireuse</th>
                                        <th>Fûts</th>
                                        <th>Options</th>
                                        <th>Commentaires</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="archivedReservationsTableBody">
                                    <!-- Les réservations archivées seront injectées ici -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <!-- Modal pour ajouter/modifier une réservation -->
    <div class="modal fade" id="reservationModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalTitle">Nouvelle Réservation</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="reservationForm">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="annualReservation">
                                    <label class="form-check-label" for="annualReservation">Réservation Annuelle</label>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <label>Raison sociale</label>
                                <input type="text" id="raisonSociale" class="form-control" required>
                                <label>Nom du Client</label>
                                <input type="text" id="clientName" class="form-control" required>
                                <label>Téléphone</label>
                                <input type="tel" id="clientPhone" class="form-control">
                            </div>
                            <div class="col-md-6">
                                <label>Date de début</label>
                                <input type="date" id="startDate" class="form-control" required>
                                <label>Date de fin</label>
                                <input type="date" id="endDate" class="form-control" required>
                            </div>
                        </div>
                        <hr>
                        <div class="row mt-3">
                            <div class="col-12">
                                <label>Type de Tireuse</label>
                                <div id="tapEntriesContainer">
                                    <!-- Les entrées de tireuses seront générées dynamiquement -->
                                </div>
                                <button type="button" class="btn bg-grey mt-2" id="addTapBtn">+ Ajouter une tireuse</button>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <label>Types de Fûts et Quantités</label>
                                <div id="beerContainer">
                                    <!-- Les entrées de bière seront générées dynamiquement -->
                                </div>
                                <button type="button" class="btn bg-grey mt-2" id="addBeer">+ Ajouter un type de fût</button>
                            </div>
                        </div>
                        <hr>
                        <div class="row mt-3">
                            <div class="col-md-12">
                                <label>Commentaire</label>
                                <textarea id="comment" class="form-control" rows="3" placeholder="Ajoutez un commentaire..."></textarea>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="barnumOption">
                                    <label class="form-check-label" for="barnumOption">Barnum 3x3</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="barnum2Option">
                                    <label class="form-check-label" for="barnum2Option">Barnum 3x6</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="photoBoothOption">
                                    <label class="form-check-label" for="photoBoothOption">Borne Photo</label>
                                </div>
                            </div>
                            <!-- ✅ Colonne droite : Empiler les boutons verticalement en bas à droite -->
                            <div class="col-md-6 d-flex flex-column align-items-end">
                                <button type="button" class="btn bg-orange mb-2" data-bs-dismiss="modal">Annuler</button>
                                <button type="button" class="btn bg-blue" id="saveReservation">Enregistrer</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <?php include 'footer.php'; ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="scripts/database.js"></script>
    <script src="scripts/reservations_combined.js"></script>
</body>
</html>
