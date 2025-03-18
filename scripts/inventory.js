document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addBeerTypeBtn').addEventListener('click', addBeerType);

    const weekStartInput = document.getElementById("weekStartDate");
    weekStartInput.value = getMonday(new Date()).toISOString().split("T")[0];

    weekStartInput.addEventListener("change", updateInventoryDisplay);

    updateInventoryDisplay();
    updateEquipmentDisplay();
});

// **Récupère ou initialise le stock des bières dans localStorage**
function getBeerStock() {
    return JSON.parse(localStorage.getItem('beerStock')) || {
        "Celt Pils 30L": { stock: 0 },
        "Levrette Cerise 20L": { stock: 0 },
        "Kapitell Watou 20L": { stock: 0 },
        "Krombacher 30L": { stock: 0 },
        "Vedett IPA 20L": { stock: 0 }
    };
}

// **Sauvegarde le stock des bières**
function saveBeerStock(beerStock) {
    localStorage.setItem('beerStock', JSON.stringify(beerStock));
    syncBeerListWithReservations();
}

// **Met à jour l'affichage de l'inventaire**
function updateInventoryDisplay() {
    const tableBody = document.getElementById('inventoryTableBody');
    const beerStock = getBeerStock();
    const weekStartInput = document.getElementById("weekStartDate").value;
    const selectedMonday = new Date(weekStartInput);

    tableBody.innerHTML = '';

    for (const [beerType, item] of Object.entries(beerStock)) {
        const stockReserved = getBeerStockUsedThisWeek(beerType, selectedMonday);
        const stockReal = item.stock - stockReserved;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${beerType}</td>
            <td>${item.stock}</td>
            <td>${stockReserved}</td>
            <td>${stockReal}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-stock" data-beer="${beerType}">Modifier</button>
                <button class="btn btn-sm btn-danger delete-beer" data-beer="${beerType}">Supprimer</button>
            </td>
        `;

        tableBody.appendChild(row);
    }

    document.querySelectorAll('.edit-stock').forEach(button => {
        button.addEventListener('click', editStockTheorique);
    });

    document.querySelectorAll('.delete-beer').forEach(button => {
        button.addEventListener('click', deleteBeerType);
    });
}

// **Ajoute un nouveau type de fût**
function addBeerType() {
    const beerStock = getBeerStock();
    const beerName = prompt("Nom du nouveau type de fût (ex: Celt Pils 30L):");
    if (beerName && beerName.trim() !== '') {
        if (!beerStock[beerName]) {
            beerStock[beerName] = { stock: 0 };
            saveBeerStock(beerStock);
            updateInventoryDisplay();
        } else {
            alert("Ce type de fût existe déjà.");
        }
    }
}

// **Modifie le stock théorique d'un fût**
function editStockTheorique(event) {
    const beerStock = getBeerStock();
    const beerType = event.target.getAttribute('data-beer');
    const newValue = prompt(`Modifier le stock théorique de ${beerType}:`, beerStock[beerType].stock);

    if (newValue !== null) {
        const quantity = parseInt(newValue, 10);
        if (!isNaN(quantity) && quantity >= 0) {
            beerStock[beerType].stock = quantity;
            saveBeerStock(beerStock);
            updateInventoryDisplay();
        } else {
            alert("Veuillez entrer une valeur valide.");
        }
    }
}

// **Supprime un type de fût**
function deleteBeerType(event) {
    const beerStock = getBeerStock();
    const beerType = event.target.getAttribute('data-beer');
    if (confirm(`Supprimer ${beerType} du stock ?`)) {
        delete beerStock[beerType];
        saveBeerStock(beerStock);
        updateInventoryDisplay();
    }
}

// **Synchronise la liste des bières avec la page réservations**
function syncBeerListWithReservations() {
    localStorage.setItem('allBeers', JSON.stringify(Object.keys(getBeerStock())));
}

// **Calcule la quantité de fûts réservée pour une semaine donnée**
function getBeerStockUsedThisWeek(beerType, weekStartDate) {
    const reservations = getReservations();

    const startOfWeek = new Date(weekStartDate);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 13);
    endOfWeek.setHours(23, 59, 59, 999);

    return reservations.reduce((total, reservation) => {
        const resStartDate = new Date(reservation.startDate);
        resStartDate.setHours(0, 0, 0, 0);

        if (resStartDate >= startOfWeek && resStartDate <= endOfWeek) {
            const beer = reservation.beers.find(b => b.type.trim() === beerType);
            if (beer) return total + beer.quantity;
        }
        return total;
    }, 0);
}

// **Récupère le lundi de la semaine en cours**
function getMonday(date) {
    date = new Date(date);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

// **Mise à jour des équipements**
function updateEquipmentDisplay() {
    const reservations = getReservations();

    let barnum3x3Rented = 0, barnum3x6Rented = 0, photoboothRented = 0;
    let barnum3x3Dates = [], barnum3x6Dates = [], photoboothDates = [];

    reservations.forEach(reservation => {
        const startDate = formatDate(reservation.startDate);
        const endDate = formatDate(reservation.endDate);
        const dateRange = `${startDate} → ${endDate}`;

        if (reservation.barnumOption) {
            barnum3x3Rented++;
            barnum3x3Dates.push(dateRange);
        }
        if (reservation.barnum2Option) {
            barnum3x6Rented++;
            barnum3x6Dates.push(dateRange);
        }
        if (reservation.photoBoothOption) {
            photoboothRented++;
            photoboothDates.push(dateRange);
        }
    });

    document.getElementById('barnum3x3-rented').textContent = barnum3x3Rented;
    document.getElementById('barnum3x6-rented').textContent = barnum3x6Rented;
    document.getElementById('photobooth-rented').textContent = photoboothRented;

    document.getElementById('barnum3x3-available').textContent = Math.max(0, 1 - barnum3x3Rented);
    document.getElementById('barnum3x6-available').textContent = Math.max(0, 1 - barnum3x6Rented);
    document.getElementById('photobooth-available').textContent = Math.max(0, 1 - photoboothRented);

    document.getElementById('barnum3x3-dates').textContent = barnum3x3Dates.length ? barnum3x3Dates.join(' / ') : '-';
    document.getElementById('barnum3x6-dates').textContent = barnum3x6Dates.length ? barnum3x6Dates.join(' / ') : '-';
    document.getElementById('photobooth-dates').textContent = photoboothDates.length ? photoboothDates.join(' / ') : '-';

}

// **Formate une date**
function formatDate(dateString) {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
}
