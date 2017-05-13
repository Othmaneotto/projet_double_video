	/* 
	CONTROLLEUR
*/
/********/
/* Auteur Valerian*/

/******************* Conf LABO ***********************/
var LABEL_ECRAN1 = "HD Pro Webcam C920";
var LABEL_ECRAN2 = "HD Pro Webcam C920-2";
/******************************************************/
var newCanvas;
var context;

/***** variable pour savoir si les clients sont bien initialises ********/
var initEcran1 = false;
var initEcran2 = false;
/**********************************************/

var camera1;
var camera2;
var containerLiveEcr2;
var containerLiveEcr1;

var canvasEcr1;
var canvasEcr1Context;
var canvasEcr2;
var canvasEcr2Context;
var canvasLive;
var canvasLiveContext;

var streamEcr1;
var streamEcr2;

var fenetreEcran1;
var fenetreEcran2;
var fenetreCreerScenario;

var ecr1_pret = false;
var ecr2_pret = false;
var playingSequence = false;

var i=0;
var dessineMereLive = false;

var scenarioPath = "http://localhost/doublevideo/scenarios/";

var arraySequence = [];
var currentSequence = 0;
var timeout;

window.onload = function(){
	initUi();
	initCanvas();
	getCameras();
}

function initUi(){
	$('#chooseFilef').change(function(){
		$('#chooseFilet').val(($(this).val()));
		checkScenario($(this).val(),"");
	});
	disableInputs();
}

function initCanvas(){
	newCanvas = document.getElementById("canvas_resize");
	canvasLive = document.getElementById("canvas_live");
	canvasLiveContext = canvasLive.getContext("2d");
	canvasLiveContext.scale(-1,1);
	fitToContainer(canvasLive);
}


function fitToContainer(canvas){
  canvas.style.width ='100%';
  canvas.style.height='100%';
  canvas.width  = 1920;
  canvas.height = 1080;
}

function getCameras(){
	VideoUtil.listerDevices();
	var listerCamera = setInterval(function(){
		if(localStorage.devices==null || localStorage.devices==undefined ){
			console.log("Le programme liste les cameras...");
		}else{
			getDevices();
			if(typeof camera1 !== 'undefined' && typeof camera2 !=='undefined'){
				console.log("Les cameras sont bien recuperees");
				setupLocalVideo();
				openClients();
				clearInterval(listerCamera);
			}
		}
	},500);
}

function getDevices(){
    camera1 = VideoUtil.getCameraObject(LABEL_ECRAN1);
	camera2 = VideoUtil.getCameraObject(LABEL_ECRAN2);
}
function setupLocalVideo() 
{
    containerLiveEcr1 = document.getElementById('containerVideoMere');
	containerLiveEcr2 = document.getElementById('containerVideoBebe');
	
    var constraintsBebe = {
        video: {
			deviceId: camera1.id ,
			width: { ideal: 1280},
			height: { ideal: 720 }
		}
    };
	
	var constraintsMere = {
        video: {
			deviceId:camera2.id ,
			width: { ideal: 1280},
			height: { ideal: 720 }
		}
    };

    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraintsBebe).then(getUserMediaSuccessBebe).catch();
		navigator.mediaDevices.getUserMedia(constraintsMere).then(getUserMediaSuccessMere).catch();
    } 
    else {
        alert('Your browser does not support getUserMedia API');
    }
	
	/* Callback : appeler lors du onSuccess de navigator.mediaDevices.getUserMedia(constraints) */
	function getUserMediaSuccessMere(stream) 
	{
		streamEcr2 = stream;
		containerLiveEcr2.src = window.URL.createObjectURL(streamEcr2);
		if(checkLiveStreamReady()){
			setupCanvasLiveDrawing();
		}
	}
	
		/* Callback : appeler lors du onSuccess de navigator.mediaDevices.getUserMedia(constraints) */
	function getUserMediaSuccessBebe(stream) 
	{
		streamEcr1 = stream;
		containerLiveEcr1.src = window.URL.createObjectURL(streamEcr1);
		if(checkLiveStreamReady()){
			setupCanvasLiveDrawing();
		}	
	}
}

function checkLiveStreamReady(){
	if(typeof streamEcr2!=='undefined' && typeof streamEcr1!=='undefined' ){
		return true;
	}else{
		return false;
	}
}

function setupCanvasLiveDrawing(){
	containerLiveEcr2.addEventListener('play', function() {
	   setInterval(function() {
		  if (containerLiveEcr1.paused || containerLiveEcr1.ended) return;
		  canvasLiveContext.fillRect(0, 0, canvasLive.width, canvasLive.height);
		  canvasLiveContext.drawImage(containerLiveEcr2, 0, 0, canvasLive.width, canvasLive.height);
		  if(dessineMereLive){
			  canvasLiveContext.fillRect(50, 50,100, 100);
			  canvasLiveContext.drawImage(containerLiveEcr1, 50, 50,500,400);  
		  }
	   }, 33);	
	}, false);	
	
	dessineMereLive = true ;
	containerLiveEcr1.addEventListener('canplay',function(){dessineMereLive = true;});
	containerLiveEcr2.play();
}

