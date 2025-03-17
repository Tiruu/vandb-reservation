// scripts/validation.js

/**
 * Valide les données d'une réservation
 * @param {Object} reservation - Données de la réservation
 * @returns {Object} - Résultat de la validation { valid: boolean, message: string }
 */
function validateReservation(reservation) {
    // Validation des champs requis
    if (!reservation.clientName || !reservation.startDate || !reservation.endDate || 
        !reservation.tapType || !reservation.beerType || !reservation.beerQuantity) {
        return { valid: false, message: 'Tous les champs obligatoires doivent être remplis.' };
    }
    
    // Validation des dates
    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);
    
    if (startDate > endDate) {
        return { valid: false, message: 'La date de début doit être avant la date de fin.' };
    }
    
    // Validation de la disponibilité
    const reservations = getReservations();
    
    // Exclure la réservation actuelle si on est en mode édition
    const otherReservations = reservations.filter(r => r.id !== reservation.id);
    
    const conflict = otherReservations.some(r => {
        // Même type de tireuse
        if (r.tapType !== reservation.tapType) return false;
        
        // Vérifier le chevauchement de dates
        const rStart = new Date(r.startDate);
        const rEnd = new Date(r.endDate);
        
        return !(endDate < rStart || startDate > rEnd);
    });
    
    if (conflict) {
        return { valid: false, message: 'Cette tireuse est déjà réservée pour cette période.' };
    }
    
    // Validation du stock
    const inventory = getInventory();
    const beerItem = inventory[reservation.beerType];
    
    if (beerItem && beerItem.realStock < reservation.beerQuantity) {
        return { valid: false, message: `Stock insuffisant pour ${beerItem.name}. Disponible: ${beerItem.realStock}` };
    }
    
    return { valid: true };
}