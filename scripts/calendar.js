/**
 * Tap Reservation Calendar
 * 
 * This module handles the display and interaction with a calendar
 * showing tap reservations for different types of equipment.
 */

// Use an IIFE to avoid global namespace pollution
(function() {
    'use strict';

    // Configuration - centralized for easier updates
    const CONFIG = {
        apiEndpoint: 'http://localhost/api.php',
        dateFormat: {
            header: { weekday: 'short', day: '2-digit' },
            modal: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
            monthYear: { month: 'long', year: 'numeric' }
        },
        cssClasses: {
            todayColumn: 'today-column',
            reserved: 'reserved',
            annualReserved: 'annual-reserved'
        },
        selectors: {
            calendarHeader: '#calendarHeader',
            calendarBody: '#calendarBody',
            currentMonthYear: '#currentMonthYear',
            prevMonth: '#prevMonth',
            nextMonth: '#nextMonth',
            reservationModal: '#reservationDetailsModal',
            reservationDateTitle: '#reservationDateTitle',
            reservationDetailsBody: '#reservationDetailsBody'
        }
    };

    // Equipment inventory - structured by category
    const EQUIPMENT = {
        'FS': Array.from({ length: 10 }, (_, i) => `FS ${i + 1}`),
        'T1': Array.from({ length: 15 }, (_, i) => `T1-${i + 1}`),
        'T2': Array.from({ length: 4 }, (_, i) => `T2-${i + 1}`),
        'Tonneau': Array.from({ length: 3 }, (_, i) => `Tonneau ${i + 1}`),
        'Bertha': Array.from({ length: 2 }, (_, i) => `Bertha ${i + 1}`),
        'Festoche': Array.from({ length: 2 }, (_, i) => `Festoche ${i + 1}`),
        'Picolo': ['Picolo 1']
    };

    // State management
    const state = {
        currentDate: new Date(),
        reservations: [],
        bootstrap: null  // Will hold Bootstrap modal instance
    };

    /**
     * Initialize the calendar when the DOM is fully loaded
     */
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM Loaded, initializing calendar...');
        
        // Initialize Bootstrap components if available
        state.bootstrap = window.bootstrap || null;
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize the calendar with current month/year
        initCalendar();
    });

    /**
     * Set up all event listeners for the calendar
     */
    function setupEventListeners() {
        const { selectors } = CONFIG;
        
        // Month navigation
        document.querySelector(selectors.prevMonth)?.addEventListener('click', () => changeMonth(-1));
        document.querySelector(selectors.nextMonth)?.addEventListener('click', () => changeMonth(1));
    }

    /**
     * Initialize the calendar with the current month/year
     */
    async function initCalendar() {
        const { currentDate } = state;
        console.log(`Initializing calendar for ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`);
        await updateCalendar();
    }

    /**
     * Change the displayed month by the given offset
     * @param {number} offset - Number of months to shift (positive or negative)
     */
    async function changeMonth(offset) {
        const { currentDate } = state;
        
        // Create a new date to avoid mutating the original
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        
        state.currentDate = newDate;
        
        console.log(`Switched to ${newDate.getMonth() + 1}/${newDate.getFullYear()}`);
        await updateCalendar();
    }

    /**
     * Update the calendar display based on the current month/year
     */
    async function updateCalendar() {
        const { selectors, dateFormat, cssClasses } = CONFIG;
        const { currentDate } = state;
        
        const tableHead = document.querySelector(selectors.calendarHeader);
        const tableBody = document.querySelector(selectors.calendarBody);

        if (!tableHead || !tableBody) {
            console.error('ERROR: Calendar table elements not found!');
            return;
        }

        // Update month/year display
        const monthYearElement = document.querySelector(selectors.currentMonthYear);
        if (monthYearElement) {
            monthYearElement.textContent = currentDate.toLocaleDateString('fr-FR', dateFormat.monthYear);
        }

        // Clear and rebuild the table header
        tableHead.innerHTML = '<th>Tireuse</th>';
        tableBody.innerHTML = '';

        // Calculate first and last day of the month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Get today's date for highlighting
        const today = new Date();
        const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

        // Create column headers for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const th = document.createElement('th');
            
            th.textContent = date.toLocaleDateString('fr-FR', dateFormat.header);
            
            // Highlight today's column
            if (isCurrentMonth && date.getDate() === today.getDate()) {
                th.classList.add(cssClasses.todayColumn);
            }
            
            tableHead.appendChild(th);
        }

        // Fetch reservations data
        try {
            state.reservations = await fetchReservations();
            console.log("Reservations loaded:", state.reservations.length);
        } catch (error) {
            console.error("Failed to load reservations:", error);
            state.reservations = [];
        }

        // Build the table rows for each tap
        renderEquipmentRows(tableBody, daysInMonth, isCurrentMonth, today.getDate());
        
        console.log("Calendar updated successfully");
    }

    /**
     * Render all equipment rows in the calendar
     * @param {HTMLElement} tableBody - The table body element
     * @param {number} daysInMonth - Number of days in the current month
     * @param {boolean} isCurrentMonth - Whether we're viewing the current month
     * @param {number} todayDate - The day of the month for today
     */
    function renderEquipmentRows(tableBody, daysInMonth, isCurrentMonth, todayDate) {
        const { cssClasses } = CONFIG;
        const { currentDate, reservations } = state;
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Create a document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        // For each equipment type and item
        Object.entries(EQUIPMENT).forEach(([tapType, tapItems]) => {
            tapItems.forEach(tapNumber => {
                const row = document.createElement('tr');
                
                // Add the equipment name cell
                const nameCell = document.createElement('td');
                nameCell.textContent = tapNumber;
                row.appendChild(nameCell);
                
                // Add cells for each day of the month
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const cell = document.createElement('td');
                    
                    // Highlight today's column
                    if (isCurrentMonth && day === todayDate) {
                        cell.classList.add(cssClasses.todayColumn);
                    }
                    
                   const dayReservations = reservations.filter(res => {
                   const startDate = new Date(res.startDate);
    		   const endDate = new Date(res.endDate);
  		   const normalizedDate = new Date(date);

   		   // Normaliser les dates (éviter problèmes de fuseau horaire)
    		   startDate.setHours(0, 0, 0, 0);
    		   endDate.setHours(0, 0, 0, 0);
    		   normalizedDate.setHours(0, 0, 0, 0);

   		 return (
       		 	res.tapType === tapType &&
        		res.tapNumber === tapNumber &&
       		 	startDate <= normalizedDate &&
       		 	endDate >= normalizedDate
    			);
		});

                    
                    // If there are reservations, style the cell accordingly
                    if (dayReservations.length > 0) {
                        // Check if any reservation is annual
                        const hasAnnualReservation = dayReservations.some(res => res.isAnnual);
                        
                        // Apply appropriate class
                        cell.classList.add(hasAnnualReservation ? 
                            cssClasses.annualReserved : 
                            cssClasses.reserved
                        );
                        
                        // Add tooltip with reservation info
                        cell.title = dayReservations.map(res => {
                            const beerInfo = res.beers.length > 0 ? 
                                `${res.beers[0].type} x${res.beers[0].quantity}` : 
                                "Aucune bière";
                            return `${res.clientName} - ${beerInfo}`;
                        }).join("\n");
                        
                        // Add click event to show reservation details
                        cell.addEventListener("click", () => showReservationsModal(dayReservations, date));
                    }
                    
                    row.appendChild(cell);
                }
                
                fragment.appendChild(row);
            });
        });
        
        tableBody.appendChild(fragment);
    }

    /**
     * Display a modal with reservation details for a specific date
     * @param {Array} reservations - List of reservations for the selected date
     * @param {Date} date - The selected date
     */
    function showReservationsModal(reservations, date) {
        const { selectors, dateFormat } = CONFIG;
        
        const modalTitle = document.querySelector(selectors.reservationDateTitle);
        const modalBody = document.querySelector(selectors.reservationDetailsBody);
        
        if (!modalTitle || !modalBody) {
            console.error("Modal elements not found");
            return;
        }

        // Set the modal title with formatted date
        modalTitle.textContent = `Réservations du ${date.toLocaleDateString('fr-FR', dateFormat.modal)}`;
        
        // Generate reservation cards or show "no reservations" message
        if (reservations.length === 0) {
            modalBody.innerHTML = '<p>Aucune réservation.</p>';
        } else {
            modalBody.innerHTML = reservations.map(res => {
                // Format options as a list
                const options = [
                    res.barnumOption ? "Barnum 3x3" : "",
                    res.barnum2Option ? "Barnum 3x6" : "",
                    res.photoBoothOption ? "Borne Photo" : ""
                ].filter(Boolean).join(", ") || "Aucune";
                
                // Format beer information
                const beerInfo = res.beers.length > 0 
                    ? `${res.beers[0].type} x${res.beers[0].quantity}` 
                    : "Aucun";
                
                return `
                    <div class="card mb-2">
                        <div class="card-body">
                            <h5 class="card-title">${escapeHtml(res.clientName)}</h5>
                            <p><strong>Tireuse :</strong> ${escapeHtml(res.tapType)} ${escapeHtml(res.tapNumber)}</p>
                            <p><strong>Fût :</strong> ${escapeHtml(beerInfo)}</p>
                            <p><strong>Options :</strong> ${escapeHtml(options)}</p>
                            <p><strong>Commentaire :</strong> ${escapeHtml(res.comment || "Aucun")}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // Show the modal using Bootstrap if available
        if (state.bootstrap) {
            const modal = new state.bootstrap.Modal(document.querySelector(selectors.reservationModal));
            modal.show();
        } else {
            // Fallback if Bootstrap is not available
            const modalElement = document.querySelector(selectors.reservationModal);
            if (modalElement) {
                modalElement.style.display = 'block';
            }
        }
    }

    /**
     * Fetch reservations from the API
     * @returns {Promise<Array>} Array of reservation objects
     */
    async function fetchReservations() {
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}?type=reservations`);
            
            // Check if the request was successful
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Validate the response data
            if (!Array.isArray(data)) {
                console.error("ERROR: API did not return an array:", data);
                return [];
            }
            
            // Transform and normalize the data
            return data.map(reservation => ({
                ...reservation,
                // Parse JSON string if it's a string, or use empty array as fallback
                beers: typeof reservation.beers === 'string' ? 
                    safeJsonParse(reservation.beers, []) : 
                    (Array.isArray(reservation.beers) ? reservation.beers : []),
                // Convert string boolean values to actual booleans
                barnumOption: convertToBoolean(reservation.barnumOption),
                barnum2Option: convertToBoolean(reservation.barnum2Option),
                photoBoothOption: convertToBoolean(reservation.photoBoothOption),
                isAnnual: convertToBoolean(reservation.isAnnual)
            }));
            
        } catch (error) {
            console.error("ERROR: Fetching reservations failed:", error);
            throw error; // Re-throw to allow handling by the caller
        }
    }

    /**
     * Safely parse JSON with a fallback value
     * @param {string} jsonString - The JSON string to parse
     * @param {*} fallback - Fallback value if parsing fails
     * @returns {*} Parsed object or fallback value
     */
    function safeJsonParse(jsonString, fallback) {
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn("Failed to parse JSON:", e);
            return fallback;
        }
    }

    /**
     * Convert various values to boolean
     * @param {*} value - Value to convert
     * @returns {boolean} Converted boolean value
     */
    function convertToBoolean(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            return value === '1' || value.toLowerCase() === 'true';
        }
        return !!value; // Convert to boolean
    }

    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    function escapeHtml(str) {
        if (!str || typeof str !== 'string') return '';
        
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
})();