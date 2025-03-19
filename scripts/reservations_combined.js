document.addEventListener('DOMContentLoaded', () => {
    // Add reservation status styling
    addBootstrapCompatibleStyles();
    updateReservationsDisplay();

    const addReservationBtn = document.getElementById('addReservationBtn');
    if (addReservationBtn) {
        addReservationBtn.addEventListener('click', () => openNewReservationModal());
    }

    const saveReservationBtn = document.getElementById('saveReservation');
    if (saveReservationBtn) {
        saveReservationBtn.addEventListener('click', handleReservationSubmit);
    }

    const tapTypeSelect = document.getElementById('tapType');
    if (tapTypeSelect) {
        tapTypeSelect.addEventListener('change', generateTapSelect);
    }

    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        startDateInput.addEventListener('change', () => {
            generateTapSelect();
            updateEquipmentAvailability(startDateInput.value, document.getElementById('endDate').value, currentEditingId);
        });
    }

    const endDateInput = document.getElementById('endDate');
    if (endDateInput) {
        endDateInput.addEventListener('change', () => {
            generateTapSelect();
            updateEquipmentAvailability(document.getElementById('startDate').value, endDateInput.value, currentEditingId);
        });
    }
    
    // Add beer entry button
    const addBeerBtn = document.getElementById('addBeer');
    if (addBeerBtn) {
        addBeerBtn.addEventListener('click', () => addBeerEntry());
    }

    // Initialiser les accordéons si nécessaire
    const accordionElements = document.querySelectorAll('.accordion-collapse');
    if (accordionElements.length > 0) {
        accordionElements.forEach(element => {
            const accordion = new bootstrap.Collapse(element, {
                toggle: false
            });
        });
    }
});
/**
 * Adds custom styles that work with Bootstrap's CSS architecture
 */
function addBootstrapCompatibleStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Target Bootstrap's custom property mechanism */
        tr.reservation-active {
            --bs-table-accent-bg: rgba(25, 135, 84, 0.15) !important;
            --bs-table-bg-type: rgba(25, 135, 84, 0.15) !important;
            --bs-table-bg-state: rgba(25, 135, 84, 0.15) !important;
            --bs-table-bg: rgba(25, 135, 84, 0.15) !important;
        }
        
        tr.reservation-expired {
            --bs-table-accent-bg: rgba(220, 53, 69, 0.15) !important;
            --bs-table-bg-type: rgba(220, 53, 69, 0.15) !important;
            --bs-table-bg-state: rgba(220, 53, 69, 0.15) !important;
            --bs-table-bg: rgba(220, 53, 69, 0.15) !important;
        }
        
        /* Override the box-shadow approach as well for maximum compatibility */
        tr.reservation-active > *,
        tr.reservation-expired > * {
            box-shadow: none !important;
        }
        
        /* Apply direct background-color as a fallback */
        tr.reservation-active > * {
            background-color: rgba(25, 135, 84, 0.15) !important;
        }
        
        tr.reservation-expired > * {
            background-color: rgba(220, 53, 69, 0.15) !important;
        }
    `;
    document.head.appendChild(styleElement);
}



/**
 * Determines the status of a reservation based on its dates
 * @param {Object} reservation - The reservation object
 * @returns {string} - The status class name
 */
function getReservationStatusClass(reservation) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);
    
    // If end date has passed, reservation is expired
    if (endDate < today) {
        return 'reservation-expired';
    }
    
    // If start date has passed but end date hasn't, reservation is active
    if (startDate <= today && endDate >= today) {
        return 'reservation-active';
    }
    
    // Otherwise, it's an upcoming reservation
    return '';
}

// **LISTE DES TIREUSES ET FUTS DISPONIBLES**
const allTaps = {
    'FS': ['FS 1', 'FS 2', 'FS 3', 'FS 4', 'FS 5', 'FS 6', 'FS 7', 'FS 8', 'FS 9', 'FS 10'],
    'T1': ['T1-1', 'T1-2', 'T1-3', 'T1-4', 'T1-5', 'T1-6', 'T1-7', 'T1-8', 'T1-9', 'T1-10', 'T1-11', 'T1-12', 'T1-13', 'T1-14', 'T1-15'],
    'T2': ['T2-1', 'T2-2', 'T2-3', 'T2-4'],
    'Tonneau': ['Tonneau 1', 'Tonneau 2', 'Tonneau 3'],
    'Bertha': ['Bertha 1', 'Bertha 2'],
    'Festoche': ['Festoche 1'],
    'Picolo': ['Picolo 1']
};

let currentEditingId = null;

// Récupère la liste des bières dynamiquement depuis le stockage
function getBeerList() {
    // Récupère la liste des bières, sinon initialise avec un stock de base
    return JSON.parse(localStorage.getItem('allBeers')) || [
        "Celt Pils 30L",
        "Levrette Cerise 20L",
        "Kapitell Watou 20L",
        "Krombacher 30L",
        "Vedett IPA 20L"
    ];
}

// Helper function to generate beer select options HTML
function generateBeerSelectOptions(currentBeerType = null) {
    const allBeers = getBeerList();
    return `<option value="" selected>Choisir un type de fût...</option>` +
        allBeers.map(beer => `<option value="${beer}" ${beer === currentBeerType ? 'selected' : ''}>${beer}</option>`).join('');
}

// Function to add a new beer entry row
function addBeerEntry(beerType = '', beerQuantity = 1) {
    const beerContainer = document.getElementById('beerContainer');
    
    if (!beerContainer) {
        console.error("Beer container not found!");
        return;
    }
    
    const beerEntry = document.createElement('div');
    beerEntry.classList.add('beer-entry', 'row', 'mb-2');
    
    beerEntry.innerHTML = `
        <div class="col-md-5">
            <select class="form-select beerType">
                ${generateBeerSelectOptions(beerType)}
            </select>
        </div>
        <div class="col-md-4">
            <input type="number" class="form-control beerQuantity" value="${beerQuantity}" min="1">
        </div>
        <div class="col-md-3">
            <button type="button" class="btn btn-danger removeBeer">Supprimer</button>
        </div>
    `;

    beerContainer.appendChild(beerEntry);

    // Add event listener to remove button
    beerEntry.querySelector('.removeBeer').addEventListener('click', () => {
        beerEntry.remove();
    });
}

function openNewReservationModal(reservationId = null) {
    console.log("Modal ouvert avec ID:", reservationId);
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('reservationForm');
    const beerContainer = document.getElementById('beerContainer');
    
    // Clear existing beer entries
    if (beerContainer) {
        beerContainer.innerHTML = '';
    }

    if (reservationId) {
        const reservations = getReservations();
        const reservation = reservations.find(r => r.id === reservationId);
        if (!reservation) return;

        modalTitle.textContent = "Modifier Réservation";
        form.clientName.value = reservation.clientName;
        form.clientPhone.value = reservation.clientPhone;
        form.startDate.value = reservation.startDate;
        form.endDate.value = reservation.endDate;
        form.tapType.value = reservation.tapType;
        generateTapSelect(reservation.tapNumber);
        form.tapNumber.value = reservation.tapNumber;
        
        // Add beer entries for each beer in the reservation
        if (reservation.beers && reservation.beers.length > 0) {
            reservation.beers.forEach(beer => {
                addBeerEntry(beer.type, beer.quantity);
            });
        } else {
            // Add at least one empty beer entry
            addBeerEntry();
        }
        
        form.barnumOption.checked = reservation.barnumOption;
        form.barnum2Option.checked = reservation.barnum2Option;
        form.photoBoothOption.checked = reservation.photoBoothOption;

        // ✅ Prevent error if checkbox is missing
        const annualCheckbox = document.getElementById('annualReservation');
        if (annualCheckbox) {
            annualCheckbox.checked = reservation.isAnnual || false;
        }

        form.comment.value = reservation.comment ? reservation.comment : "";

        currentEditingId = reservation.id;
    } else {
        modalTitle.textContent = "Nouvelle Réservation";
        form.reset();
        currentEditingId = null;
        
        // Add one empty beer entry for new reservations
        addBeerEntry();

        const annualCheckbox = document.getElementById('annualReservation');
        if (annualCheckbox) {
            annualCheckbox.checked = false; // Reset the checkbox
        }

        form.comment.value = "";
    }
    updateEquipmentAvailability(form.startDate.value, form.endDate.value, reservationId);

    let modal = new bootstrap.Modal(document.getElementById('reservationModal'));
    modal.show();
}

function getReservations() {
    return JSON.parse(localStorage.getItem('reservations') || '[]');
}

async function saveReservation(reservation) {
    await fetch("https://31e2c60e-my-cloudflare-app.lino-bckp.workers.dev/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservation)
    });
}


async function handleReservationSubmit() {
    const form = document.getElementById('reservationForm');
    if (!form) {
        console.error("ERROR: Reservation form not found!");
        return;
    }

    const annualCheckbox = document.getElementById('annualReservation');
    const isAnnual = annualCheckbox ? annualCheckbox.checked : false;

    // Retrieve multiple beer selections
    const beerEntries = document.querySelectorAll('.beer-entry');
    const beers = Array.from(beerEntries).map(entry => {
        return {
            type: entry.querySelector('.beerType').value,
            quantity: parseInt(entry.querySelector('.beerQuantity').value, 10) || 1
        };
    }).filter(beer => beer.type !== ''); // Remove empty selections

    const reservation = {
        id: currentEditingId || Date.now().toString(),
        clientName: form.clientName.value,
        clientPhone: form.clientPhone.value,
        startDate: form.startDate.value,
        endDate: form.endDate.value,
        tapType: form.tapType.value,
        tapNumber: form.tapNumber.value,
        beers: beers, // Multiple beer entries
        barnumOption: form.barnumOption.checked,
        barnum2Option: form.barnum2Option.checked,
        photoBoothOption: form.photoBoothOption.checked,
        comment: form.comment.value,
        isAnnual: isAnnual
    };

    let reservations = getReservations();
    if (currentEditingId) {
        reservations = reservations.map(r => (r.id === currentEditingId ? reservation : r));
    } else {
        reservations.push(reservation);
    }

    await saveReservation(reservation);
    updateReservationsDisplay();
    bootstrap.Modal.getInstance(document.getElementById('reservationModal')).hide();
}

function formatDate(dateString) {
    if (!dateString) return "-"; // Evite les erreurs si la date est vide
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
}

function updateReservationsDisplay() {
    const annualTableBody = document.getElementById('annualReservationsTableBody');
    const regularTableBody = document.getElementById('regularReservationsTableBody');
    
    // Vider les tableaux
    annualTableBody.innerHTML = '';
    regularTableBody.innerHTML = '';

    const reservations = getReservations();
    reservations.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    // Filtrer les réservations par type
    const annualReservations = reservations.filter(r => r.isAnnual);
    const regularReservations = reservations.filter(r => !r.isAnnual);

    // Afficher un message si aucune réservation annuelle
    if (annualReservations.length === 0) {
        annualTableBody.innerHTML = '<tr><td colspan="10" class="text-center">Aucune réservation annuelle disponible</td></tr>';
    } else {
        // Remplir le tableau des réservations annuelles
        annualReservations.forEach(reservation => {
            const row = createReservationRow(reservation);
            annualTableBody.appendChild(row);
        });
    }

    // Afficher un message si aucune réservation classique
    if (regularReservations.length === 0) {
        regularTableBody.innerHTML = '<tr><td colspan="10" class="text-center">Aucune réservation classique disponible</td></tr>';
    } else {
        // Remplir le tableau des réservations classiques
        regularReservations.forEach(reservation => {
            const row = createReservationRow(reservation);
            regularTableBody.appendChild(row);
        });
    }

    // Mettre à jour les badges de comptage
    const annualButton = document.querySelector('#annualReservationsHeader button');
    const regularButton = document.querySelector('#regularReservationsHeader button');
    
    annualButton.innerHTML = `Réservations Annuelles <span class="badge bg-success ms-2">${annualReservations.length}</span>`;
    regularButton.innerHTML = `Réservations Classiques <span class="badge bg-primary ms-2">${regularReservations.length}</span>`;
}

// Fonction utilitaire pour créer une ligne de réservation
function createReservationRow(reservation) {
    const row = document.createElement('tr');
    
    // Add the appropriate status class
    const statusClass = getReservationStatusClass(reservation);
    if (statusClass) {
        row.classList.add(statusClass);
    }
    
    row.innerHTML = `
        <td>${reservation.clientName}</td>
        <td>${reservation.clientPhone || '-'}</td>
        <td>${formatDate(reservation.startDate)}</td>
        <td>${formatDate(reservation.endDate)}</td>
        <td>${reservation.tapNumber}</td>
        <td>${reservation.beers.map(beer => `${beer.quantity} × ${beer.type}`).join('<br>')}</td>
        <td>${reservation.barnumOption ? "Barnum 3x3" : ""} ${reservation.barnum2Option ? "Barnum 3x6" : ""} ${reservation.photoBoothOption ? "Borne Photo" : ""}</td>
        <td>${reservation.comment || "-"}</td>
        <td>
            <button class="btn btn-sm btn-primary" onclick="openNewReservationModal('${reservation.id}')">Modifier</button>
            <button class="btn btn-sm btn-danger" onclick="deleteReservation('${reservation.id}')">Supprimer</button>
        </td>
    `;
    return row;
}

// **SUPPRESSION D'UNE RÉSERVATION**
function deleteReservation(reservationId) {
    let reservations = getReservations();
    reservations = reservations.filter(reservation => reservation.id !== reservationId);
    saveReservations(reservations);
    updateReservationsDisplay();
}

function generateTapSelect(currentTapNumber = null) {
    const tapType = document.getElementById('tapType').value;
    const tapNumberSelect = document.getElementById('tapNumber');

    if (!tapType) {
        tapNumberSelect.innerHTML = '<option value="" selected>Choisir une tireuse...</option>';
        return;
    }

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reservations = getReservations();

    // Trouver les tireuses déjà réservées sur la période sélectionnée
    const usedTaps = new Set(reservations.filter(r => 
        r.tapType === tapType && 
        !(
            r.endDate < startDate || 
            r.startDate > endDate
        ) &&
        r.id !== currentEditingId // Ne pas compter la réservation en cours d'édition
    ).map(r => r.tapNumber));

    // Trier les tireuses disponibles et réservées
    const availableTaps = [];
    const reservedTaps = [];

    allTaps[tapType].forEach(tap => {
        if (usedTaps.has(tap)) {
            reservedTaps.push(tap);
        } else {
            availableTaps.push(tap);
        }
    });

    // Construire le menu déroulant avec des groupes
    tapNumberSelect.innerHTML = `
        <option value="" selected>Choisir une tireuse...</option>
        <optgroup label="✅ Tireuses Disponibles">
            ${availableTaps.map(tap => `<option value="${tap}">${tap}</option>`).join('')}
        </optgroup>
        <optgroup label="❌ Tireuses Réservées">
            ${reservedTaps.map(tap => `<option value="${tap}" disabled>${tap}</option>`).join('')}
        </optgroup>
    `;

    // Rétablir la valeur actuelle si on modifie une réservation
    if (currentTapNumber) {
        tapNumberSelect.value = currentTapNumber;
    }
}

function updateEquipmentAvailability(startDate, endDate, currentReservationId = null) {
    const reservations = getReservations();

    let barnum3x3Reserved = false;
    let barnum3x6Reserved = false;
    let photoBoothReserved = false;

    reservations.forEach(reservation => {
        // Ne pas compter la réservation en cours d'édition
        if (currentReservationId && reservation.id === currentReservationId) return;

        const resStart = new Date(reservation.startDate);
        const resEnd = new Date(reservation.endDate);
        const selectedStart = new Date(startDate);
        const selectedEnd = new Date(endDate);

        // Vérifie si la période se chevauche
        const isOverlapping = !(resEnd < selectedStart || resStart > selectedEnd);

        if (isOverlapping) {
            if (reservation.barnumOption) barnum3x3Reserved = true;
            if (reservation.barnum2Option) barnum3x6Reserved = true;
            if (reservation.photoBoothOption) photoBoothReserved = true;
        }
    });

    // Désactiver les équipements si déjà réservés
    document.getElementById('barnumOption').disabled = barnum3x3Reserved;
    document.getElementById('barnum2Option').disabled = barnum3x6Reserved;
    document.getElementById('photoBoothOption').disabled = photoBoothReserved;
}