<?php
// Reservation Management System API
// Originally developed for local/internal use in a V&B store.

ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

function respondError(string $message, int $status = 400): void
{
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function respondSuccess(array $payload): void
{
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

// Local XAMPP database configuration.
$host = 'localhost';
$user = 'root';
$password = '';
$dbname = 'location_tireuse';

$conn = new mysqli($host, $user, $password, $dbname);
if ($conn->connect_error) {
    error_log('MySQL connection failed: ' . $conn->connect_error);
    respondError('Database connection failed.', 500);
}
$conn->set_charset('utf8mb4');

$requestType = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$queryType = $_GET['type'] ?? '';

$data = null;
if (($requestType === 'POST' || $requestType === 'PUT') && $queryType !== 'archiveAndDelete') {
    $jsonInput = file_get_contents('php://input');
    if ($jsonInput !== false && trim($jsonInput) !== '') {
        $data = json_decode($jsonInput, true);
        if (!is_array($data)) {
            respondError('Invalid JSON input.');
        }
    } else {
        $data = [];
    }
}

function normalizeReservationRow(array $row): array
{
    $row['isAnnual'] = isset($row['isAnnual']) ? (int) $row['isAnnual'] : 0;
    $row['barnumOption'] = (int) ($row['barnumOption'] ?? 0);
    $row['barnum2Option'] = (int) ($row['barnum2Option'] ?? 0);
    $row['photoBoothOption'] = (int) ($row['photoBoothOption'] ?? 0);
    $row['beers'] = json_decode($row['beers'] ?? '[]', true) ?: [];

    if (isset($row['taps'])) {
        $row['taps'] = json_decode($row['taps'], true) ?: [];
    } elseif (isset($row['tapType'], $row['tapNumber'])) {
        $row['taps'] = [['type' => $row['tapType'], 'number' => $row['tapNumber']]];
    } else {
        $row['taps'] = [];
    }

    return $row;
}

/* =======================
Reservation fetch
======================= */
if ($queryType === 'reservations' && $requestType === 'GET') {
    $result = $conn->query('SELECT * FROM reservations ORDER BY startDate ASC');
    if (!$result) {
        error_log('Reservation fetch failed: ' . $conn->error);
        respondError('Unable to fetch reservations.', 500);
    }

    $reservations = [];
    while ($row = $result->fetch_assoc()) {
        $reservations[] = normalizeReservationRow($row);
    }
    respondSuccess($reservations);
}

/* =======================
Beer stock fetch
======================= */
if ($queryType === 'inventory' && $requestType === 'GET') {
    $result = $conn->query('SELECT name AS beerType, stock FROM inventory');
    if (!$result) {
        error_log('Inventory fetch failed: ' . $conn->error);
        respondError('Unable to fetch inventory.', 500);
    }

    $beerStock = [];
    while ($row = $result->fetch_assoc()) {
        $beerStock[$row['beerType']] = ['stock' => (int) $row['stock']];
    }
    respondSuccess($beerStock ?: new stdClass());
}

/* =======================
Adding / Updating a reservation
======================= */
if ($queryType === 'reservations' && $requestType === 'POST') {
    $raisonSociale = trim((string) ($data['raisonSociale'] ?? ''));
    $clientName = trim((string) ($data['clientName'] ?? ''));
    $clientPhone = trim((string) ($data['clientPhone'] ?? ''));
    $startDate = trim((string) ($data['startDate'] ?? ''));
    $endDate = trim((string) ($data['endDate'] ?? ''));
    $tapsJson = json_encode($data['taps'] ?? [], JSON_UNESCAPED_UNICODE);
    $beersJson = json_encode($data['beers'] ?? [], JSON_UNESCAPED_UNICODE);
    $barnumOption = (int) ($data['barnumOption'] ?? 0);
    $barnum2Option = (int) ($data['barnum2Option'] ?? 0);
    $photoBoothOption = (int) ($data['photoBoothOption'] ?? 0);
    $comment = trim((string) ($data['comment'] ?? ''));

    if ($raisonSociale === '' || $clientName === '' || $startDate === '' || $endDate === '') {
        respondError('Required fields missing.');
    }

    if ($tapsJson === false || $beersJson === false) {
        respondError('Invalid reservation data.');
    }

    if (!empty($data['id'])) {
        $id = (int) $data['id'];
        $stmt = $conn->prepare(
            'UPDATE reservations SET raisonSociale = ?, clientName = ?, clientPhone = ?, startDate = ?, endDate = ?, taps = ?, beers = ?, barnumOption = ?, barnum2Option = ?, photoBoothOption = ?, comment = ? WHERE id = ?'
        );
        if (!$stmt) {
            error_log('Reservation update prepare failed: ' . $conn->error);
            respondError('Unable to prepare reservation update.', 500);
        }

        // 7 strings, 3 integers, 1 string, 1 integer.
        $stmt->bind_param(
            'sssssssiiisi',
            $raisonSociale,
            $clientName,
            $clientPhone,
            $startDate,
            $endDate,
            $tapsJson,
            $beersJson,
            $barnumOption,
            $barnum2Option,
            $photoBoothOption,
            $comment,
            $id
        );
    } else {
        $stmt = $conn->prepare(
            'INSERT INTO reservations (raisonSociale, clientName, clientPhone, startDate, endDate, taps, beers, barnumOption, barnum2Option, photoBoothOption, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        if (!$stmt) {
            error_log('Reservation insert prepare failed: ' . $conn->error);
            respondError('Unable to prepare reservation creation.', 500);
        }

        // 7 strings, 3 integers, 1 string.
        $stmt->bind_param(
            'sssssssiiis',
            $raisonSociale,
            $clientName,
            $clientPhone,
            $startDate,
            $endDate,
            $tapsJson,
            $beersJson,
            $barnumOption,
            $barnum2Option,
            $photoBoothOption,
            $comment
        );
    }

    if (!$stmt->execute()) {
        error_log('Reservation write failed: ' . $stmt->error);
        $stmt->close();
        respondError('Unable to save reservation.', 500);
    }

    if (!empty($data['id'])) {
        $stmt->close();
        respondSuccess(['message' => 'Réservation mise à jour']);
    }

    $newId = $stmt->insert_id;
    $stmt->close();
    respondSuccess(['message' => 'Nouvelle réservation créée', 'id' => $newId]);
}

/* =======================
Deleting a reservation
======================= */
if ($queryType === 'reservations' && $requestType === 'DELETE' && isset($_GET['id'])) {
    $reservationId = (int) $_GET['id'];
    $stmt = $conn->prepare('DELETE FROM reservations WHERE id = ?');
    if (!$stmt) {
        error_log('Reservation delete prepare failed: ' . $conn->error);
        respondError('Unable to prepare reservation deletion.', 500);
    }
    $stmt->bind_param('i', $reservationId);

    if (!$stmt->execute()) {
        error_log('Reservation delete failed: ' . $stmt->error);
        $stmt->close();
        respondError('Unable to delete reservation.', 500);
    }
    $stmt->close();
    respondSuccess(['message' => 'Réservation supprimée']);
}

/* =======================
Adding / Updating Beer Stock
======================= */
if ($queryType === 'beerStock' && $requestType === 'POST' && isset($data['beerType'])) {
    $beerType = trim((string) $data['beerType']);
    $stock = (int) ($data['stock'] ?? 0);

    $stmt = $conn->prepare('INSERT INTO inventory (name, stock) VALUES (?, ?) ON DUPLICATE KEY UPDATE stock = VALUES(stock)');
    if (!$stmt) {
        error_log('Inventory write prepare failed: ' . $conn->error);
        respondError('Unable to prepare inventory update.', 500);
    }
    $stmt->bind_param('si', $beerType, $stock);

    if (!$stmt->execute()) {
        error_log('Inventory write failed: ' . $stmt->error);
        $stmt->close();
        respondError('Unable to update inventory.', 500);
    }
    $stmt->close();
    respondSuccess(['message' => 'Stock mis à jour', 'beerType' => $beerType, 'stock' => $stock]);
}

/* =========================
Archive and Delete Reservation
========================= */
if ($queryType === 'archiveAndDelete' && $requestType === 'POST' && isset($_GET['id'])) {
    $reservationId = (int) $_GET['id'];

    // Keep archive + delete atomic: either both operations succeed or neither does.
    $conn->begin_transaction();

    try {
        $archiveStmt = $conn->prepare('INSERT INTO archives SELECT * FROM reservations WHERE id = ?');
        if (!$archiveStmt) {
            throw new RuntimeException($conn->error);
        }
        $archiveStmt->bind_param('i', $reservationId);
        if (!$archiveStmt->execute() || $archiveStmt->affected_rows !== 1) {
            $archiveStmt->close();
            throw new RuntimeException('Archive insert failed.');
        }
        $archiveStmt->close();

        $deleteStmt = $conn->prepare('DELETE FROM reservations WHERE id = ?');
        if (!$deleteStmt) {
            throw new RuntimeException($conn->error);
        }
        $deleteStmt->bind_param('i', $reservationId);
        if (!$deleteStmt->execute() || $deleteStmt->affected_rows !== 1) {
            $deleteStmt->close();
            throw new RuntimeException('Reservation delete failed.');
        }
        $deleteStmt->close();

        $conn->commit();
        respondSuccess(['message' => 'Réservation archivée et supprimée']);
    } catch (Throwable $exception) {
        $conn->rollback();
        error_log('Archive/delete failed: ' . $exception->getMessage());
        respondError('Unable to archive reservation.', 500);
    }
}

/* =========================
Reservation Archives fetch
========================= */
if ($queryType === 'archives' && $requestType === 'GET') {
    $result = $conn->query('SELECT * FROM archives ORDER BY startDate ASC');
    if (!$result) {
        error_log('Archive fetch failed: ' . $conn->error);
        respondError('Unable to fetch archives.', 500);
    }

    $archives = [];
    while ($row = $result->fetch_assoc()) {
        $archives[] = normalizeReservationRow($row);
    }
    respondSuccess($archives);
}

if ($queryType === 'deleteArchive' && $requestType === 'DELETE' && isset($_GET['id'])) {
    $archiveId = (int) $_GET['id'];
    $stmt = $conn->prepare('DELETE FROM archives WHERE id = ?');
    if (!$stmt) {
        error_log('Archive delete prepare failed: ' . $conn->error);
        respondError('Unable to prepare archive deletion.', 500);
    }
    $stmt->bind_param('i', $archiveId);

    if (!$stmt->execute()) {
        error_log('Archive delete failed: ' . $stmt->error);
        $stmt->close();
        respondError('Unable to delete archive.', 500);
    }
    $stmt->close();
    respondSuccess(['message' => 'Archive supprimée']);
}

/* =======================
Deleting a Beer Type from Inventory
======================= */
if ($queryType === 'inventory' && $requestType === 'DELETE' && isset($_GET['beerId'])) {
    $beerId = trim((string) $_GET['beerId']);

    $stmt = $conn->prepare('SELECT * FROM inventory WHERE name = ?');
    if (!$stmt) {
        error_log('Inventory lookup prepare failed: ' . $conn->error);
        respondError('Unable to check inventory item.', 500);
    }
    $stmt->bind_param('s', $beerId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        $stmt->close();
        respondError('Beer type not found.', 404);
    }
    $stmt->close();

    $deleteStmt = $conn->prepare('DELETE FROM inventory WHERE name = ?');
    if (!$deleteStmt) {
        error_log('Inventory delete prepare failed: ' . $conn->error);
        respondError('Unable to prepare inventory deletion.', 500);
    }
    $deleteStmt->bind_param('s', $beerId);

    if (!$deleteStmt->execute()) {
        error_log('Inventory delete failed: ' . $deleteStmt->error);
        $deleteStmt->close();
        respondError('Unable to delete inventory item.', 500);
    }
    $deleteStmt->close();
    respondSuccess(['message' => 'Beer type deleted successfully']);
}

$conn->close();
respondError('Unknown API request.', 404);
?>
