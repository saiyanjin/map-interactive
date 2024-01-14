<?php
session_start();
if($_SESSION['id'] == NULL) {
  header('Location: connect.php');
  exit();
}
else{
    header('Location: espace_cli.php');
    exit();
}
?>