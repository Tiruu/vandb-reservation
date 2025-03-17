document.addEventListener('DOMContentLoaded', () => {
    const reservationForm = document.getElementById('reservationForm');
    if (reservationForm) {
        reservationForm.addEventListener('submit', handleReservationSubmit);
    }

    // Update tap numbers when selecting a tap type
    document.getElementById('tapType').addEventListener('change', function() {
        updateTapNumberOptions(
            this.value,
            document.getElementById('startDate').value,
            document.getElementById('endDate').value,
            null
        );
    });

    // Ensure tap numbers update when start or end date changes
    document.getElementById('startDate').addEventListener('change', updateTapBasedOnDates);
    document.getElementById('endDate').addEventListener('change', updateTapBasedOnDates);

    // Add beer input dynamically
    document.getElementById('addBeerBtn').addEventListener('click', addBeerInput);
});

// **ALL AVAILABLE TAPS (same as in `reservations.js`)**
const allTaps = {
    'FS': ['FS 1', 'FS 2', 'FS 3', 'FS 4', 'FS 5', 'FS 6', 'FS 7', 'FS 8', 'FS 9', 'FS 10'],
    'T1': ['T1-1', 'T1-2', 'T1-3', 'T1-4', 'T1-5', 'T1-6', 'T1-7', 'T1-8', 'T1-9', 'T1-10', 'T1-11', 'T1-12', 'T1-13', 'T1-14', 'T1-15'],
    'T2': ['T2-1', 'T2-2', 'T2-3', 'T2-4'],
    'Tonneau': ['Tonneau 1', 'Tonneau 2', 'Tonneau 3'],
    'Bertha': ['Bertha 1', 'Bertha 2'],
    'Festoche': ['Festoche 1'],
    'Picolo': ['Picolo 1']
};

// Function to handle form submission
function handleReservationSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const beers = [];

    // Collect selected beers
    document.querySelectorAll('.beer-row').forEach(row => {
        const beerType = row.querySelector('.beer-type').value;
        const quantity = parseInt(row.querySelector('.beer-quantity').value, 10);
        if (beerType && quantity > 0) {
            beers.push({ type: beerType, quantity });
        }
    });

    const reservation = {
        clientName: formData.get('clientName'),
        clientPhone: formData.get('clientPhone'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        tapType: formData.get('tapType'),
        tapNumber: formData.get('tapNumber'), // Ensuring tap number is stored
        beers: beers,
        barnumOption: formData.get('barnumOption') === 'on',
        photoBoothOption: formData.get('photoBoothOption') === 'on'
    };

    saveReservation(reservation);
    event.target.reset();
}

// Function to update available tap numbers based on selection
function updateTapNumberOptions(tapType, startDate, endDate, selectedTapNumber = null) {
    const tapNumberSelect = document.getElementById('tapNumber');
    if (!tapType || !tapNumberSelect) return;

    // Fetch available taps for the given type
    const availableTaps = getAvailableTaps(tapType, startDate, endDate);

    // Preserve previously selected tap number
    const previousTapNumber = tapNumberSelect.value;

    // Clear old options
    tapNumberSelect.innerHTML = '<option value="" disabled selected>Choisir une tireuse...</option>';

    // Add available options
    availableTaps.forEach(tap => {
        const option = document.createElement('option');
        option.value = tap;
        option.textContent = tap;
        if (tap === previousTapNumber || tap === selectedTapNumber) {
            option.selected = true; // Retain previous selection
        }
        tapNumberSelect.appendChild(option);
    });

    // Add unavailable options (grayed out)
    const unavailableTaps = (allTaps[tapType] || []).filter(tap => !availableTaps.includes(tap));

    if (unavailableTaps.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = 'Non disponible';

        unavailableTaps.forEach(tap => {
            const option = document.createElement('option');
            option.value = tap;
            option.textContent = tap;
            option.disabled = true;
            optgroup.appendChild(option);
        });

        tapNumberSelect.appendChild(optgroup);
    }

    console.log("Tap numbers updated:", availableTaps);
}

// Function to update tap numbers when start/end date changes
function updateTapBasedOnDates() {
    updateTapNumberOptions(
        document.getElementById('tapType').value,
        document.getElementById('startDate').value,
        document.getElementById('endDate').value,
        document.getElementById('tapNumber').value
    );
}

// Function to fetch available taps (same as in `reservations.js`)
function getAvailableTaps(tapType, startDate, endDate) {
    if (!tapType || !startDate || !endDate) return [];

    // Get all reservations that might conflict
    const reservations = getReservations();
    const conflictingReservations = reservations.filter(reservation => {
        const reservationStart = new Date(reservation.startDate);
        const reservationEnd = new Date(reservation.endDate);
        const newStart = new Date(startDate);
        const newEnd = new Date(endDate);

        return !(newEnd < reservationStart || newStart > reservationEnd);
    });

    // Get all reserved taps for the given type
    const reservedTaps = new Set();
    conflictingReservations.forEach(reservation => {
        if (reservation.tapType === tapType && reservation.tapNumber) {
            reservedTaps.add(reservation.tapNumber);
        }
    });

    // Return available taps (all taps minus reserved ones)
    return (allTaps[tapType] || []).filter(tap => !reservedTaps.has(tap));
}

// Function to add beer type input fields
function addBeerInput() {
    const beerContainer = document.getElementById('beerContainer');
    const row = document.createElement('div');
    row.classList.add('row', 'mb-2', 'beer-row');

    row.innerHTML = `
        <div class="col-md-6">
            <select class="form-select beer-type">
                <option value="" disabled selected>Choisir un type...</option>
                <option value="celt">Celt Pils 30L</option>
                <option value="levrette">Levrette Cerise 20L</option>
                <option value="kapitell">Kapitell Watou 20L</option>
                <option value="krombacher">Krombacher 30L</option>
                <option value="vedett">Vedett IPA 20L</option>
            </select>
        </div>
        <div class="col-md-4">
            <input type="number" class="form-control beer-quantity" min="1" value="1">
        </div>
    `;

    beerContainer.appendChild(row);
}
