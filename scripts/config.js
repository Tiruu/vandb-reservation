/**
 * Reservation Management System
 *
 * Central application configuration.
 */
const CONFIG = {
    API_BASE_URL: '/api.php',
    DATE_FORMAT: 'DD-MM-YYYY',
    DEBUG: false,
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
        AVAILABLE: 'Tireuses Disponibles',
        RESERVED: 'Tireuses Réservées'
      }
    },
    RESERVATION_STATUS: {
      ACTIVE: 'reservation-active',
      EXPIRED: 'reservation-expired',
      UPCOMING: ''
    }
};