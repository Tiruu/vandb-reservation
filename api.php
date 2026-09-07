<?php
// suppress warnings early
ini_set('display_errors',   '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

// CORS preflight handling
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0);
}

// now your normal headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");




// Connecting to the DB
$host = "localhost";
$user = "root";
$password = "";
$dbname = "location_tireuse";

$conn = new mysqli($host, $user, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["error" => "MySQL Connection Failed: " . $conn->connect_error]);
    exit;
}

// 📌 Gestion des requêtes
$requestType = $_SERVER['REQUEST_METHOD'];
$queryType = isset($_GET['type']) ? $_GET['type'] : '';

// 📌 Read JSON only if the request needs a body (POST/PUT except for archiveAndDelete)
$data = null;
if (($requestType === 'POST' || $requestType === 'PUT') && $queryType !== 'archiveAndDelete') {
    $jsonInput = file_get_contents("php://input");
    if (!empty($jsonInput)) {
        $data = json_decode($jsonInput, true);
        if (!$data) {
            echo json_encode(["error" => "Invalid JSON input"]);
            exit;
        }
    }
}


/* =======================
Reservation fetch
======================= */
if ($queryType === 'reservations' && $requestType === 'GET') {
    $sql = "SELECT * FROM reservations ORDER BY startDate ASC";
    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode(["error" => "SQL Error: " . $conn->error]);
        exit;
    }

    $reservations = [];
    while ($row = $result->fetch_assoc()) {
        $row['isAnnual'] = isset($row['isAnnual'])
            ? (int) $row['isAnnual']
            : 0;
        $row["barnumOption"] = (int) $row["barnumOption"];
        $row["barnum2Option"] = (int) $row["barnum2Option"];
        $row["photoBoothOption"] = (int) $row["photoBoothOption"];
        $row["beers"] = json_decode($row["beers"], true) ?: []; //Sécurise JSON
        
        // Handle the new taps structure
        if (isset($row["taps"])) {
            $row["taps"] = json_decode($row["taps"], true) ?: [];
        } else if (isset($row["tapType"]) && isset($row["tapNumber"])) {
            // Backward compatibility for old data format
            $row["taps"] = [["type" => $row["tapType"], "number" => $row["tapNumber"]]];
        } else {
            $row["taps"] = [];
        }

        $reservations[] = $row;
    }

    echo json_encode($reservations);
    exit;
}

/* =======================
Beer stock fetch
======================= */
if ($queryType === 'inventory' && $requestType === 'GET') {
    $sql = "SELECT name AS beerType, stock FROM inventory";
    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode(["error" => "SQL Error: " . $conn->error]);
        exit;
    }

    $beerStock = [];
    while ($row = $result->fetch_assoc()) {
        $beerStock[$row["beerType"]] = ["stock" => (int) $row["stock"]];
    }

    echo json_encode($beerStock ?: new stdClass()); //Empêche un JSON vide
    exit;
}

/* =======================
Adding / Updating a reservation
======================= */
/* =======================
Adding / Updating a reservation
======================= */
if ($queryType === 'reservations' && $requestType === 'POST') {
    // Fetch and sanitize incoming data
    $barnumOption   = (int) ($data["barnumOption"]  ?? 0);
    $barnum2Option  = (int) ($data["barnum2Option"] ?? 0);
    $photoBoothOption = (int) ($data["photoBoothOption"] ?? 0);
    $beersJson      = json_encode($data["beers"] ?? []);
    $tapsJson       = json_encode($data["taps"]  ?? []);
    $comment        = $conn->real_escape_string($data["comment"] ?? '');

    // Validate required fields
    if (empty($data["clientName"]) || empty($data["raisonSociale"]) || empty($data["startDate"]) || empty($data["endDate"])) {
        echo json_encode(["error" => "Required fields missing"]);
        exit;
    }

    // Decide whether to INSERT or UPDATE
    if (!empty($data["id"])) {
        // UPDATE existing reservation
        $stmt = $conn->prepare("
            UPDATE reservations SET 
                raisonSociale   = ?,
                clientName      = ?,
                clientPhone     = ?,
                startDate       = ?,
                endDate         = ?,
                taps            = ?,
                beers           = ?,
                barnumOption    = ?,
                barnum2Option   = ?,
                photoBoothOption= ?,
                comment         = ?
            WHERE id = ?
        ");
        $stmt->bind_param(
            "ssssssiiisi",
            $data["raisonSociale"],
            $data["clientName"],
            $data["clientPhone"],
            $data["startDate"],
            $data["endDate"],
            $tapsJson,
            $beersJson,
            $barnumOption,
            $barnum2Option,
            $photoBoothOption,
            $comment,
            $data["id"]
        );
    } else {
        // INSERT new reservation
        $stmt = $conn->prepare("
            INSERT INTO reservations
            (raisonSociale, clientName, clientPhone, startDate, endDate, taps, beers, barnumOption, barnum2Option, photoBoothOption, comment)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param(
            "ssssssiiiss",
            $data["raisonSociale"],
            $data["clientName"],
            $data["clientPhone"],
            $data["startDate"],
            $data["endDate"],
            $tapsJson,
            $beersJson,
            $barnumOption,
            $barnum2Option,
            $photoBoothOption,
            $comment
        );
    }

    if (!$stmt->execute()) {
        echo json_encode(["error" => "SQL Error: " . $stmt->error]);
        exit;
    }

    // Return success (and new ID on insert)
    if (empty($data["id"])) {
        echo json_encode(["message" => "Nouvelle réservation créée", "id" => $stmt->insert_id]);
    } else {
        echo json_encode(["message" => "Réservation mise à jour"]);
    }

    $stmt->close();
    exit;
}


/* =======================
Deleting a reservation
======================= */
if ($queryType === 'reservations' && $requestType === 'DELETE' && isset($_GET['id'])) {
    $reservationId = (int) $_GET['id']; // Ensure ID is an integer
    error_log("Deleting reservation ID: " . $reservationId);

    $stmt = $conn->prepare("DELETE FROM reservations WHERE id = ?");
    $stmt->bind_param("i", $reservationId);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Réservation supprimée"]);
    } else {
        echo json_encode(["error" => "Erreur SQL: " . $stmt->error]);
    }

    $stmt->close();
    exit;
}


/* =======================
Adding / Updating Beer Stock
======================= */
if ($queryType === 'beerStock' && $requestType === 'POST' && isset($data["beerType"])) {
    $beerType = trim($data["beerType"]); // 🔹 Rend les noms uniques même avec majuscules
    $stock = (int) ($data["stock"] ?? 0);

    $stmt = $conn->prepare("INSERT INTO inventory (name, stock) VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE stock = VALUES(stock)");
    $stmt->bind_param("si", $beerType, $stock);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Stock mis à jour", "beerType" => $beerType, "stock" => $stock]);
    } else {
        echo json_encode(["error" => "Erreur SQL: " . $stmt->error]);
    }

    $stmt->close();
    exit;
}

