document.addEventListener('DOMContentLoaded', () => {
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
        startDateInput.addEventListener('change', generateTapSelect);
    }

    const endDateInput = document.getElementById('endDate');
    if (endDateInput) {
        endDateInput.addEventListener('change', generateTapSelect);
    }

    document.getElementById('startDate').addEventListener('change', () => {
        updateEquipmentAvailability(startDateInput.value, endDateInput.value, currentEditingId);
    });
    document.getElementById('endDate').addEventListener('change', () => {
        updateEquipmentAvailability(startDateInput.value, endDateInput.value, currentEditingId);
    });
});

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

function openNewReservationModal(reservationId = null) {
    console.log("Modal ouvert avec ID:", reservationId);
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('reservationForm');

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
        generateBeerSelect(reservation.beers[0].type);
        form.beerQuantity.value = reservation.beers[0].quantity;
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
        generateBeerSelect();

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

function saveReservations(reservations) {
    localStorage.setItem('reservations', JSON.stringify(reservations));
}

function handleReservationSubmit() {
    const form = document.getElementById('reservationForm');
    if (!form) {
        console.error("ERROR: Reservation form not found!");
        return;
    }

    const annualCheckbox = document.getElementById('annualReservation');
    const isAnnual = annualCheckbox ? annualCheckbox.checked : false; // ✅ Prevents null error

    const reservation = {
        id: currentEditingId || Date.now().toString(),
        clientName: form.clientName.value,
        clientPhone: form.clientPhone.value,
        startDate: form.startDate.value,
        endDate: form.endDate.value,
        tapType: form.tapType.value,
        tapNumber: form.tapNumber.value,
        beers: [{ type: form.beerType.value, quantity: parseInt(form.beerQuantity.value, 10) }],
        barnumOption: form.barnumOption.checked,
        barnum2Option: form.barnum2Option.checked,
        photoBoothOption: form.photoBoothOption.checked,
        comment: form.comment.value,
        isAnnual: isAnnual // ✅ Prevents crash if checkbox is missing
    };

    let reservations = getReservations();
    if (currentEditingId) {
        reservations = reservations.map(r => (r.id === currentEditingId ? reservation : r));
    } else {
        reservations.push(reservation);
    }

    if (!form.clientName.value.trim()) {
        alert("Veuillez entrer le nom du client.");
        return;
    }
    if (!form.startDate.value) {
        alert("Veuillez sélectionner une date de début.");
        return;
    }
    if (!form.endDate.value) {
        alert("Veuillez sélectionner une date de fin.");
        return;
    }
    if (form.tapType.value && !form.tapNumber.value) {
        alert("Veuillez sélectionner un numéro de tireuse.");
        return;
    }

    saveReservations(reservations);
    updateReservationsDisplay();

    bootstrap.Modal.getInstance(document.getElementById('reservationModal')).hide();
}



function formatDate(dateString) {
    if (!dateString) return "-"; // Evite les erreurs si la date est vide
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
}

function updateReservationsDisplay() {
    const tableBody = document.getElementById('reservationsTableBody');
    tableBody.innerHTML = '';

    const reservations = getReservations();
    reservations.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (reservations.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Aucune réservation disponible</td></tr>';
        return;
    }

    reservations.forEach(reservation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reservation.isAnnual ? "Annuelle" : ""}</td>
            <td>${reservation.clientName}</td>
            <td>${reservation.clientPhone || '-'}</td>
            <td>${formatDate(reservation.startDate)}</td>
            <td>${formatDate(reservation.endDate)}</td>
            <td>${reservation.tapType} ${reservation.tapNumber}</td>
            <td>${reservation.beers.map(beer => `${beer.quantity} × ${beer.type}`).join('<br>')}</td>
            <td>${reservation.barnumOption ? "Barnum 3x3" : ""} ${reservation.barnum2Option ? "Barnum 3x6" : ""} ${reservation.photoBoothOption ? "Borne Photo" : ""}</td>
            <td>${reservation.comment || "-"}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openNewReservationModal('${reservation.id}')">Modifier</button>
                <button class="btn btn-sm btn-danger" onclick="deleteReservation('${reservation.id}')">Supprimer</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// **SUPPRESSION D'UNE RÉSERVATION**
function deleteReservation(reservationId) {
    let reservations = getReservations();
    reservations = reservations.filter(reservation => reservation.id !== reservationId);
    saveReservations(reservations);
    updateReservationsDisplay();
}

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

function generateBeerSelect(currentBeerType = null) {
    const beerSelect = document.getElementById('beerType');
    const allBeers = getBeerList();

    if (!beerSelect) return; // Vérification de l'élément existant

    beerSelect.innerHTML = '<option value="" selected>Choisir un type de fût...</option>' +
        allBeers.map(beer => `<option value="${beer}">${beer}</option>`).join('');

    if (currentBeerType && allBeers.includes(currentBeerType)) {
        beerSelect.value = currentBeerType;
    }
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
        r.tapNumber !== currentTapNumber // Autoriser la tireuse déjà sélectionnée
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



