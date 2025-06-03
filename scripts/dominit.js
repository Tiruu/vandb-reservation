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