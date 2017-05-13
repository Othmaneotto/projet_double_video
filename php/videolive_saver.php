<?php
$scenario_name = $_POST["scenario_name"];
$sequence_name = $_POST["sequence_name"];
$ecran = $_POST["ecran"];

if (!file_exists('../enregistrements/scenario-' . $scenario_name)) {
    mkdir('../enregistrements/scenario-' . $scenario_name, 0777, true);
}

if(!file_exists('../enregistrements/scenario-' . $scenario_name . '/sequence-' . $sequence_name)){
    mkdir('../enregistrements/scenario-' . $scenario_name . '/sequence-' . $sequence_name, 0777, true);
}

$date = date("Y-m-d_h-i-s");
$data = substr($_POST['data'], strpos($_POST['data'], ",") + 1);

$decodedData = base64_decode($data);
$name='../enregistrements/scenario-'.$scenario_name. '/sequence-'.$sequence_name.'/live-'.$ecran.'-'.$date;

$fh = fopen($name.'.webm', 'wb') or die("can't open file"); 
 
fwrite($fh, $decodedData);
fclose($fh);

//system('ffmpeg -async 1 -i "'.$name.'.webm" -f avi -b 700k -qscale 0 -ab 160k -ar 44100 "'.$name.'.avi" 2>&1',$output);
system('ffmpeg -async 1 -i "'.$name.'.webm" -f avi -b 700k -qscale 0 -ab 160k -ar 44100 "'.$name.'.avi"');
unlink($name.'.webm');
?>