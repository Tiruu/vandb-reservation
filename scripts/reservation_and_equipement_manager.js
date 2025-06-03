

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
        'FS': Array.from({ length: 10 }, (_, i) => `FS-${i + 1}`),
        'T1': Array.from({ length: 15 }, (_, i) => `T1-${i + 1}`),
        'T2': Array.from({ length: 4 }, (_, i) => `T2-${i + 1}`),
        'Tonneau': Array.from({ length: 3 }, (_, i) => `Tonneau ${i + 1}`),
        'Bertha': Array.from({ length: 2 }, (_, i) => `Bertha ${i + 1}`),
        'Festoche': Array.from({ length: 2 }, (_, i) => `Festoche ${i + 1}`),
        'Picolo': ['Picolo 1']
      };

      /**
       * ID of the reservation currently being edited
       * @type {string|null}
       */
      this.currentEditingId = null;
      this.tapEntries = []; // to keep track of all tap entries
      this.initStyles();
    }

    /**
     * Initializes the application when DOM is loaded
     */
    init() {
      this.updateReservationsDisplay();
      this.loadReservations();
      this.setupEventListeners();

      // Only add the initial tap entry if we're on the reservation form page
      if (document.getElementById('tapEntriesContainer')) {
        this.addTapEntry();
      }
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

      // Add tap entry button
      const addTapBtn = document.getElementById('addTapBtn');
      if (addTapBtn) {
        addTapBtn.addEventListener('click', () => this.addTapEntry());
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
          --bs-table-accent-bg: rgba(58, 143, 140, 0.40) !important;
          --bs-table-bg-type: rgba(58, 143, 140, 0.40) !important;
          --bs-table-bg-state: rgba(58, 143, 140, 0.40) !important;
          --bs-table-bg: rgba(58, 143, 140, 0.40) !important;
        }

        tr.${CONFIG.RESERVATION_STATUS.EXPIRED} {
          --bs-table-accent-bg: rgba(233, 96, 41, 0.40) !important;
          --bs-table-bg-type: rgba(233, 96, 41, 0.40) !important;
          --bs-table-bg-state: rgba(233, 96, 41, 0.40) !important;
          --bs-table-bg: rgba(233, 96, 41, 0.40) !important;
        }

        /* Override the box-shadow approach for maximum compatibility */
        tr.${CONFIG.RESERVATION_STATUS.ACTIVE} > *,
        tr.${CONFIG.RESERVATION_STATUS.EXPIRED} > * {
          box-shadow: none !important;
        }

        /* Apply direct background-color as a fallback */
        tr.${CONFIG.RESERVATION_STATUS.ACTIVE} > * {
          background-color: rgba(58, 143, 140, 0.40) !important;
        }

        tr.${CONFIG.RESERVATION_STATUS.EXPIRED} > * {
          background-color: rgba(233, 96, 41, 0.40 0.40) !important;
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
     * Adds a new tap entry directly beneath the last one
     * @returns {HTMLElement} The created tap entry container
     */
    addTapEntry() {
      // Generating a unique index for each tap entry for better control
      const tapIndex = this.tapEntries.length;

      // Creating the container for a new tap entry
      const tapContainer = document.createElement('div');
      tapContainer.className = 'tap-entry row mt-3';
      tapContainer.innerHTML = `
          <div class="col-md-5">
              <select class="form-select tapType" id="tapType-${tapIndex}">
                  <option value="">Choisir un type de tireuse...</option>
                  ${Object.keys(this.allTaps).map(type => `<option value="${type}">${type}</option>`).join('')}
              </select>
          </div>
          <div class="col-md-4">
              <select class="form-select tapNumber" id="tapNumber-${tapIndex}">
                  <option value="">Choisir une tireuse...</option>
              </select>
          </div>
          <div class="col-md-3 d-flex align-items-center">
              <button type="button" class="btn btn-danger removeTap">Supprimer</button>
          </div>
      `;

      // Get the container for tap entries
      const tapEntriesContainer = document.getElementById('tapEntriesContainer');
      tapEntriesContainer.appendChild(tapContainer);

      // Add event listener for tap removal
      const removeButton = tapContainer.querySelector('.removeTap');
      removeButton.addEventListener('click', () => {
          this.removeTapEntry(tapIndex);
      });

      // Add event listener for tap type selection
      const tapTypeSelect = tapContainer.querySelector('.tapType');
      tapTypeSelect.addEventListener('change', () => {
          const currentIndex = Array.from(tapEntriesContainer.children).indexOf(tapContainer);
          this.generateTapSelect(currentIndex);
      });

      // Save this entry in the array for management
      this.tapEntries.push(tapContainer);

      return tapContainer;
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
      const tapEntriesContainer = document.getElementById('tapEntriesContainer');

      // Clear previous entries
      beerContainer.innerHTML = '';
      tapEntriesContainer.innerHTML = '';
      this.tapEntries = []; // Reset tap entries array
      this.currentEditingId = reservationId;

      const reservations = await ApiService.getReservations();
      Utilities.log('Reservations in modal', reservations);

      if (!Array.isArray(reservations)) {
          Utilities.logError('getReservations() did not return an array', reservations);
          return;
      }

      if (reservationId) {
          const reservation = reservations.find(r => r.id === reservationId);
          if (!reservation) {
              Utilities.logError('Reservation not found');
              return;
          }

          // Populate form with reservation data
          modalTitle.textContent = CONFIG.TRANSLATIONS.EDIT_RESERVATION;
          form.raisonSociale.value = reservation.raisonSociale;
          form.clientName.value = reservation.clientName;
          form.clientPhone.value = reservation.clientPhone;
          form.startDate.value = reservation.startDate;
          form.endDate.value = reservation.endDate;

          // Populate taps safely
          if (reservation.taps && Array.isArray(reservation.taps) && reservation.taps.length > 0) {
              // Clear the container first to avoid duplicates
              tapEntriesContainer.innerHTML = '';
              this.tapEntries = [];
              
              // Add each tap entry from the reservation
              for (let i = 0; i < reservation.taps.length; i++) {
                  const tap = reservation.taps[i];
                  this.addTapEntry(); // This adds to this.tapEntries array
                  
                  // Get the newly added entry (the last one in the array)
                  const entry = this.tapEntries[this.tapEntries.length - 1];
                  const typeSelect = entry.querySelector('.tapType');
                  const numberSelect = entry.querySelector('.tapNumber');
                  
                  if (typeSelect && numberSelect) {
                      typeSelect.value = tap.type;
                      
                      // Populate the number options based on type
                      if (this.allTaps[tap.type]) {
                          numberSelect.innerHTML = '';
                          const defaultOption = document.createElement('option');
                          defaultOption.value = '';
                          defaultOption.textContent = CONFIG.TRANSLATIONS.CHOOSE_TAP;
                          numberSelect.appendChild(defaultOption);
                          
                          this.allTaps[tap.type].forEach(number => {
                              const option = document.createElement('option');
                              option.value = number;
                              option.textContent = number;
                              option.selected = (number === tap.number);
                              numberSelect.appendChild(option);
                          });
                      }
                      
                      // Set the number value directly
                      numberSelect.value = tap.number;
                  }
              }
          }

          // Add beer entries
          if (reservation.beers && Array.isArray(reservation.beers)) {
              reservation.beers.forEach(beer => {
                  this.addBeerEntry(beer.type, beer.quantity);
              });
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

    // Gather taps if container exists
    let taps = [];
    const tapEntriesContainer = document.getElementById('tapEntriesContainer');
    if (tapEntriesContainer) {
      const tapEntryElements = tapEntriesContainer.querySelectorAll('.tap-entry');
      taps = Array.from(tapEntryElements)
        .map(entry => {
          const tapTypeEl = entry.querySelector('.tapType');
          const tapNumberEl = entry.querySelector('.tapNumber');
          if (!tapTypeEl || !tapNumberEl || !tapTypeEl.value || !tapNumberEl.value) return null;
          return { type: tapTypeEl.value, number: tapNumberEl.value };
        })
        .filter(t => t !== null);
    }

    // Gather beers
    const beerEntries = document.querySelectorAll('.beer-entry');
    const beers = Array.from(beerEntries)
      .map(entry => ({
        type: entry.querySelector('.beerType')?.value,
        quantity: parseInt(entry.querySelector('.beerQuantity')?.value, 10) || 1
      }))
      .filter(b => b.type);

    // Read form fields by ID
    const reservation = {
      id:          form.dataset.editingId || null,
      raisonSociale: document.getElementById('raisonSociale')?.value.trim() || '',
      clientName:    document.getElementById('clientName')?.value.trim() || '',
      clientPhone:   document.getElementById('clientPhone')?.value.trim() || '',
      startDate:     document.getElementById('startDate')?.value || '',
      endDate:       document.getElementById('endDate')?.value || '',
      taps,
      beers,
      barnumOption:    document.getElementById('barnumOption')?.checked ? 1 : 0,
      barnum2Option:   document.getElementById('barnum2Option')?.checked ? 1 : 0,
      photoBoothOption:document.getElementById('photoBoothOption')?.checked ? 1 : 0,
      comment:         document.getElementById('comment')?.value || '',
      isAnnual:        document.getElementById('annualReservation')?.checked ? 1 : 0
    };

    Utilities.log('Data Sent to API (saveReservation)', reservation);

    try {
      await ApiService.saveReservation(reservation);
      await this.updateReservationsDisplay();
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
      const regularTbody = document.getElementById('regularReservationsTableBody');
      const annualTbody = document.getElementById('annualReservationsTableBody');

      if (regularTbody) regularTbody.innerHTML = '';
      if (annualTbody)  annualTbody.innerHTML  = '';

      reservations.forEach(reservation => {
        const row = this.createReservationRow(reservation);
        if (reservation.isAnnual === 1) {
          if (annualTbody) annualTbody.appendChild(row);
        } else {
          if (regularTbody) regularTbody.appendChild(row);
        }
      });

      // Update badges safely
      const regularBadge = document.querySelector('#regularReservationsHeader button span');
      if (regularBadge) regularBadge.textContent = reservations.filter(r => r.isAnnual === 0).length;
      const annualBadge = document.querySelector('#annualReservationsHeader button span');
      if (annualBadge)  annualBadge.textContent  = reservations.filter(r => r.isAnnual === 1).length;
    }


    /**
     * Updates the display of reservations and archived reservations
     * @returns {Promise<void>}
     */
  async updateReservationsDisplay() {
    const reservations = await ApiService.getReservations();
    const archived = await ApiService.getArchivedReservations();

    const regularTbody = document.getElementById('regularReservationsTableBody');
    const annualTbody  = document.getElementById('annualReservationsTableBody');
    const archivedTbody = document.getElementById('archivedReservationsTableBody');

    if (regularTbody)   regularTbody.innerHTML   = '';
    if (annualTbody)    annualTbody.innerHTML    = '';
    if (archivedTbody)  archivedTbody.innerHTML  = '';

    reservations.forEach(res => {
      const row = this.createReservationRow(res);
      if (res.isAnnual === 1) {
        if (annualTbody) annualTbody.appendChild(row);
      } else {
        if (regularTbody) regularTbody.appendChild(row);
      }
    });

    archived.forEach(res => {
      const row = this.createArchivedReservationRow(res);
      if (archivedTbody) archivedTbody.appendChild(row);
    });

    // Update badges
    const regularBadge = document.querySelector('#regularReservationsHeader button span');
    if (regularBadge) regularBadge.textContent = reservations.filter(r => r.isAnnual === 0).length;
    const annualBadge = document.querySelector('#annualReservationsHeader button span');
    if (annualBadge)  annualBadge.textContent  = reservations.filter(r => r.isAnnual === 1).length;
    const archivedBadge = document.querySelector('#archivedReservationsHeader button span');
    if (archivedBadge) archivedBadge.textContent = archived.length;
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
      
      // Format tap list
      let tapDisplay = '-';
      if (Array.isArray(reservation.taps) && reservation.taps.length > 0) {
          tapDisplay = reservation.taps
              .map(tap => `${tap.number}`)
              .join('<br>');
      }

      row.innerHTML = `
          <td>${reservation.raisonSociale}</td>
          <td>${reservation.clientName}</td>
          <td>${reservation.clientPhone ? reservation.clientPhone.replace(/(\d{2})/g, '$1 ').trim() : '-'}</td>
          <td>${Utilities.formatDate(reservation.startDate)}</td>
          <td>${Utilities.formatDate(reservation.endDate)}</td>
          <td>${tapDisplay}</td>
          <td>${beerList}</td>
          <td>${equipmentOptions || '-'}</td>
          <td>${reservation.comment || '-'}</td>
          <td>
              <button class="btn btn-sm bg-blue-green edit-btn" data-id="${reservation.id}">Modifier</button>
              <button class="btn btn-sm bg-black delete-btn text-white" data-id="${reservation.id}">Supprimer</button>
              <button class="btn btn-sm bg-yellow archive-btn" data-id="${reservation.id}">Archiver</button>
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
      
      // Format tap list
      let tapDisplay = '-';
      if (Array.isArray(reservation.taps) && reservation.taps.length > 0) {
          tapDisplay = reservation.taps
              .map(tap => `${tap.number}`)
              .join('<br>');
      }

      row.innerHTML = `
          <td>${reservation.raisonSociale}</td>
          <td>${reservation.clientName}</td>
          <td>${reservation.clientPhone || '-'}</td>
          <td>${Utilities.formatDate(reservation.startDate)}</td>
          <td>${Utilities.formatDate(reservation.endDate)}</td>
          <td>${tapDisplay}</td>
          <td>${beerList}</td>
          <td>${equipmentOptions || '-'}</td>
          <td>${reservation.comment || '-'}</td>
          <td>
              <button class="btn btn-sm bg-orange delete-archived-btn" data-id="${reservation.id}">Supprimer</button>
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
   * @param {number} tapIndex - Index of the tap entry
   * @returns {Promise<void>}
   */
  async generateTapSelect(tapIndex) {
    // Get the actual elements from the DOM instead of relying on ID
    const tapEntriesContainer = document.getElementById('tapEntriesContainer');
    const tapEntryElements = tapEntriesContainer.querySelectorAll('.tap-entry');
    
    if (tapIndex >= tapEntryElements.length) {
        Utilities.logError(`Tap index ${tapIndex} is out of bounds`);
        return;
    }
    
    const tapEntry = tapEntryElements[tapIndex];
    const tapTypeSelect = tapEntry.querySelector('.tapType');
    const tapNumberSelect = tapEntry.querySelector('.tapNumber');

    if (!tapTypeSelect || !tapNumberSelect) {
        Utilities.logError('Tap selectors not found');
        return;
    }

    if (!tapTypeSelect.value) {
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

    // Find all taps of the selected type that are already reserved
    const usedTaps = new Set();
    
    reservations.forEach(res => {
        // Skip current reservation if we're editing
        if (res.id === this.currentEditingId) return;
        
        // Check date overlap
        const resStart = new Date(res.startDate);
        const resEnd = new Date(res.endDate);
        const selectedStart = new Date(startDate);
        const selectedEnd = new Date(endDate);
        
        const isOverlapping = !(resEnd < selectedStart || resStart > selectedEnd);
        
        // If dates overlap, add any taps of the selected type to usedTaps
        if (isOverlapping && Array.isArray(res.taps)) {
            res.taps.forEach(tap => {
                if (tap.type === tapTypeSelect.value) {
                    usedTaps.add(tap.number);
                }
            });
        }
    });

    const availableTaps = [];
    const reservedTaps = [];

    if (this.allTaps[tapTypeSelect.value]) {
        this.allTaps[tapTypeSelect.value].forEach(tap => {
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
            ${reservedTaps.map(tap => `<option value="${tap}" disabled="disabled">${tap}</option>`).join('')}
        </optgroup>
    `;
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

    updateTapNumbers(tapIndex, tapType) {
      const tapNumberSelect = document.getElementById(`tapNumber-${tapIndex}`);
      const options = this.allTaps[tapType].map(tap => `<option value="${tap}">${tap}</option>`).join('');
      tapNumberSelect.innerHTML = `<option value="">Choisir une tireuse...</option>${options}`;
    }
    /**
   * Removes a tap entry by index
   * @param {number} tapIndex - Index of the tap entry to remove
   */
    removeTapEntry(tapIndex) {
      // Find the tap entry element
      const tapEntryToRemove = this.tapEntries.find((_, index) => {
          const typeSelect = document.getElementById(`tapType-${index}`);
          return typeSelect && typeSelect.closest('.tap-entry') === this.tapEntries[tapIndex];
      });

      if (tapEntryToRemove) {
          // Remove from DOM
          tapEntryToRemove.remove();
          
          // Remove from array
          this.tapEntries = this.tapEntries.filter(entry => entry !== tapEntryToRemove);
          
          // Renumber remaining entries for consistency
          this.tapEntries.forEach((entry, newIndex) => {
              const oldTypeSelect = entry.querySelector('.tapType');
              const oldNumberSelect = entry.querySelector('.tapNumber');
              const oldIndex = oldTypeSelect.id.split('-')[1];
              
              // Update IDs
              oldTypeSelect.id = `tapType-${newIndex}`;
              oldNumberSelect.id = `tapNumber-${newIndex}`;
              
              // Update event listeners
              const removeBtn = entry.querySelector('.removeTap');
              removeBtn.replaceWith(removeBtn.cloneNode(true));
              entry.querySelector('.removeTap').addEventListener('click', () => {
                  this.removeTapEntry(newIndex);
              });
              
              // Ensure tap type change listener is updated
              oldTypeSelect.removeEventListener('change', () => this.generateTapSelect(oldIndex));
              oldTypeSelect.addEventListener('change', () => this.generateTapSelect(newIndex));
          });
      }
    }
  }


