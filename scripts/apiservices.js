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