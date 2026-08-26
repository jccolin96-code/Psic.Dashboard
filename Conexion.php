<?php
$host = 'dpg-da70gvjbc2fs73894p00-a';
$dbname = 'psic_dashboard';
$username = 'rpsic_dashboard_user';
$password = 'Wk1YJIo0BTxZCUb7NflHvhvCGEgO7Ufh';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["error" => "Error de conexión: " . $e->getMessage()]);
    exit;
}
?>