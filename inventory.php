<?php include 'nav.php'; ?>

    <div class="container mt-4">
        <h2 class="mb-4">Gestion des Stocks</h2>

        <!-- Sélection de la semaine -->
        <div class="mb-3">
            <label for="weekStartDate" class="form-label">Début de semaine</label>
            <input type="date" id="weekStartDate" class="form-control">
        </div>

        <!-- Beer Stock Table -->
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Fûts de Bière</h5>
                <button class="btn btn-sm btn-success" id="addBeerTypeBtn">+ Ajouter un type de fût</button>
            </div>
            <div class="card-body">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Type de Fût</th>
                            <th>Stock Théorique</th>
                            <th>Quantité réservée sur la semaine sélectionnée</th>
                            <th>Stock Réel</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="inventoryTableBody">
                            <!-- Contenu généré dynamiquement -->
                    </tbody>
                    </table>
            </div>
        </div>

        <!-- Equipment Stock Table -->
        <!-- Équipements -->
<table class="table table-striped">
    <thead>
        <tr>
            <th>Équipement</th>
            <th>Disponible</th>
            <th>Loué</th>
            <th>Dates Louées</th> <!-- Nouvelle colonne -->
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Barnum 3x3</td>
            <td id="barnum3x3-available">1</td>
            <td id="barnum3x3-rented">0</td>
            <td id="barnum3x3-dates">-</td> <!-- Affichage des dates -->
        </tr>
        <tr>
            <td>Barnum 3x6</td>
            <td id="barnum3x6-available">1</td>
            <td id="barnum3x6-rented">0</td>
            <td id="barnum3x6-dates">-</td> <!-- Affichage des dates -->
        </tr>
        <tr>
            <td>Borne Photo</td>
            <td id="photobooth-available">1</td>
            <td id="photobooth-rented">0</td>
            <td id="photobooth-dates">-</td> <!-- Affichage des dates -->
        </tr>
    </tbody>
</table>

    </div>

    <?php include 'footer.php'; ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="scripts/inventory.js"></script>
    <script src="scripts/database.js"></script>
</body>
</html>
