<?php include('nav.php'); ?>

    <div class="container-fluid mt-4">
        <h2 class="mb-4">Gestion des Réservations</h2>

        <!-- Accordéon pour les réservations -->
        <div class="accordion" id="reservationsAccordion">
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
    <?php include 'footer.php'; ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="scripts/database.js"></script>
    <script src="scripts/config.js"></script>
    <script src="scripts/utilities.js"></script>
    <script src="scripts/apiservices.js"></script> 
    <script src="scripts/reservation_and_equipement_manager.js"></script>
    <script src="scripts/dominit.js"></script>
</body>
</html>
