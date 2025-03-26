/**
 * Brewery Inventory Management System
 *
 * A system for tracking beer inventory, equipment rentals, and reservations.
 * Provides functionality to manage beer types, track stock levels, and monitor
 * equipment availability for events.
 */

// Configuration
const API_BASE_URL = 'http://localhost/api.php';

// Cache for API responses to reduce redundant network requests
const apiCache = {
  reservations: { data: null, timestamp: 0 },
  inventory: { data: null, timestamp: 0 }
};

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Initializes the application when the DOM is fully loaded.
 * Sets up event listeners and populates initial data.
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Set up event listeners
  document.getElementById('addBeerTypeBtn').addEventListener('click', addBeerType);

  // Initialize the week start date to the current Monday
  const weekStartInput = document.getElementById('weekStartDate');
  weekStartInput.value = getMonday(new Date()).toISOString().split('T')[0];
  weekStartInput.addEventListener('change', updateInventoryDisplay);

  // Initial data loading
  try {
    await Promise.all([
      updateInventoryDisplay(),
      updateEquipmentDisplay()
    ]);
  } catch (error) {
    showError('Failed to initialize application', error);
  }
});

/**
 * API Interaction Functions
 * ------------------------------------------------------------------------
 */

/**
 * Fetches data from the API with caching support.
 *
 * @param {string} endpoint - The API endpoint to fetch from
 * @param {Object} cacheEntry - The cache entry to use
 * @param {boolean} bypassCache - Whether to bypass the cache
 * @returns {Promise<Object>} The API response data
 */
async function fetchWithCache(endpoint, cacheEntry, bypassCache = false) {
  // Check if we have valid cached data
  const now = Date.now();
  if (!bypassCache &&
      cacheEntry.data &&
      now - cacheEntry.timestamp < CACHE_EXPIRATION) {
    return cacheEntry.data;
  }

  try {
    const response = await fetch(`${API_BASE_URL}?type=${endpoint}`);

    // Handle non-OK responses
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const text = await response.text();

    // Handle empty responses
    if (!text.trim()) {
      return endpoint === 'inventory' ? {} : [];
    }

    // Parse JSON safely
    const data = JSON.parse(text);

    // Update cache
    cacheEntry.data = data;
    cacheEntry.timestamp = now;

    return data;
  } catch (error) {
    showError(`Failed to fetch from ${endpoint}`, error);
    return endpoint === 'inventory' ? {} : [];
  }
}

/**
 * Fetches all reservations from the API.
 *
 * @param {boolean} bypassCache - Whether to bypass the cache
 * @returns {Promise<Array>} Array of reservation objects
 */
async function getReservations(bypassCache = false) {
  const data = await fetchWithCache('reservations', apiCache.reservations, bypassCache);

  if (!Array.isArray(data)) {
    showError('API did not return an array for reservations', data);
    return [];
  }

  // Process each reservation to ensure beer data is correctly parsed
  return data.map(reservation => ({
    ...reservation,
    beers: parseBeers(reservation.beers)
  }));
}

/**
 * Fetches the current beer inventory from the API.
 *
 * @param {boolean} bypassCache - Whether to bypass the cache
 * @returns {Promise<Object>} Beer inventory data
 */
async function getBeerStock(bypassCache = false) {
  return await fetchWithCache('inventory', apiCache.inventory, bypassCache);
}

/**
 * Updates the stock level for a specific beer type.
 *
 * @param {string} beerType - The type of beer to update
 * @param {number} stock - The new stock level
 * @returns {Promise<boolean>} Success status
 */
