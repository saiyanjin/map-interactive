<?php
// Connexion à la base de données
$pdo = new PDO('mysql:host=localhost;dbname=connection;charset=utf8', 'root', 'root');

// Exécutez une requête pour récupérer les données
$stmt = $pdo->query("SELECT * FROM festival");
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Convertissez les données en format JSON
header('Content-Type: application/json');
echo json_encode($data);
?>