/* Fonction permettant d ouvrir les fenetre de la mere
et de l enfant
 */
function openClients(){
    fenetreEcran2 = window.open("http://localhost/doublevideo/ecran2.html","ecran2","left=-10000,right=5760,height=10000px,width=10000px,location=0,menubar=0,scrollbars=0,status=0,titlebar=0,toolbar=0");
	fenetreEcran1 = window.open("http://localhost/doublevideo/ecran1.html","ecran1","left=3839,right=5760,height=10000px,width=10000px,location=0,menubar=0,scrollbars=0,status=0,titlebar=0,toolbar=0");
    this.window.name="moniteur";

}

function modifierScenario(){
	var scenarioPath = $('#chooseFilet').val();
	if(scenarioPath == '' || scenarioPath == undefined){
		$('#choixScenario').transition('pulse');
	}else{
		checkScenario(scenarioPath,"mod");
	}
}

function creerScenario(){
	localStorage.setItem("scenario","");
	fenetreCreerScenario = window.open("http://localhost/doublevideo/html/creer_scenario.html","scenario","height=500,width=500");
}

function initStartScenario(){
	var scenarioPath = $('#chooseFilet').val();
	playingSequence = false;
	if(scenarioPath ==''){
		$('#choixScenario').transition('pulse');
		setNotifBar("Veuillez choisir un scénario.","warning");
	}else{
		checkScenario(scenarioPath,"run");
	}
}

function startScenario(){
	arraySequence = scenario.sequences;
	currentSequence = 0;
	displaySequences();
	$('.sequence'+currentSequence).css('font-weight','bold');
	fenetreEcran1.postMessage({action:arraySequence[currentSequence].action1,cmd:"action",scenarioname:scenario.nom,sequencename:arraySequence[currentSequence].nom},"*");
	fenetreEcran2.postMessage({action:arraySequence[currentSequence].action2,cmd:"action",scenarioname:scenario.nom,sequencename:arraySequence[currentSequence].nom},"*");
	
}

function displaySequences(){
	$('#notif_text').html("");
	var i = 0;
	arraySequence.forEach(function(sequence){
		var $input = $('#notif_text').append('<p class=sequence'+i+'>'+sequence.nom+' | Ecran 1 : '+sequence.action1.nom +
		'| Ecran 2 : '+sequence.action2.nom+' | Durée :'+sequence.minute+':'+sequence.seconde+' mn<p>');
		$input.appendTo("#notif_text");
		i++;
	});
}

function checkScenario(filename,option){
		setNotifBar("<b>Scénario : "+filename+".</b></br>Le système vérifie le scénario","loading");
	 $.get(scenarioPath+filename, function(data) {
		scenario = JSON.parse(data);
		if(verifValidScenario(scenario)){
			var isrunning = false;
			if(option =="run"){
				isrunning = true;
				startScenario();
			}else if(option=="mod"){
				localStorage.setItem("scenario",filename);
				fenetreCreerScenario = window.open("http://localhost/doublevideo/html/creer_scenario.html","scenario","{height:500,width:500}");
			}
			if(!isrunning){
				setNotifBar("<b>Scénario : "+filename+"</b></br>"
				+"Vous pouvez choisir de le lancer ou de le modifier.","ok");	
			}
		}else{
			setNotifBar("Le scénario choisi n'est pas valide, veuillez en choisir un autre","warning");
		}
	}).fail(function() {
		setNotifBar("Le scénario n'a pas pu être récupéré sur le serveur.</br>"
		+"Vérifiez que celui-ci est bien dans le dossier <b>/projet_double_video/scenarios/</b>","warning");
	});
}

/*************** Point d'entree  pour modification des scenarios *********/
function modifierScenario(){
	var scenarioPath = $('#chooseFilet').val();
	if(scenarioPath == '' || scenarioPath == undefined){
		$('#choixScenario').transition('pulse');
	}else{
		checkScenario(scenarioPath,"mod");
	}
}

/*************** Point d'entree  pour modification des scenarios *********/
function creerScenario(){
	localStorage.setItem("scenario","");
	fenetreCreerScenario = window.open("http://localhost/doublevideo/html/creer_scenario.html","scenario","height=500,width=500");
}



function startSequence(){
	ecr1_pret = false;
	ecr2_pret = false;
	playingSequence = true;
	var sequence = arraySequence[currentSequence];
	fenetreEcran1.postMessage({cmd:"start"},"*");
	fenetreEcran2.postMessage({cmd:"start"},"*");
	var temps = getSequenceDuree(sequence.seconde,sequence.minute);
	
	if(temps == 0){
		temps = 1000;
		var ind = true;
	}else{
		var ind = false;
	}
	
	timeout = new Timer(function() {
		stopSequence();
	},temps);
	
	if(ind){
		timeout.pause();
	}
}

