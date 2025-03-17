let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const allTaps = {
    'FS': ['FS 1', 'FS 2', 'FS 3', 'FS 4', 'FS 5', 'FS 6', 'FS 7', 'FS 8', 'FS 9', 'FS 10'],
    'T1': ['T1-1', 'T1-2', 'T1-3', 'T1-4', 'T1-5', 'T1-6', 'T1-7', 'T1-8', 'T1-9', 'T1-10', 'T1-11', 'T1-12', 'T1-13', 'T1-14', 'T1-15'],
    'T2': ['T2-1', 'T2-2', 'T2-3', 'T2-4'],
    'Tonneau': ['Tonneau 1', 'Tonneau 2', 'Tonneau 3'],
    'Bertha': ['Bertha 1', 'Bertha 2'],
    'Festoche': ['Festoche 1'],
    'Picolo': ['Picolo 1']
};

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Loaded, initializing calendar...");
    initCalendar();

    document.getElementById("prevMonth").addEventListener("click", () => changeMonth(-1));
    document.getElementById("nextMonth").addEventListener("click", () => changeMonth(1));
});

// 🔄 Initialisation du calendrier
async function initCalendar() {
    console.log(`Initializing calendar for ${currentMonth + 1}/${currentYear}`);
    await updateCalendar();
}

// 🔄 Changer de mois
async function changeMonth(offset) {
    currentMonth += offset;

    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }

    console.log(`Switched to ${currentMonth + 1}/${currentYear}`);
    await updateCalendar();
}

// 📅 Mettre à jour le calendrier
async function updateCalendar() {
    const tableHead = document.getElementById('calendarHeader');
    const tableBody = document.getElementById('calendarBody');

    if (!tableHead || !tableBody) {
        console.error("ERROR: #calendarTable elements NOT FOUND!");
        return;
    }

    tableHead.innerHTML = '<th>Tireuse</th>';
    tableBody.innerHTML = '';

    document.getElementById("currentMonthYear").textContent =
        new Date(currentYear, currentMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(currentYear, currentMonth, day);
        const th = document.createElement('th');

        th.textContent = date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });

        if (date.getDate() === todayDay && date.getMonth() === todayMonth && date.getFullYear() === todayYear) {
            th.classList.add('today-column');
        }

        tableHead.appendChild(th);
    }

    let reservations = await getReservations();

    Object.keys(allTaps).forEach(tapType => {
        allTaps[tapType].forEach(tapNumber => {
            const tr = document.createElement('tr');
            const tdName = document.createElement('td');
            tdName.textContent = `${tapType} ${tapNumber}`;
            tr.appendChild(tdName);

            for (let day = 1; day <= lastDay.getDate(); day++) {
                const date = new Date(currentYear, currentMonth, day);
                const td = document.createElement('td');

                if (date.getDate() === todayDay && date.getMonth() === todayMonth && date.getFullYear() === todayYear) {
                    td.classList.add('today-column');
                }

                const dayReservations = reservations.filter(res =>
                    res.tapType === tapType &&
                    res.tapNumber === tapNumber &&
                    new Date(res.startDate) <= date &&
                    new Date(res.endDate) >= date
                );

                if (dayReservations.length > 0) {
                    if (dayReservations.some(res => res.isAnnual)) {
                        td.classList.add('annual-reserved'); // 🔵 Blue for annual
                    } else {
                        td.classList.add('reserved'); // ✅ Green for normal reservations
                    }
                    td.textContent = "📅";
                    td.title = dayReservations.map(res => `${res.clientName} - ${res.beers[0].type}`).join("\n");
                    td.addEventListener("click", () => showReservationsModal(dayReservations, date));
                }

                tr.appendChild(td);
            }

            tableBody.appendChild(tr);
        });
    });
}


// 📌 **Afficher les réservations dans une modale**
function showReservationsModal(reservations, date) {
    const modalTitle = document.getElementById("reservationDateTitle");
    const modalBody = document.getElementById("reservationDetailsBody");

    modalTitle.textContent = `Réservations du ${date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`;
    modalBody.innerHTML = reservations.length === 0 ? '<p>Aucune réservation.</p>' : reservations.map(res =>
        `<div class="card mb-2">
            <div class="card-body">
                <h5 class="card-title">${res.clientName}</h5>
                <p><strong>Tireuse :</strong> ${res.tapType} ${res.tapNumber}</p>
                <p><strong>Fût :</strong> ${res.beers[0].type} x${res.beers[0].quantity}</p>
                <p><strong>Options :</strong> ${res.barnumOption ? "Barnum 3x3" : ""} ${res.barnum2Option ? "Barnum 3x6" : ""} ${res.photoBoothOption ? "Borne Photo" : ""}</p>
                <p><strong>Commentaire :</strong> ${res.comment || "Aucun"}</p>
            </div>
        </div>`
    ).join('');

    new bootstrap.Modal(document.getElementById("reservationDetailsModal")).show();
}

// 🔄 Récupérer les réservations (simulation de base locale)
function getReservations() {
    return JSON.parse(localStorage.getItem('reservations') || '[]');
}

// 💾 Sauvegarder les réservations
function saveReservations(reservations) {
    localStorage.setItem('reservations', JSON.stringify(reservations));
}
