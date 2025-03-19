const API_URL = "https://my-cloudflare-app.lino-bckp.workers.dev"; // Remplace par ton vrai URL de Worker

// Récupérer toutes les réservations
async function getReservations() {
    const response = await fetch(`${API_URL}/reservations`);
    return response.json();
}

// Ajouter une nouvelle réservation
async function saveReservation(reservation) {
    await fetch(`${API_URL}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservation)
    });
}

// Récupérer l'état actuel de l'inventaire
async function getInventory() {
    const response = await fetch(`${API_URL}/inventory`);
    return response.json();
}

// Mettre à jour l'inventaire
async function updateInventory(inventoryItem) {
    await fetch(`${API_URL}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inventoryItem)
    });
}