function passerSequence(){
	if(typeof timeout !=="undefined"){
		timeout.stop();
		stopSequence();
	}
}

function stopSequence(){
	
	$('.sequence'+currentSequence).css('font-weight','');
	currentSequence ++;
	
	if(currentSequence < arraySequence.length){
		fenetreEcran1.postMessage({action:arraySequence[currentSequence].action1,cmd:"action",scenarioname:scenario.nom,sequencename:arraySequence[currentSequence].nom},"*");
		fenetreEcran2.postMessage({action:arraySequence[currentSequence].action2,cmd:"action",scenarioname:scenario.nom,sequencename:arraySequence[currentSequence].nom},"*");	

	}else{
		fenetreEcran1.postMessage({action:arraySequence[currentSequence-1].action1,cmd:"stop",scenarioname:scenario.nom,sequencename:arraySequence[currentSequence-1].nom},"*");
		fenetreEcran2.postMessage({action:arraySequence[currentSequence-1].action2,cmd:"stop",scenarioname:scenario.nom,sequencename:arraySequence[currentSequence-1].nom},"*");
		setNotifBar("Le scénario est fini !","ok");
	}
	playingSequence = false;
}

function getSequenceDuree(seconde,minute){
	var scms = 0;
	var mnms = 0;
	
	if(seconde >0){
		scms = seconde * 1000;
	}
	if(minute >0){
		mnms =  minute * 60 * 1000 ;
	}
	
	return mnms + scms ;
}

function drawEcran2(imageData){
	canvasEcr1Context.putImageData(imageData, 0, 0,0,0,canvasEcr1.width,canvasEcr1.height);
}

function drawEecran1(imageData){
	canvasEcr2Context.putImageData(imageData,0,0,0,0,canvasEcr1.width,canvasEcr1.height);
}

function Timer(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
    };

    this.resume = function() {
        start = new Date();
        window.clearTimeout(timerId);
        timerId = window.setTimeout(callback, remaining);
    };
	
	this.stop = function(){
		window.clearTimeout(timerId);
	}

    this.resume();
}

function triggerChooseScenario(){
	$("#chooseFilef").trigger("click");
}

function disableInputs(){
	$("#choixScenarioButton").addClass("disabled loading");
	$("#modifierScenarioButton").addClass("disabled loading");
	$("#creerScenarioButton").addClass("disabled loading");
	$("#passerSequenceButton").addClass("disabled loading");
	$("#playSequenceButton").addClass("disabled loading");
	$("#tableauDeBord").addClass("disabled loading");
}

function enableInputs(){
	$("#choixScenarioButton").removeClass("disabled loading");
	$("#modifierScenarioButton").removeClass("disabled loading");
	$("#creerScenarioButton").removeClass("disabled loading");
	$("#passerSequenceButton").removeClass("disabled loading");
	$("#playSequenceButton").removeClass("disabled loading");
	$("#tableauDeBord").removeClass("disabled loading");
}

function checkClientInit(){
	if(initEcran1 && initEcran2){
		initNotifBar();
		enableInputs();
	}
}

function setNotifBar(message,icon){
	if(icon =="loading"){
		$("#notif_loader").addClass("active");
		$("#notif_warn").css('display','none');
		$("#notif_ok").css('display','none');
	}else if(icon=="warning"){
		$("#notif_loader").removeClass("active");
		$("#notif_warn").css('display','inline');
		$("#notif_ok").css('display','none');
	}else if(icon =="ok"){
		$("#notif_loader").removeClass("active");
		$("#notif_ok").css('display','inline');
		$("#notif_warn").css('display','none');
	}else{
		$("#notif_loader").removeClass("active");
		$("#notif_warn").css('display','none');
		$("#notif_ok").css('display','none');
	}
	$('#notif_text').html(message);
	
}

function initNotifBar(){
	var scenarioPath = $('#chooseFilet').val();
	if(scenarioPath ==""){
		setNotifBar("Veuillez choisir un scénario ou en créer un nouveau.","");
	}else{
		checkScenario(scenarioPath,"");
	}
}

function verifValidScenario(scenario){
	if(scenario.hasOwnProperty('nom') && scenario.hasOwnProperty('sequences')){
		if(scenario.sequences.length > 0){
			return true;
		}
	}
	return false;
}

addEventListener("message",function(e)
{
	/************ Le client est initialise ***********/
	/*********** On verifie si on peut remettre les inputs*/
	if(e.data.cmd == "init_ecran_2"){
		initEcran2 = true;
		checkClientInit();
	}
	if(e.data.cmd == "init_ecran_1"){
		initEcran1 = true;
		checkClientInit();
	}
	
	if(e.data.cmd == "ecr1_pret"){
		ecr1_pret = true;
		if(ecr1_pret && ecr2_pret && !playingSequence){
			startSequence();
		}
	}
	
	if(e.data.cmd == "ecr2_pret"){
		ecr2_pret = true;
		if(ecr1_pret && ecr2_pret && !playingSequence){
			startSequence();
		}
	}
},false);