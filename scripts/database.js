const API_URL = "http://localhost/api.php";

// Récupérer toutes les réservations depuis MySQL
async function getReservations() {
    const response = await fetch(`${API_URL}?type=reservations`);
    return response.json();
}

// Sauvegarder une réservation dans MySQL
async function saveReservation(reservation) {
    const response = await fetch(`${API_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservation)
    });

    const data = await response.json();
    console.log("Réponse de l'API :", data);
}


// Supprimer une réservation
async function deleteReservation(id) {
    await fetch(`${API_URL}?id=${id}`, {
        method: "DELETE"
    });
}

// Récupérer l'inventaire depuis MySQL
async function getInventory() {
    const response = await fetch(`${API_URL}?type=inventory`);
    return response.json();
}

// Mettre à jour l'inventaire dans MySQL
async function updateInventory(inventoryItem) {
    await fetch(`${API_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inventoryItem)
    });
}