async function saveBeerStock(beerType, stock) {
  try {
    const response = await fetch(`${API_BASE_URL}?type=beerStock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beerType, stock }),
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    // Invalidate the inventory cache
    apiCache.inventory.timestamp = 0;

    return true;
  } catch (error) {
    showError('Failed to save beer stock', error);
    return false;
  }
}

/**
 * Deletes a beer type from inventory.
 *
 * @param {string} beerType - The type of beer to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteBeerTypeFromInventory(beerType) {
  try {
    const response = await fetch(
      `${API_BASE_URL}?type=beerStock&beerType=${encodeURIComponent(beerType)}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    // Invalidate the inventory cache
    apiCache.inventory.timestamp = 0;

    return true;
  } catch (error) {
    showError('Failed to delete beer type', error);
    return false;
  }
}

/**
 * UI Update Functions
 * ------------------------------------------------------------------------
 */

/**
 * Updates the inventory display table with current data.
 */
async function updateInventoryDisplay() {
  const tableBody = document.getElementById('inventoryTableBody');
  const selectedMonday = new Date(document.getElementById('weekStartDate').value);

  try {
    // Clear the table before adding new rows
    tableBody.innerHTML = '';

    // Get the current beer stock data
    const beerStock = await getBeerStock(true);

    // Handle empty inventory
    if (Object.keys(beerStock).length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = 5;
      emptyCell.className = 'text-center';
      emptyCell.textContent = 'Aucun stock disponible';
      emptyRow.appendChild(emptyCell);
      tableBody.appendChild(emptyRow);
      return;
    }

    // Process each beer type and add to the table
    for (const [beerType, item] of Object.entries(beerStock)) {
      const stockReserved = await getBeerStockUsedOverTwoWeeks(beerType, selectedMonday);
      const realStock = Math.max(0, item.stock - stockReserved);

      // Create a new row for this beer type
      const row = createBeerInventoryRow(beerType, item.stock, stockReserved, realStock);
      tableBody.appendChild(row);
    }

    // Add event listeners for the edit and delete buttons
    attachInventoryEventListeners();
  } catch (error) {
    showError('Failed to update inventory display', error);
  }
}

/**
 * Creates a table row for a beer inventory item.
 *
 * @param {string} beerType - The type of beer
 * @param {number} stock - The theoretical stock level
 * @param {number} reserved - The amount reserved
 * @param {number} realStock - The actual available stock
 * @returns {HTMLTableRowElement} The created table row
 */
function createBeerInventoryRow(beerType, stock, reserved, realStock) {
  const row = document.createElement('tr');

  // Beer type cell
  const typeCell = document.createElement('td');
  typeCell.textContent = beerType;
  row.appendChild(typeCell);

  // Stock cell
  const stockCell = document.createElement('td');
  stockCell.textContent = stock;
  row.appendChild(stockCell);

  // Reserved cell
  const reservedCell = document.createElement('td');
  reservedCell.textContent = reserved;
  row.appendChild(reservedCell);

  // Real stock cell
  const realStockCell = document.createElement('td');
  realStockCell.textContent = realStock;
  row.appendChild(realStockCell);

  // Actions cell
  const actionsCell = document.createElement('td');

  // Edit button
  const editButton = document.createElement('button');
  editButton.className = 'btn btn-sm btn-primary edit-stock';
  editButton.dataset.beer = beerType;
  editButton.textContent = 'Modifier';
  actionsCell.appendChild(editButton);

  // Add space between buttons
  actionsCell.appendChild(document.createTextNode(' '));

  // Delete button
  const deleteButton = document.createElement('button');
  deleteButton.className = 'btn btn-sm btn-danger delete-beer';
  deleteButton.dataset.beer = beerType;
  deleteButton.textContent = 'Supprimer';
  actionsCell.appendChild(deleteButton);

  row.appendChild(actionsCell);

  return row;
}

/**
 * Attaches event listeners to inventory action buttons.
 */
function attachInventoryEventListeners() {
  document.querySelectorAll('.edit-stock').forEach(button => {
    button.addEventListener('click', editStockTheorique);
  });

  document.querySelectorAll('.delete-beer').forEach(button => {
    button.addEventListener('click', deleteBeerType);
  });
}

/**
 * Updates the equipment display with current rental information.
 */
async function updateEquipmentDisplay() {
  try {
    const reservations = await getReservations();

    // Initialize counters and period arrays
    const equipment = {
      barnum3x3: { rented: 0, periods: [] },
      barnum3x6: { rented: 0, periods: [] },
      photobooth: { rented: 0, periods: [] }
    };

    // Process each reservation for equipment usage
    reservations.forEach(reservation => {
      const period = `Du ${formatDate(reservation.startDate)} au ${formatDate(reservation.endDate)}`;

      if (reservation.barnumOption) {
        equipment.barnum3x3.rented++;
        equipment.barnum3x3.periods.push(period);
      }

      if (reservation.barnum2Option) {
        equipment.barnum3x6.rented++;
        equipment.barnum3x6.periods.push(period);
      }

      if (reservation.photoBoothOption) {
        equipment.photobooth.rented++;
        equipment.photobooth.periods.push(period);
      }
    });

    // Update the UI with the equipment data
    updateEquipmentUI(equipment);
  } catch (error) {
    showError('Failed to update equipment display', error);
  }
}

/**
 * Updates the equipment UI elements with rental data.
 *
 * @param {Object} equipment - Equipment rental data
 */
function updateEquipmentUI(equipment) {
  // Update counts
  document.getElementById('barnum3x3-rented').textContent = equipment.barnum3x3.rented;
  document.getElementById('barnum3x6-rented').textContent = equipment.barnum3x6.rented;
  document.getElementById('photobooth-rented').textContent = equipment.photobooth.rented;

  // Update availability (assuming 1 of each item is available)
  document.getElementById('barnum3x3-available').textContent = Math.max(0, 1 - equipment.barnum3x3.rented);
  document.getElementById('barnum3x6-available').textContent = Math.max(0, 1 - equipment.barnum3x6.rented);
  document.getElementById('photobooth-available').textContent = Math.max(0, 1 - equipment.photobooth.rented);

  // Update rental periods
  document.getElementById('barnum3x3-dates').textContent = equipment.barnum3x3.periods.length ?
    equipment.barnum3x3.periods.join(' || \n') : '-';
  document.getElementById('barnum3x6-dates').textContent = equipment.barnum3x6.periods.length ?
    equipment.barnum3x6.periods.join(' || \n') : '-';
  document.getElementById('photobooth-dates').textContent = equipment.photobooth.periods.length ?
    equipment.photobooth.periods.join(' || \n') : '-';
}

/**
 * User Action Handlers
 * ------------------------------------------------------------------------
 */

/**
 * Handles adding a new beer type to inventory.
 */
async function addBeerType() {
  const beerName = prompt('Nom du nouveau type de fût (ex: Celt Pils 30L):');

  if (!beerName || beerName.trim() === '') {
    return;
  }

  const beerStock = await getBeerStock();

  if (beerStock[beerName]) {
    alert('❌ Ce type de fût existe déjà.');
    return;
  }

  const success = await saveBeerStock(beerName, 0);

  if (success) {
    await updateInventoryDisplay();
  }
}

/**
 * Handles editing the theoretical stock of a beer type.
 *
 * @param {Event} event - The click event
 */
async function editStockTheorique(event) {
  const beerType = event.target.dataset.beer;
  const beerStock = await getBeerStock();
  const currentStock = beerStock[beerType]?.stock || 0;

  const newValue = prompt(`Modifier le stock théorique de ${beerType}:`, currentStock);

  if (newValue === null) {
    return; // User cancelled
  }

  const quantity = parseInt(newValue, 10);

  if (isNaN(quantity) || quantity < 0) {
    alert('❌ Veuillez entrer une valeur numérique positive.');
    return;
  }

  const success = await saveBeerStock(beerType, quantity);

  if (success) {
    await updateInventoryDisplay();
  }
}

/**
 * Handles deleting a beer type from inventory.
 *
 * @param {Event} event - The click event
 */
async function deleteBeerType(event) {
  const beerType = event.target.dataset.beer.trim();

  if (!confirm(`Supprimer ${beerType} du stock ?`)) {
    return;
  }

  const success = await deleteBeerTypeFromInventory(beerType);

  if (success) {
    await updateInventoryDisplay();
  }
}

/**
 * Utility Functions
 * ------------------------------------------------------------------------
 */

async function getBeerStockUsedOverTwoWeeks(beerType, startDate) {
  try {
    const reservations = await getReservations();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to ignore time

    // Define the two-week period
    const startOfPeriod = new Date(startDate);
    startOfPeriod.setHours(0, 0, 0, 0);

    const endOfPeriod = new Date(startOfPeriod);
    endOfPeriod.setDate(startOfPeriod.getDate() + 6);
    endOfPeriod.setHours(23, 59, 59, 999);

    return reservations.reduce((total, reservation) => {
      // Skip invalid beer data
      if (!Array.isArray(reservation.beers)) {
        return total;
      }

      const resStartDate = new Date(reservation.startDate);
      const resEndDate = new Date(reservation.endDate);
      resStartDate.setHours(0, 0, 0, 0);
      resEndDate.setHours(23, 59, 59, 999);

      // **Exclude reservations that have already ended**
      if (resStartDate <= today) {
        return total;
      }

      // Include only reservations that fall within the period
      if (resStartDate >= startOfPeriod && resStartDate <= endOfPeriod) {
        const beer = reservation.beers.find(b => b.type.trim() === beerType);
        return beer ? total + (parseInt(beer.quantity, 10) || 0) : total;
      }

      return total;
    }, 0);
  } catch (error) {
    showError('Failed to calculate reserved beer stock', error);
    return 0;
  }
}



/**
 * Safely parses a beer JSON string into an array.
 *
 * @param {string|Array} beers - The beers data to parse
 * @returns {Array} The parsed beers array
 */
function parseBeers(beers) {
  try {
    if (typeof beers === 'string') {
      return JSON.parse(beers);
    }
    return Array.isArray(beers) ? beers : [];
  } catch (error) {
    showError('Failed to parse beers JSON', error);
    return [];
  }
}

/**
 * Gets the Monday of the week containing the specified date.
 *
 * @param {Date} date - The date to find the Monday for
 * @returns {Date} The Monday date
 */
function getMonday(date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  return result;
}

/**
 * Formats a date string from YYYY-MM-DD to DD-MM-YYYY.
 *
 * @param {string} dateString - The date string to format
 * @returns {string} The formatted date string
 */
function formatDate(dateString) {
  if (!dateString) return '-';

  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
}

/**
 * Displays an error message in the console.
 *
 * @param {string} message - The error message to display
 * @param {Error|any} error - The error object or data
 */
function showError(message, error) {
  console.error(`❌ ERROR: ${message}`, error);
}