/* =========================
Archive and Delete Reservation
========================= */
if ($queryType === 'archiveAndDelete' && $requestType === 'POST' && isset($_GET['id'])) {
    $reservationId = (int) $_GET['id']; // Ensure ID is an integer
    error_log("Archiving and deleting reservation ID: " . $reservationId);

    // Step 1: Copy reservation to the archives table
    $archiveQuery = "INSERT INTO archives SELECT * FROM reservations WHERE id = ?";
    $archiveStmt = $conn->prepare($archiveQuery);
    $archiveStmt->bind_param("i", $reservationId);

    if (!$archiveStmt->execute()) {
        echo json_encode(["error" => "Erreur lors de l'archivage : " . $archiveStmt->error]);
        exit;
    }
    $archiveStmt->close();

    // Step 2: Delete reservation from the reservations table
    $deleteQuery = "DELETE FROM reservations WHERE id = ?";
    $deleteStmt = $conn->prepare($deleteQuery);
    $deleteStmt->bind_param("i", $reservationId);

    if ($deleteStmt->execute()) {
        echo json_encode(["message" => "Réservation archivée et supprimée"]);
    } else {
        echo json_encode(["error" => "Erreur SQL lors de la suppression: " . $deleteStmt->error]);
    }

    $deleteStmt->close();
    exit;
}

/* =======================
Rservation Archives fetch
======================= */
if ($queryType === 'archives' && $requestType === 'GET') {
    $sql = "SELECT * FROM archives ORDER BY startDate ASC";
    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode(["error" => "SQL Error: " . $conn->error]);
        exit;
    }

    $archives = [];
    while ($row = $result->fetch_assoc()) {
        $row['isAnnual'] = isset($row['isAnnual'])
            ? (int) $row['isAnnual']
            : 0;
        $row["barnumOption"] = (int) $row["barnumOption"];
        $row["barnum2Option"] = (int) $row["barnum2Option"];
        $row["photoBoothOption"] = (int) $row["photoBoothOption"];
        $row["beers"] = json_decode($row["beers"], true) ?: [];
        
        // Handle the new taps structure
        if (isset($row["taps"])) {
            $row["taps"] = json_decode($row["taps"], true) ?: [];
        } else if (isset($row["tapType"]) && isset($row["tapNumber"])) {
            // Backward compatibility for old data format
            $row["taps"] = [["type" => $row["tapType"], "number" => $row["tapNumber"]]];
        } else {
            $row["taps"] = [];
        }

        $archives[] = $row;
    }

    echo json_encode($archives);
    exit;
}

if ($queryType === 'deleteArchive' && $requestType === 'DELETE' && isset($_GET['id'])) {
    $archiveId = (int) $_GET['id']; // Convert to integer
    error_log("Deleting archived reservation ID: " . $archiveId);

    $stmt = $conn->prepare("DELETE FROM archives WHERE id = ?");
    $stmt->bind_param("i", $archiveId);

    if ($stmt->execute()) {
        echo json_encode(["message" => "✅ Archive supprimée"]);
    } else {
        echo json_encode(["error" => "❌ Erreur SQL: " . $stmt->error]);
    }

    $stmt->close();
    exit;
}

/* =======================
Deleting a Beer Type from Inventory
======================= */
if ($queryType === 'inventory' && $requestType === 'DELETE' && isset($_GET['beerId'])) {
    $beerId = trim($_GET['beerId']); // Make sure beerId is properly trimmed

    // Prepare the query to check if the beer type exists
    $sql = "SELECT * FROM inventory WHERE name = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $beerId);
    $stmt->execute();
    $result = $stmt->get_result();

    // If the beer type doesn't exist, return an error
    if ($result->num_rows === 0) {
        echo json_encode(["error" => "Beer type not found"]);
        $stmt->close();
        exit;
    }

    // Prepare the DELETE query to remove the beer type
    $deleteSql = "DELETE FROM inventory WHERE name = ?";
    $deleteStmt = $conn->prepare($deleteSql);
    $deleteStmt->bind_param("s", $beerId);

    // Execute the DELETE query
    if ($deleteStmt->execute()) {
        echo json_encode(["message" => "Beer type deleted successfully"]);
    } else {
        echo json_encode(["error" => "SQL Error: " . $deleteStmt->error]);
    }

    // Close statements
    $deleteStmt->close();
    $stmt->close();
    exit;
}




//Ending DB connection
$conn->close();
exit;
?>
