// scripts/database.js

// Initialiser la base de données si elle n'existe pas
if (!localStorage.getItem('reservations')) {
    localStorage.setItem('reservations', JSON.stringify([]));
}

if (!localStorage.getItem('inventory')) {
    const defaultInventory = {
        'celt': { name: 'Celt Pils 30L', stock: 0, realStock: 0 },
        'levrette': { name: 'Levrette Cerise 20L', stock: 0, realStock: 0 },
        'kapitell': { name: 'Kapitell Watou 20L', stock: 0, realStock: 0 },
        'krombacher': { name: 'Krombacher 30L', stock: 0, realStock: 0 },
        'vedett': { name: 'Vedett IPA 20L', stock: 0, realStock: 0 }
    };
    localStorage.setItem('inventory', JSON.stringify(defaultInventory));
}

/**
Récupère toutes les réservations
@returns {Array} - Liste des réservations
 */
function getReservations() {
    return JSON.parse(localStorage.getItem('reservations')) || [];
}

/**
Sauvegarde une nouvelle réservation
@param {Object} reservation - Données de la réservation
 */
function saveReservation(reservation) {
    // Générer un ID unique si non fourni
    if (!reservation.id) {
        reservation.id = Date.now().toString();
    }
    
    const reservations = getReservations();
    reservations.push(reservation);
    localStorage.setItem('reservations', JSON.stringify(reservations));
}

/**
Updates a reservation with compatibility for both old and new data formats
@param {string} id - ID of the reservation to update
@param {Object} updatedReservation - New reservation data
 */
function updateReservation(id, updatedReservation) {
    let reservations = getReservations();
    const index = reservations.findIndex(r => r.id === id);
    
    if (index !== -1) {
        // Handle migration from old format to new format
        if (!reservations[index].beers && updatedReservation.beers) {
            // Convert old format to new format
            reservations[index] = {
                ...updatedReservation
            };
        } else {
            // Update existing reservation
            reservations[index] = updatedReservation;
        }
        
        localStorage.setItem('reservations', JSON.stringify(reservations));
    }
}

/**
Supprime une réservation
@param {string} id - ID de la réservation
 */
function deleteReservation(id) {
    let reservations = getReservations();
    reservations = reservations.filter(r => r.id !== id);
    localStorage.setItem('reservations', JSON.stringify(reservations));
}

/**
Récupère l'inventaire
@returns {Object} - Données d'inventaire
 */
function getInventory() {
    return JSON.parse(localStorage.getItem('inventory')) || {};
}

/**
Sauvegarde l'inventaire
@param {Object} inventory - Données d'inventaire
 */
function saveInventory(inventory) {
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

/**
Met à jour la quantité d'un type de bière dans l'inventaire
@param {string} beerType - Type de bière
@param {number} quantity - Quantité à soustraire
 */
function updateInventory(beerType, quantity) {
    const inventory = getInventory();
    
    if (inventory[beerType]) {
        inventory[beerType].stock -= quantity;
        if (inventory[beerType].stock < 0) {
            inventory[beerType].stock = 0;
        }
        
        inventory[beerType].realStock -= quantity;
        if (inventory[beerType].realStock < 0) {
            inventory[beerType].realStock = 0;
        }
        
        saveInventory(inventory);
    }
}

// scripts/database.js

// Exporter les données locales sous forme de fichier JSON
document.getElementById('exportData').addEventListener('click', () => {
    const reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    const inventory = JSON.parse(localStorage.getItem('inventory')) || {};

    const data = {
        reservations,
        inventory
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();

    URL.revokeObjectURL(url);
});

// Importer un fichier JSON et remplacer les données locales
document.getElementById('importData').addEventListener('click', () => {
    const importFileInput = document.getElementById('importFile');
    importFileInput.click();

    importFileInput.addEventListener('change', async () => {
        const file = importFileInput.files[0];
        if (file) {
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.reservations && Array.isArray(data.reservations)) {
                localStorage.setItem('reservations', JSON.stringify(data.reservations));
            }

            if (data.inventory && typeof data.inventory === 'object') {
                localStorage.setItem('inventory', JSON.stringify(data.inventory));
            }

            alert('Données importées avec succès !');
        }
    });
});
