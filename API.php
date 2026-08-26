<?php
header('Content-Type: application/json');
require_once 'Conexion.php';

$action = $_GET['action'] ?? '';

// Obtener todos los registros para poblar el sistema
if ($action === 'get_all') {
    try {
        $pacientes = $pdo->query("SELECT * FROM pacientes")->fetchAll(PDO::FETCH_ASSOC);
        $citas = $pdo->query("SELECT * FROM citas")->fetchAll(PDO::FETCH_ASSOC);
        $historias = $pdo->query("SELECT * FROM historias")->fetchAll(PDO::FETCH_ASSOC);
        $informes = $pdo->query("SELECT * FROM informes")->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "pacientes" => $pacientes,
            "citas" => $citas,
            "historias" => $historias,
            "informes" => $informes
        ]);
    } catch (Exception $e) {
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if ($action === 'add_paciente') {
    $stmt = $pdo->prepare("INSERT INTO pacientes (nombre, dni, tel, email) VALUES (?, ?, ?, ?)");
    $stmt->execute([$input['nombre'], $input['dni'], $input['tel'], $input['email']]);
    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
    exit;
}

if ($action === 'add_cita') {
    $stmt = $pdo->prepare("INSERT INTO citas (paciente, medico, fecha, estado) VALUES (?, ?, ?, ?)");
    $stmt->execute([$input['paciente'], $input['medico'], $input['fecha'], $input['estado']]);
    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
    exit;
}

if ($action === 'add_historia') {
    $stmt = $pdo->prepare("INSERT INTO historias (paciente, diagnostico, tratamiento) VALUES (?, ?, ?)");
    $stmt->execute([$input['paciente'], $input['diagnostico'], $input['tratamiento']]);
    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
    exit;
}

if ($action === 'add_informe') {
    $stmt = $pdo->prepare("INSERT INTO informes (paciente, contenido) VALUES (?, ?)");
    $stmt->execute([$input['paciente'], $input['contenido']]);
    echo json_encode(["success" => true, "id" => $pdo->lastInsertId()]);
    exit;
}

echo json_encode(["error" => "Acción no válida"]);
?>