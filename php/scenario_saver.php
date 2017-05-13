<?php
echo($_GET["filename"]);
$myFile = $_GET["filename"];
$fh = fopen('../scenarios/' . $myFile, 'w') or die("can't open file");
$stringData = $_GET["data"];
fwrite($fh, $stringData);
fclose($fh)
?>