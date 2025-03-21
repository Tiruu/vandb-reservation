/**
 * Reservation Management System
 *
 * A comprehensive application for managing beer tap reservations, including
 * creation, editing, archiving, and deletion of reservations, as well as
 * equipment availability management.
 *
 * @author Optimized by AI Assistant
 * @version 2.0.0
 */

/**
 * Configuration object to store application settings
 */
const CONFIG = {
    API_BASE_URL: 'http://localhost/api.php',
    DATE_FORMAT: 'DD-MM-YYYY',
    DEBUG: true,
    TRANSLATIONS: {
      NEW_RESERVATION: 'Nouvelle Réservation',
      EDIT_RESERVATION: 'Modifier Réservation',
      CHOOSE_TAP: 'Choisir une tireuse...',
      CHOOSE_BEER: 'Choisir un type de fût...',
      NO_BEER_AVAILABLE: 'Aucune bière disponible',
      DELETE_CONFIRM: 'Voulez-vous vraiment supprimer cette réservation ?',
      ARCHIVE_CONFIRM: 'Voulez-vous archiver et supprimer cette réservation ?',
      DELETE_ARCHIVE_CONFIRM: 'Voulez-vous supprimer définitivement cette archive ?',
      API_EMPTY_RESPONSE: 'Erreur : Réponse vide de l\'API',
      DELETE_ERROR: 'Erreur lors de la suppression: ',
      ARCHIVE_ERROR: 'Erreur lors de l\'archivage : ',
      EQUIPMENT: {
        BARNUM_3X3: 'Barnum 3x3',
        BARNUM_3X6: 'Barnum 3x6',
        PHOTO_BOOTH: 'Borne Photo'
      },
      AVAILABILITY: {
        AVAILABLE: '✅ Tireuses Disponibles',
        RESERVED: '❌ Tireuses Réservées'
      }
    },
    RESERVATION_STATUS: {
      ACTIVE: 'reservation-active',
      EXPIRED: 'reservation-expired',
      UPCOMING: ''
    }
  };

  /**
   * Utility class for common operations
   */
  class Utilities {
    /**
     * Logs debug information if debugging is enabled
     * @param {string} label - The log label
     * @param {*} data - The data to log
     */
    static log(label, data) {
      if (CONFIG.DEBUG) {
        console.log(`📌 Debug - ${label}:`, data);
      }
    }

    /**
     * Logs errors with a consistent format
     * @param {string} message - Error message
     * @param {*} error - Error object or details
     */
    static logError(message, error) {
      console.error(`❌ ERROR: ${message}`, error);
    }

    /**
     * Formats a date string from YYYY-MM-DD to DD-MM-YYYY
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @returns {string} Formatted date string
     */
    static formatDate(dateString) {
      if (!dateString) return "-";
      const [year, month, day] = dateString.split("-");
      return `${day}-${month}-${year}`;
    }

    /**
     * Safely parses JSON data
     * @param {string} jsonString - JSON string to parse
     * @param {*} defaultValue - Default value if parsing fails
     * @returns {*} Parsed object or default value
     */
    static safeJsonParse(jsonString, defaultValue = []) {
      try {
        return jsonString ? JSON.parse(jsonString) : defaultValue;
      } catch (error) {
        Utilities.logError(`Failed to parse JSON: ${jsonString}`, error);
        return defaultValue;
      }
    }

    /**
     * Creates a DOM element with attributes and event listeners
     * @param {string} tag - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {Object} eventListeners - Event listeners to attach
     * @param {string|Node} content - Inner content or child node
     * @returns {HTMLElement} Created element
     */
    static createElement(tag, attributes = {}, eventListeners = {}, content = '') {
      const element = document.createElement(tag);

      // Set attributes
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
          if (Array.isArray(value)) {
            element.classList.add(...value);
          } else {
            element.className = value;
          }
        } else {
          element.setAttribute(key, value);
        }
      });

      // Add event listeners
      Object.entries(eventListeners).forEach(([event, listener]) => {
        element.addEventListener(event, listener);
      });

      // Set content
      if (content) {
        if (typeof content === 'string') {
          element.innerHTML = content;
        } else {
          element.appendChild(content);
        }
      }

      return element;
    }

    /**
     * Creates a Bootstrap modal instance
     * @param {string} modalId - The modal element ID
     * @returns {Object} Bootstrap modal instance
     */
    static getModalInstance(modalId) {
      const modalElement = document.getElementById(modalId);
      return bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    }
  }

  /**
   * API service to handle all server communication
   */
  class ApiService {
    /**
     * Sends a request to the API
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<*>} Response data
     */
    static async request(endpoint, options = {}) {
      const url = `${CONFIG.API_BASE_URL}?type=${endpoint}`;

      try {
        const response = await fetch(url, options);
        const text = await response.text();

        Utilities.log(`Raw API Response (${endpoint})`, text);

        if (!text.trim()) {
          throw new Error('Empty response from API');
        }

        const data = JSON.parse(text);

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }

        if (data.error) {
          throw new Error(data.error);
        }

        return data;
      } catch (error) {
        Utilities.logError(`API request failed for ${endpoint}`, error);
        throw error;
      }
    }

    /**
     * Fetches the beer inventory
     * @returns {Promise<string[]>} List of beer names
     */
    static async getBeerInventory() {
      try {
        const data = await this.request('inventory');

        if (!data || typeof data !== "object") {
          throw new Error('Invalid beer stock data');
        }

        return Object.keys(data);
      } catch (error) {
        Utilities.logError('Fetching beer inventory failed', error);
        return [];
      }
    }

    /**
     * Fetches all reservations
     * @returns {Promise<Object[]>} List of reservations
     */
    static async getReservations() {
      try {
        const data = await this.request('reservations');

        if (!Array.isArray(data)) {
          throw new Error('API did not return an array');
        }

        return data.map(reservation => ({
          ...reservation,
          beers: typeof reservation.beers === "string"
            ? Utilities.safeJsonParse(reservation.beers)
            : reservation.beers
        }));
      } catch (error) {
        Utilities.logError('Fetching reservations failed', error);
        return [];
      }
    }

    /**
     * Fetches archived reservations
     * @returns {Promise<Object[]>} List of archived reservations
     */
    static async getArchivedReservations() {
      try {
        const data = await this.request('archives');

        if (!Array.isArray(data)) {
          throw new Error('API did not return an array');
        }

        return data.map(reservation => ({
          ...reservation,
          beers: typeof reservation.beers === "string"
            ? Utilities.safeJsonParse(reservation.beers)
            : reservation.beers
        }));
      } catch (error) {
        Utilities.logError('Fetching archived reservations failed', error);
        return [];
      }
    }

    /**
     * Saves a reservation (create or update)
     * @param {Object} reservationData - Reservation data to save
     * @returns {Promise<Object>} Saved reservation data
     */
    static async saveReservation(reservationData) {
      try {
        Utilities.log('Data Sent to API (saveReservation)', reservationData);

        const data = await this.request('reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reservationData)
        });

        Utilities.log('Reservation saved successfully', data);
        return data;
      } catch (error) {
        Utilities.logError('Saving reservation failed', error);
        throw error;
      }
    }

    /**
     * Deletes a reservation
     * @param {string|number} reservationId - ID of the reservation to delete
     * @returns {Promise<Object>} Response data
     */
    static async deleteReservation(reservationId) {
      try {
        const data = await this.request(`reservations&id=${encodeURIComponent(reservationId)}`, {
          method: 'DELETE'
        });

        Utilities.log('Reservation deleted successfully', data);
        return data;
      } catch (error) {
        Utilities.logError('Deleting reservation failed', error);
        throw error;
      }
    }

    /**
     * Archives and deletes a reservation
     * @param {string|number} reservationId - ID of the reservation to archive
     * @returns {Promise<Object>} Response data
     */
    static async archiveAndDeleteReservation(reservationId) {
      try {
        const data = await this.request(`archiveAndDelete&id=${encodeURIComponent(reservationId)}`, {
          method: 'POST'
        });

        Utilities.log('Reservation archived and deleted successfully', data);
        return data;
      } catch (error) {
        Utilities.logError('Archiving and deleting reservation failed', error);
        throw error;
      }
    }

    /**
     * Deletes an archived reservation
     * @param {string|number} reservationId - ID of the archived reservation to delete
     * @returns {Promise<Object>} Response data
     */
    static async deleteArchivedReservation(reservationId) {
      try {
        const data = await this.request(`deleteArchive&id=${encodeURIComponent(reservationId)}`, {
          method: 'DELETE'
        });

        Utilities.log('Archived reservation deleted successfully', data);
        return data;
      } catch (error) {
        Utilities.logError('Deleting archived reservation failed', error);
        throw error;
      }
    }
  }

  /**
   * ReservationManager class to handle all reservation-related functionality
   */
  class ReservationManager {
    constructor() {
      /**
       * Available tap types and their corresponding taps
       * @type {Object}
       */
      this.allTaps = {
        'FS': ['FS 1', 'FS 2', 'FS 3', 'FS 4', 'FS 5', 'FS 6', 'FS 7', 'FS 8', 'FS 9', 'FS 10'],
        'T1': ['T1-1', 'T1-2', 'T1-3', 'T1-4', 'T1-5', 'T1-6', 'T1-7', 'T1-8', 'T1-9', 'T1-10', 'T1-11', 'T1-12', 'T1-13', 'T1-14', 'T1-15'],
        'T2': ['T2-1', 'T2-2', 'T2-3', 'T2-4'],
        'Tonneau': ['Tonneau 1', 'Tonneau 2', 'Tonneau 3'],
        'Bertha': ['Bertha 1', 'Bertha 2'],
        'Festoche': ['Festoche 1'],
        'Picolo': ['Picolo 1']
      };

      /**
       * ID of the reservation currently being edited
       * @type {string|null}
       */
      this.currentEditingId = null;

      // Initialize the UI components
      this.initStyles();
    }

    /**
     * Initializes the application when DOM is loaded
     */
    init() {
      this.updateReservationsDisplay();
      this.loadReservations();
      this.setupEventListeners();
    }

    /**
     * Sets up all event listeners for the application
     */
    setupEventListeners() {
      // Add reservation button
      const addReservationBtn = document.getElementById('addReservationBtn');
      if (addReservationBtn) {
        addReservationBtn.addEventListener('click', () => this.openNewReservationModal());
      }

      // Save reservation button
      const saveReservationBtn = document.getElementById('saveReservation');
      if (saveReservationBtn) {
        saveReservationBtn.addEventListener('click', () => this.handleReservationSubmit());
      }

      // Tap type select
      const tapTypeSelect = document.getElementById('tapType');
      if (tapTypeSelect) {
        tapTypeSelect.addEventListener('change', () => this.generateTapSelect());
      }

      // Date inputs
      const startDateInput = document.getElementById('startDate');
      if (startDateInput) {
        startDateInput.addEventListener('change', () => {
          this.generateTapSelect();
          this.updateEquipmentAvailability(
            startDateInput.value,
            document.getElementById('endDate').value,
            this.currentEditingId
          );
        });
      }

      const endDateInput = document.getElementById('endDate');
      if (endDateInput) {
        endDateInput.addEventListener('change', () => {
          this.generateTapSelect();
          this.updateEquipmentAvailability(
            document.getElementById('startDate').value,
            endDateInput.value,
            this.currentEditingId
          );
        });
      }

      // Add beer entry button
      const addBeerBtn = document.getElementById('addBeer');
      if (addBeerBtn) {
        addBeerBtn.addEventListener('click', () => this.addBeerEntry());
      }

      // Initialize accordions if they exist
      const accordionElements = document.querySelectorAll('.accordion-collapse');
      if (accordionElements.length > 0) {
        accordionElements.forEach(element => {
          new bootstrap.Collapse(element, { toggle: false });
        });
      }
    }

    /**
     * Adds Bootstrap-compatible styles for reservation status
     */
    initStyles() {
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        /* Target Bootstrap's custom property mechanism */
        tr.${CONFIG.RESERVATION_STATUS.ACTIVE} {
          --bs-table-accent-bg: rgba(25, 135, 84, 0.15) !important;
          --bs-table-bg-type: rgba(25, 135, 84, 0.15) !important;
          --bs-table-bg-state: rgba(25, 135, 84, 0.15) !important;
          --bs-table-bg: rgba(25, 135, 84, 0.15) !important;
        }

        tr.${CONFIG.RESERVATION_STATUS.EXPIRED} {
          --bs-table-accent-bg: rgba(220, 53, 69, 0.15) !important;
          --bs-table-bg-type: rgba(220, 53, 69, 0.15) !important;
          --bs-table-bg-state: rgba(220, 53, 69, 0.15) !important;
          --bs-table-bg: rgba(220, 53, 69, 0.15) !important;
        }

        /* Override the box-shadow approach for maximum compatibility */
        tr.${CONFIG.RESERVATION_STATUS.ACTIVE} > *,
        tr.${CONFIG.RESERVATION_STATUS.EXPIRED} > * {
          box-shadow: none !important;
        }

        /* Apply direct background-color as a fallback */
        tr.${CONFIG.RESERVATION_STATUS.ACTIVE} > * {
          background-color: rgba(25, 135, 84, 0.15) !important;
        }

        tr.${CONFIG.RESERVATION_STATUS.EXPIRED} > * {
          background-color: rgba(220, 53, 69, 0.15) !important;
        }
      `;
      document.head.appendChild(styleElement);
    }

    /**
     * Determines the status class of a reservation based on its dates
     * @param {Object} reservation - Reservation object
     * @returns {string} CSS class name for the reservation status
     */
    getReservationStatusClass(reservation) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

      const startDate = new Date(`${reservation.startDate}T00:00:00`);
      const endDate = new Date(`${reservation.endDate}T23:59:59`);

      // If end date has passed, reservation is expired
      if (endDate < today) {
        return CONFIG.RESERVATION_STATUS.EXPIRED;
      }

     if (startDate <= today) {
        return CONFIG.RESERVATION_STATUS.ACTIVE;
      }

      // If start date has passed but end date hasn't, reservation is active
      if (startDate <= today && endDate >= today) {
        return CONFIG.RESERVATION_STATUS.ACTIVE;
      }

      // Otherwise, it's an upcoming reservation
      return CONFIG.RESERVATION_STATUS.UPCOMING;
    }

    /**
     * Fetches beer list from the API
     * @returns {Promise<string[]>} List of beer names
     */
    async getBeerList() {
      return await ApiService.getBeerInventory();
    }

    /**
     * Generates HTML options for beer selection
     * @param {string|null} currentBeerType - Currently selected beer type
     * @returns {Promise<string>} HTML options string
     */
    async generateBeerSelectOptions(currentBeerType = null) {
      const allBeers = await this.getBeerList();

      if (!Array.isArray(allBeers)) {
        Utilities.logError('allBeers is not an array', allBeers);
        return `<option value="" selected>${CONFIG.TRANSLATIONS.NO_BEER_AVAILABLE}</option>`;
      }

      return `<option value="" selected>${CONFIG.TRANSLATIONS.CHOOSE_BEER}</option>` +
        allBeers.map(beer =>
          `<option value="${beer}" ${beer === currentBeerType ? 'selected' : ''}>${beer}</option>`
        ).join('');
    }

    /**
     * Adds a new beer entry to the form
     * @param {string} beerType - Type of beer
     * @param {number} beerQuantity - Quantity of beer
     * @returns {Promise<void>}
     */
    async addBeerEntry(beerType = '', beerQuantity = 1) {
      const beerContainer = document.getElementById('beerContainer');

      if (!beerContainer) {
        Utilities.logError('Beer container not found!');
        return;
      }

      const beerSelectOptions = await this.generateBeerSelectOptions(beerType);

      const beerEntry = Utilities.createElement('div',
        { className: ['beer-entry', 'row', 'mb-2'] },
        {},
        `
          <div class="col-md-5">
            <select class="form-select beerType">
              ${beerSelectOptions}
            </select>
          </div>
          <div class="col-md-4">
            <input type="number" class="form-control beerQuantity" value="${beerQuantity}" min="1">
          </div>
          <div class="col-md-3">
            <button type="button" class="btn btn-danger removeBeer">Supprimer</button>
          </div>
        `
      );

      beerContainer.appendChild(beerEntry);

      // Add event listener for beer removal
      beerEntry.querySelector('.removeBeer').addEventListener('click', () => {
        beerEntry.remove();
      });
    }

    /**
     * Opens the reservation modal for creating or editing
     * @param {string|null} reservationId - ID of reservation to edit
     * @returns {Promise<void>}
     */
    async openNewReservationModal(reservationId = null) {
      Utilities.log('Opening modal for reservation ID', reservationId);

      const modalTitle = document.getElementById('modalTitle');
      const form = document.getElementById('reservationForm');
      const beerContainer = document.getElementById('beerContainer');

      // Store the current editing ID
      this.currentEditingId = reservationId;

      // Clear previous beer entries
      beerContainer.innerHTML = '';

      const reservations = await ApiService.getReservations();
      Utilities.log('Reservations in modal', reservations);

      if (!Array.isArray(reservations)) {
        Utilities.logError('getReservations() did not return an array', reservations);
        return;
      }

      if (reservationId) {
        const reservation = reservations.find(r => r.id == reservationId);

        if (!reservation) {
          Utilities.logError('Reservation not found');
          return;
        }

        // Populate form with reservation data
        modalTitle.textContent = CONFIG.TRANSLATIONS.EDIT_RESERVATION;
        form.clientName.value = reservation.clientName;
        form.clientPhone.value = reservation.clientPhone;
        form.startDate.value = reservation.startDate;
        form.endDate.value = reservation.endDate;
        form.tapType.value = reservation.tapType;

        await this.generateTapSelect(reservation.tapNumber);
        form.tapNumber.value = reservation.tapNumber;

        // Add beer entries
        for (const beer of reservation.beers) {
          await this.addBeerEntry(beer.type, beer.quantity);
        }

        // Set options and comments
        form.barnumOption.checked = reservation.barnumOption;
        form.barnum2Option.checked = reservation.barnum2Option;
        form.photoBoothOption.checked = reservation.photoBoothOption;
        form.comment.value = reservation.comment;
        document.getElementById('annualReservation').checked = reservation.isAnnual === 1;
        form.dataset.editingId = reservation.id;
      } else {
        // Reset form for new reservation
        modalTitle.textContent = CONFIG.TRANSLATIONS.NEW_RESERVATION;
        form.reset();
        form.dataset.editingId = '';
        await this.addBeerEntry();
      }

      // Update equipment availability
      await this.updateEquipmentAvailability(
        form.startDate.value,
        form.endDate.value,
        reservationId
      );

      // Show the modal
      const modal = Utilities.getModalInstance('reservationModal');
      modal.show();
    }

    /**
     * Handles form submission for creating or updating a reservation
     * @returns {Promise<void>}
     */
    async handleReservationSubmit() {
      const form = document.getElementById('reservationForm');
      if (!form) {
        Utilities.logError('Reservation form not found!');
        return;
      }

      // Get form data
      const reservation = {
        id: form.dataset.editingId || null,
        clientName: form.clientName.value,
        clientPhone: form.clientPhone.value,
        startDate: form.startDate.value,
        endDate: form.endDate.value,
        tapType: form.tapType.value,
        tapNumber: form.tapNumber.value,
        beers: Array.from(document.querySelectorAll('.beer-entry'))
          .map(entry => ({
            type: entry.querySelector('.beerType').value,
            quantity: parseInt(entry.querySelector('.beerQuantity').value, 10) || 1
          }))
          .filter(beer => beer.type !== ''),
        barnumOption: form.barnumOption.checked,
        barnum2Option: form.barnum2Option.checked,
        photoBoothOption: form.photoBoothOption.checked,
        comment: form.comment.value,
        isAnnual: document.getElementById('annualReservation').checked ? 1 : 0
      };

      Utilities.log('New Reservation Data Sent', reservation);

      try {
        await ApiService.saveReservation(reservation);
        await this.updateReservationsDisplay();

        // Close the modal
        Utilities.getModalInstance('reservationModal').hide();
      } catch (error) {
        alert(`Error saving reservation: ${error.message}`);
      }
    }

    /**
     * Loads and displays all reservations
     * @returns {Promise<void>}
     */
    async loadReservations() {
      const reservations = await ApiService.getReservations();

      const annualTableBody = document.getElementById('annualReservationsTableBody');
      const regularTableBody = document.getElementById('regularReservationsTableBody');

      // Clear existing table data
      annualTableBody.innerHTML = '';
      regularTableBody.innerHTML = '';

      // Add reservation rows to appropriate tables
      reservations.forEach(reservation => {
        const row = this.createReservationRow(reservation);
        if (reservation.isAnnual) {
          annualTableBody.appendChild(row);
        } else {
          regularTableBody.appendChild(row);
        }
      });

      // Update the reservation count badges
      document.querySelector('#annualReservationsHeader button span').textContent =
        reservations.filter(r => r.isAnnual).length;
      document.querySelector('#regularReservationsHeader button span').textContent =
        reservations.filter(r => !r.isAnnual).length;
    }

    /**
     * Updates the display of reservations and archived reservations
     * @returns {Promise<void>}
     */
    async updateReservationsDisplay() {
      const reservations = await ApiService.getReservations();
      const archivedReservations = await ApiService.getArchivedReservations();

      if (!Array.isArray(reservations) || !Array.isArray(archivedReservations)) {
        Utilities.logError('Invalid reservations data', { reservations, archivedReservations });
        return;
      }

      Utilities.log('Reservations Data', reservations);
      Utilities.log('Archived Reservations Data', archivedReservations);

      const annualTableBody = document.getElementById('annualReservationsTableBody');
      const regularTableBody = document.getElementById('regularReservationsTableBody');
      const archivedTableBody = document.getElementById('archivedReservationsTableBody');

      // Clear all tables
      annualTableBody.innerHTML = '';
      regularTableBody.innerHTML = '';
      archivedTableBody.innerHTML = '';

      // Populate active reservations
      reservations.forEach(reservation => {
        const row = this.createReservationRow(reservation);
        if (reservation.isAnnual === 1) {
          annualTableBody.appendChild(row);
        } else {
          regularTableBody.appendChild(row);
        }
      });

      // Populate archived reservations
      archivedReservations.forEach(reservation => {
        const row = this.createArchivedReservationRow(reservation);
        archivedTableBody.appendChild(row);
      });

      // Update counts
      document.querySelector('#annualReservationsHeader button span').textContent =
        reservations.filter(r => r.isAnnual === 1).length;
      document.querySelector('#regularReservationsHeader button span').textContent =
        reservations.filter(r => r.isAnnual === 0).length;
      document.querySelector('#archivedReservationsHeader button span').textContent =
        archivedReservations.length;
    }

    /**
     * Creates a table row for a reservation
     * @param {Object} reservation - Reservation data
     * @returns {HTMLTableRowElement} Table row element
     */
    createReservationRow(reservation) {
      const row = document.createElement('tr');

      // Add status class
      const statusClass = this.getReservationStatusClass(reservation);
      if (statusClass) {
        row.classList.add(statusClass);
      }

      // Format equipment options
      const equipmentOptions = [
        reservation.barnumOption ? CONFIG.TRANSLATIONS.EQUIPMENT.BARNUM_3X3 : '',
        reservation.barnum2Option ? CONFIG.TRANSLATIONS.EQUIPMENT.BARNUM_3X6 : '',
        reservation.photoBoothOption ? CONFIG.TRANSLATIONS.EQUIPMENT.PHOTO_BOOTH : ''
      ].filter(Boolean).join(' ');

      // Format beer list
      const beerList = reservation.beers
        .map(beer => `${beer.quantity} × ${beer.type}`)
        .join('<br>');

      row.innerHTML = `
        <td>${reservation.clientName}</td>
        <td>${reservation.clientPhone || '-'}</td>
        <td>${Utilities.formatDate(reservation.startDate)}</td>
        <td>${Utilities.formatDate(reservation.endDate)}</td>
        <td>${reservation.tapNumber}</td>
        <td>${beerList}</td>
        <td>${equipmentOptions || '-'}</td>
        <td>${reservation.comment || '-'}</td>
        <td>
          <button class="btn btn-sm btn-primary edit-btn" data-id="${reservation.id}">Modifier</button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${reservation.id}">Supprimer</button>
          <button class="btn btn-sm btn-warning archive-btn" data-id="${reservation.id}">Archiver</button>
        </td>
      `;

      // Add event listeners
      row.querySelector('.edit-btn').addEventListener('click', (e) => {
        this.openNewReservationModal(e.target.dataset.id);
      });

      row.querySelector('.delete-btn').addEventListener('click', (e) => {
        this.deleteReservation(e.target.dataset.id);
      });

      row.querySelector('.archive-btn').addEventListener('click', (e) => {
        this.archiveAndDeleteReservation(e.target.dataset.id);
      });

      return row;
    }

/**
 * Creates a table row for an archived reservation
 * @param {Object} reservation - Archived reservation data
 * @returns {HTMLTableRowElement} Table row element
 */
createArchivedReservationRow(reservation) {
    const row = document.createElement('tr');

    // Format equipment options
    const equipmentOptions = [
      reservation.barnumOption ? CONFIG.TRANSLATIONS.EQUIPMENT.BARNUM_3X3 : '',
      reservation.barnum2Option ? CONFIG.TRANSLATIONS.EQUIPMENT.BARNUM_3X6 : '',
      reservation.photoBoothOption ? CONFIG.TRANSLATIONS.EQUIPMENT.PHOTO_BOOTH : ''
    ].filter(Boolean).join(' ');

    // Format beer list
    const beerList = reservation.beers
      .map(beer => `${beer.quantity} × ${beer.type}`)
      .join('<br>');

    row.innerHTML = `
      <td>${reservation.clientName}</td>
      <td>${reservation.clientPhone || '-'}</td>
      <td>${Utilities.formatDate(reservation.startDate)}</td>
      <td>${Utilities.formatDate(reservation.endDate)}</td>
      <td>${reservation.tapNumber}</td>
      <td>${beerList}</td>
      <td>${equipmentOptions || '-'}</td>
      <td>${reservation.comment || '-'}</td>
      <td>
        <button class="btn btn-sm btn-danger delete-archived-btn" data-id="${reservation.id}">Supprimer</button>
      </td>
    `;

    // Add event listener for delete button
    row.querySelector('.delete-archived-btn').addEventListener('click', (e) => {
      this.deleteArchivedReservation(e.target.dataset.id);
    });

    return row;
  }

  /**
   * Deletes a reservation after confirmation
   * @param {string|number} reservationId - ID of the reservation to delete
   * @returns {Promise<void>}
   */
  async deleteReservation(reservationId) {
    if (!confirm(CONFIG.TRANSLATIONS.DELETE_CONFIRM)) return;

    Utilities.log('Attempting to delete reservation ID', reservationId);

    try {
      await ApiService.deleteReservation(reservationId);
      await this.updateReservationsDisplay();
    } catch (error) {
      alert(`${CONFIG.TRANSLATIONS.DELETE_ERROR} ${error.message}`);
    }
  }

  /**
   * Archives and deletes a reservation after confirmation
   * @param {string|number} reservationId - ID of the reservation to archive
   * @returns {Promise<void>}
   */
  async archiveAndDeleteReservation(reservationId) {
    if (!confirm(CONFIG.TRANSLATIONS.ARCHIVE_CONFIRM)) return;

    Utilities.log('Archiving and deleting reservation ID', reservationId);

    try {
      await ApiService.archiveAndDeleteReservation(reservationId);
      await this.updateReservationsDisplay();
    } catch (error) {
      alert(`${CONFIG.TRANSLATIONS.ARCHIVE_ERROR} ${error.message}`);
    }
  }

  /**
   * Deletes an archived reservation after confirmation
   * @param {string|number} reservationId - ID of the archived reservation to delete
   * @returns {Promise<void>}
   */
  async deleteArchivedReservation(reservationId) {
    if (!confirm(CONFIG.TRANSLATIONS.DELETE_ARCHIVE_CONFIRM)) return;

    Utilities.log('Attempting to delete archived reservation ID', reservationId);

    try {
      await ApiService.deleteArchivedReservation(reservationId);
      await this.updateReservationsDisplay();
    } catch (error) {
      alert(`${CONFIG.TRANSLATIONS.DELETE_ERROR} ${error.message}`);
    }
  }

  /**
   * Generates the tap select dropdown based on availability
   * @param {string|null} currentTapNumber - Currently selected tap number
   * @returns {Promise<void>}
   */
  async generateTapSelect(currentTapNumber = null) {
    const tapType = document.getElementById('tapType').value;
    const tapNumberSelect = document.getElementById('tapNumber');

    if (!tapType) {
      tapNumberSelect.innerHTML = `<option value="" selected>${CONFIG.TRANSLATIONS.CHOOSE_TAP}</option>`;
      return;
    }

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reservations = await ApiService.getReservations();

    if (!Array.isArray(reservations)) {
      Utilities.logError('getReservations() did not return an array', reservations);
      return;
    }

    // Find which taps are already booked for the selected date range
    const usedTaps = new Set(
      reservations.filter(res =>
        res.tapType === tapType &&
        !(new Date(res.endDate) < new Date(startDate) || new Date(res.startDate) > new Date(endDate)) &&
        res.id !== this.currentEditingId
      ).map(res => res.tapNumber)
    );

    const availableTaps = [];
    const reservedTaps = [];

    if (this.allTaps[tapType]) {
      this.allTaps[tapType].forEach(tap => {
        if (usedTaps.has(tap)) {
          reservedTaps.push(tap);
        } else {
          availableTaps.push(tap);
        }
      });
    }

    tapNumberSelect.innerHTML = `
      <option value="" selected>${CONFIG.TRANSLATIONS.CHOOSE_TAP}</option>
      <optgroup label="${CONFIG.TRANSLATIONS.AVAILABILITY.AVAILABLE}">
        ${availableTaps.map(tap => `<option value="${tap}">${tap}</option>`).join('')}
      </optgroup>
      <optgroup label="${CONFIG.TRANSLATIONS.AVAILABILITY.RESERVED}">
        ${reservedTaps.map(tap => `<option value="${tap}" disabled>${tap}</option>`).join('')}
      </optgroup>
    `;

    // Set the selected tap if editing a reservation
    if (currentTapNumber) {
      tapNumberSelect.value = currentTapNumber;
    }
}

/**
   * Updates the equipment availability based on date range
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {string|null} currentReservationId - ID of the current reservation being edited
   * @returns {Promise<void>}
   */
async updateEquipmentAvailability(startDate, endDate, currentReservationId = null) {
    if (!startDate || !endDate) return;

    const reservations = await ApiService.getReservations();

    if (!Array.isArray(reservations)) {
        Utilities.logError('Invalid reservations data', reservations);
        return;
    }

    let barnum3x3Reserved = false;
    let barnum3x6Reserved = false;
    let photoBoothReserved = false;

    reservations.forEach(reservation => {
      // Skip the current reservation if we're editing
    if (currentReservationId && reservation.id == currentReservationId) return;

        const resStart = new Date(reservation.startDate);
        const resEnd = new Date(reservation.endDate);
        const selectedStart = new Date(startDate);
        const selectedEnd = new Date(endDate);

      // Check if dates overlap
        const isOverlapping = !(resEnd < selectedStart || resStart > selectedEnd);

    if (isOverlapping) {
        if (reservation.barnumOption) barnum3x3Reserved = true;
        if (reservation.barnum2Option) barnum3x6Reserved = true;
        if (reservation.photoBoothOption) photoBoothReserved = true;
    }
    });

    // Disable options if already reserved
    const barnumOption = document.getElementById('barnumOption');
    const barnum2Option = document.getElementById('barnum2Option');
    const photoBoothOption = document.getElementById('photoBoothOption');

    if (barnumOption) barnumOption.disabled = barnum3x3Reserved;
    if (barnum2Option) barnum2Option.disabled = barnum3x6Reserved;
    if (photoBoothOption) photoBoothOption.disabled = photoBoothReserved;

    // If an option is disabled and checked, uncheck it
    if (barnum3x3Reserved && barnumOption && barnumOption.checked) {
      barnumOption.checked = false;
    }

    if (barnum3x6Reserved && barnum2Option && barnum2Option.checked) {
      barnum2Option.checked = false;
    }

    if (photoBoothReserved && photoBoothOption && photoBoothOption.checked) {
      photoBoothOption.checked = false;
    }
  }
  }

  /**
   * Initialize the application when DOM is loaded
   */
  document.addEventListener('DOMContentLoaded', () => {
    const reservationManager = new ReservationManager();
    reservationManager.init();

    // Make the manager globally accessible for inline event handlers
    // This is a compromise for backward compatibility with the original code
    window.reservationManager = reservationManager;

    // Add global methods for inline event handlers
    window.openNewReservationModal = (id) => reservationManager.openNewReservationModal(id);
    window.deleteReservation = (id) => reservationManager.deleteReservation(id);
    window.archiveAndDeleteReservation = (id) => reservationManager.archiveAndDeleteReservation(id);
    window.deleteArchivedReservation = (id) => reservationManager.deleteArchivedReservation(id);
});