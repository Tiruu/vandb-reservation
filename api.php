<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set('display_errors', 1);

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
        $row["isAnnual"] = (int) $row["isAnnual"];
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
if ($queryType === 'reservations' && $requestType === 'POST' && isset($data["clientName"])) {
    $isAnnual = (int) ($data["isAnnual"] ?? 0);
    $barnumOption = (int) ($data["barnumOption"] ?? 0);
    $barnum2Option = (int) ($data["barnum2Option"] ?? 0);
    $photoBoothOption = (int) ($data["photoBoothOption"] ?? 0);
    $beersJson = json_encode($data["beers"] ?? []);
    $tapsJson = json_encode($data["taps"] ?? []);  // New line to handle taps as JSON

    // 🔍 **Check if ID exists (updating) or not (inserting)**
    if (!empty($data["id"])) {
        // ✅ UPDATE an existing reservation
        $stmt = $conn->prepare("UPDATE reservations SET 
            raisonSociale = ?, clientName = ?, clientPhone = ?, startDate = ?, endDate = ?, taps = ?, beers = ?, 
            barnumOption = ?, barnum2Option = ?, photoBoothOption = ?, comment = ?, isAnnual = ? 
            WHERE id = ?");
        $stmt->bind_param(
            "sssssssiiisii",
            $data["raisonSociale"], $data["clientName"], $data["clientPhone"], $data["startDate"], $data["endDate"],
            $tapsJson, $beersJson,
            $barnumOption, $barnum2Option, $photoBoothOption,
            $data["comment"], $isAnnual, $data["id"]
        );
    } else {
        // ✅ INSERT a new reservation (id is **automatically** assigned by MySQL)
        $stmt = $conn->prepare("INSERT INTO reservations 
            (raisonSociale, clientName, clientPhone, startDate, endDate, taps, beers, barnumOption, barnum2Option, photoBoothOption, comment, isAnnual) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param(
            "sssssssiiisi",
            $data["raisonSociale"], $data["clientName"], $data["clientPhone"], $data["startDate"], $data["endDate"],
            $tapsJson, $beersJson,
            $barnumOption, $barnum2Option, $photoBoothOption,
            $data["comment"], $isAnnual
        );
    }

    // Execute SQL query
    if ($stmt->execute()) {
        //If inserting, return the newly created ID
        if (empty($data["id"])) {
            $newId = $stmt->insert_id; // Get the last inserted ID
            echo json_encode(["message" => "Nouvelle réservation créée", "id" => $newId]);
        } else {
            echo json_encode(["message" => "Réservation mise à jour"]);
        }
    } else {
        echo json_encode(["error" => "SQL Error: " . $stmt->error]);
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
        $row["isAnnual"] = (int) $row["isAnnual"];
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



//Ending DB connection
$conn->close();
exit;
?>
