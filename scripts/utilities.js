

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