/********************/
/* Auteur: Valerian */

/********** CONF DU LABO ************************/
var  LABEL_ECRAN = "7A1JBUfffx1DN8EiK/i7nSRLEogN0zegWNqAzdq1kXc="
var  LABEL_MICRO = "Microphone (Webcam C170)";
//*************************************************************/

var MESSAGE_SCREEN_READY ="init_ecran_1";
var MESSAGE_SEQUENCE_READY = "ecr1_pret";

/* Peripheriques */
var camera;
var microphone;

var currentSequence = "live";
var nextSequence = "";
var allRecorderStopped = false;

/* Flux videos/audios */
/* MainStream = Stream du getUserMedia audio+video */
var mainStream;
/* videoStream = Stream du canvas */
var videoStream;
/* audioStream  = Tracks audio de la camera uniquement */
var audioStream;
/* outputStream = composition des tracks canvas(videoStream)+tracks Audio; c'est lui qui est enregistrer
par le mediaRecorder */
var outputStream;
/*Le stream pour le differer video, ne contient qu'un flux video et ne sert
qu'a etre balancer dans le MediaSource*/
var differerStream;

/* Web Audio API */
var audioContexte;
var audioDestination;
var mainAudioNode;

/* Canvas */
var canvas;
var canvasContext;
var streaming = false;

/* Canvas */
var canvasMod;
var canvasModContext;

/* Pour la fonction de dessin sur la video*/
var image = new Image();
var draw = false;
var x=0;
var y=0;

/* containers audio/video(jouer une video jouer un son)*/
var containerVideo;
var containerAudio;
var containerVideoTemp;
var containerVideoPlay;

/* Recorder */
var recorderOutputStream;
var recordedFrames=[];

/*MediaSource*/
var recorderDifferer;
var ms;

var liveRecorder;
var recordedLiveFrames=[];

var loading = false;
var record = false;
var videoPlay = false;

var differer = false;

var noRecorderPlaying = true;
var sequenceStopped = true;
var canaudio = true;
var live = false;
var alpha = 1;

var scenarioName = "";
var sequenceName = "";

var fullStop = false;
/**********************************************************************/
/*  Ce qu'il reste à faire : 
	-Nettoyer, factoriser et refactorer le code
	- Stabiliser la fonction differer (MediaSource/MediaRecorder/SourceBuffer) 
	********************************************************************/					

window.onload = function(){
	initDevices();
	initCanvas();
	initFluxVideos();
}

/*IMPORTANT*/
/* Recupere les id de la camera et du micro*/
function initDevices(){
	console.log("initDevice start");
	camera = VideoUtil.getCameraObject(LABEL_ECRAN);
	microphone = VideoUtil.getMicroObject(LABEL_MICRO);
	console.log("initDevice end");
}

/* IMPORTANT ^*/
/* initialise le canvas dans lequel on va mettre la video*/
function initCanvas(){
	console.log("initCanvas start");
	canvas = document.getElementById("canvas");
	canvasContext = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
	canvasContext.scale(-1,1);
	console.log("initCanvas end");
}

/* IMPORTANT*/
/* initialise les stream videos*/
/* mainstream = stream flux camera + micro non du getUserMedia*/
function initFluxVideos(){
	console.log("initFluxVideos start");
	containerVideo = document.getElementById('containerVideo');
	containerVideoTemp = document.getElementById('containerVideoTemp');
	
	var videoConstraint = {
		video : {
			deviceId:camera.id,
			width: { max: 1920},
			height: { max: 1080 } //full hd
		},
		audio : {
			deviceId: microphone.id,
			echoCancellation: false
		}
	}
	var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	getUserMedia.call(navigator,videoConstraint,onMediaSuccess,onMediaFailure);
	console.log("initFluxVideos end");
}

/* important callback du getusermedia*/
function onMediaSuccess(stream){
	console.log("getUserMediaSuccess start");
	mainStream = stream;
	//On met nos stream dans un container video HTML5
	containerVideo.src = URL.createObjectURL(stream);
	containerVideoTemp.src = URL.createObjectURL(stream);
	linkCanvasToVideo(containerVideo); 	//c'est la fonction qui permet de dessiner la video dans le canvas
	setNormalAudio(); //on met de l'audio sur la sortie
	parent.opener.postMessage({cmd:MESSAGE_SCREEN_READY},"*");
	console.log("getUserMediaSuccess end");
}

/* Callback lorsque le getusermedia n'arrive pas a recuperer les peripheriques */
function onMediaFailure(){
	console.log("Le navigateur n'a pas pu recuperer le flux des peripheriques");
	console.log("Nom de la camera:" +LABEL_ECRAN);
	console.log("Nom du micro:" + LABEL_MICRO);
	console.log("Veuillez verifier les noms des appareils");
}

/*important*/
/*fonction qui permet de dessiner la video dans le canvas*/
function linkCanvasToVideo(video){
	console.log("linkVideoToCanvas start");
	video.addEventListener('canplay', function(e) {
		if(streaming==false){
		  /* On scale le canvas par rapport a la taille de la video
		  ATTENTION : Si tu scale le canvas et que tu demarres un mediaRecorder qui a une reference sur le canvas
		  pendant que celui se scale ou juste apres, le mediaRecorder PLANTE. Faut donc attendre un peut
		  Le streaming == false c'est pour pas rescale le canvas a un changement de video alors que ya deja un mediaRecorder
		  qui tourne deja, ça le ferait planter */
 		  if (video.videoWidth > 0){
			    // a changer, pas tres propre
				canvas.height = 1080;
		  }
		  streaming = true;
		}
	}, false);
	
	/*Listener lorsque la video contenant le mainStream  est en lecture
	  on dessine le flux dans un canvas */
	video.addEventListener('play', function() {
	   setInterval(function() {
		/* Le flag loading permet de savoir si on initialise une sequence, dans ce cas 
		on dessine du live temporaire
		ce flag est modifier par la fonction tempLive() */
		if(!loading){
			  //Si la video se met en pause ou se termine, on ne fait rien (handle les plantages egalement)
			  if (video.paused || video.ended) return;
			  canvasContext.fillRect(0, 0, canvas.width, canvas.height);
			  //On dessine la video qui est directement l'objet DOM video
			  canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
			  /* Flag pour savoir si on est dans une sequence dessin d'image
			  Si true on dessine l'image(qui est une variable globale) par dessus la video */
			  if(draw==true){
				//Transparence
				canvasContext.globalAlpha = alpha;
				canvasContext.drawImage(image,x,y,l,h); 
			  //Meme chose que pour draw mais on est dans une sequence video
			  }else if(videoPlay){
				canvasContext.globalAlpha = alpha;
				canvasContext.drawImage(containerVideoPlay,x,y,l,h);
			  }
		  }else{
			  if (containerVideoTemp.paused || containerVideoTemp.ended) return;
			  canvasContext.fillRect(0, 0, canvas.width, canvas.height);
			  //On dessine la video qui est directement l'objet DOM video
			  canvasContext.drawImage(containerVideoTemp, 0, 0, canvas.width, canvas.height);  
		  }
	   }, 33); //Frequence de dessin du seconde en millisecondes
	}, false);
	console.log("linkVideoToCanvas end");
}

/* fonctionnalite live */
function stopLive(){
	//Pour stopped un live, on release la source du containerVideo
	URL.revokeObjectURL(containerVideo);
	sequenceStopped = true;
}

/** Initialise une sequence de live*/
function switchToLive(){
	sequenceStopped = false;
	currentSequence = 'live';
	/* Stream de live dans le container video*/
	containerVideo.src = URL.createObjectURL(mainStream);
	/* creation du stream d'enregistrement */
	createSimpleOutputStream();
	/* Creation du buffer du stream d'enregistrement */
	createRecorder();
	/* Demarrage de l'enregistrement*/
	startRecorder();
}


/* Permet d'envoyer de l'audio dans la sortie par defaut. Utile? Maybe */
function setNormalAudio(){
	audioStream = new MediaStream();
	var audioTracks = mainStream.getAudioTracks();
	audioTracks.forEach(function(track){
		audioStream.addTrack(track);
	});
	
	audioContexte = new (window.AudioContext || window.webkitAudioContext)();
	mainAudioNode = audioContexte.createMediaStreamSource(audioStream);
	mainAudioNode.connect(audioContexte.destination);
}

/* Enleve l'audio du live de la sortie */
function disconnectNormalAudio(){
	audioContexte = new (window.AudioContext || window.webkitAudioContext)();
	mainAudioNode = audioContexte.createMediaStreamSource(audioStream);
	mainAudioNode.connect(audioContexte.destination);
}

/* pour chaque type de sequence, il y a une fonction pour generer le stream final afin de l'enregistrer*/
/* important en test: creation du stream pour l'objet d'enregistrement,
puisque notre video est dans un canvas, on ne peut pas se resservir directement
du stream du getusermedia*/
function createSimpleOutputStream(delay = undefined){
	/* en test : decompose le stream de la camera en deux stream*/
	audioStream = new MediaStream();
	//On creer un stream a partir du canvas
	videoStream = canvas.captureStream();
	var audioTracks = mainStream.getAudioTracks();
	/* recuperation les tracks du mainstream(en clair le son de la camera)
	Pareil, on s'en resert dans createSimpleOutputStream */
	audioTracks.forEach(function(track){
		audioStream.addTrack(track);
	});
	//creation d'un contexte audio web audio api --> permet d'appliquer des effets a un stream audio
	audioContexte = new (window.AudioContext || window.webkitAudioContext)();
	//Tricky ici, streamdestination permet de creer un stream sur lequel on peut "plugger" des effets audios
	streamDestination = audioContexte.createMediaStreamDestination();
	//Creation d'une source audio(le stream audio de la camera)
	mainAudioNode = audioContexte.createMediaStreamSource(audioStream);
	
	//Ajout d'un delay
	if(typeof delay!=="undefined"){
		var delayed = audioContexte.createDelay();
		delayed.delayTime.value = delay;
		mainAudioNode.connect(delayed);
		//On ajoute le delay en sortie et dans le stream de destination
		delayed.connect(audioContexte.destination);
		delayed.connect(streamDestination);
	}else{
		/* La fonction connect permet de connecter une source audio, 
		ici on ajoute le noeud audio principal
		(creer a partir de l'audiostream) a la sortie par defaut*/
		mainAudioNode.connect(audioContexte.destination);
		mainAudioNode.connect(streamDestination);
	}
	var processedAudioStream = streamDestination.stream;
	outputStream = new MediaStream();
	/* Recuperation de notre stream avec effets
	On met tout dans outputStream qui va nous servir a enregistrer le canvas + l'audio modif dans un mediaRecorder */
	[processedAudioStream, videoStream].forEach(function(s) {
		s.getTracks().forEach(function(t) {
			outputStream.addTrack(t);
		});
	});
}

/*important*/
/* Objet permettant de recuperer les frames videos dans un format Blob qu'on met ensuite dans un buffer*/
/* attention: ne doit pas etre appeler juste apres une modification sur le canvas*/
function createRecorder(){
	if(outputStream){
		recorderOutputStream = VideoUtil.createMediaRecorder(outputStream,dataAvailable,onStop,onError);
	}else{/* console.log("Le stream ne peut pas etre enregistrer."); */}
}

/* Recorder pour recuperer les frames du lives, record le mainStream(getUserMedia)*/
function createLiveRecorder(){
	if(mainStream){
		liveRecorder = VideoUtil.createMediaRecorder(mainStream,dataLiveAvailable,onLiveStop,onError);
	}else{/*console.log("Le stream ne peut pas etre enregistrer.");*/}
}

/*Demarrage de l'enregistrement du stream composé canvas + audio */
function startRecorder(){
	/* Ici on attend que les autres recorders soient bien demarrer
	/* Pour avoir des buffers de meme taille entre le flux video modifier et non modifier
	Les flags sont modifier lorsque qu'on est sur que les recorder enregistres, c'est a dire dans
	les dataAvailable() respectifs*/
	var t = setInterval(function(){
		if(!differer && canaudio && live){
				parent.opener.postMessage({cmd:MESSAGE_SEQUENCE_READY},"*");
				clearInterval(t);
		}
	},50);
	recorderOutputStream.start(1);
}

/* Demarrage du recorder du live, rien de special ici */
function startLiveRecorder(){
	liveRecorder.start(1);
}

/* A chaque fois qu'on stop le recorder, en realite on change de sequence
recorderOutputStream.stop(); trigger un callback qui enregistre la video*/
function stopRecorder(){
	recorderOutputStream.stop();
}

function stopLiveRecorder(){
	liveRecorder.stop();
}

/*Reception de frames du flux canvas + audio (outputStream)*/
function dataAvailable(event){
	noRecorderPlaying = false;
	if(event.data.size > 0){
		/*Remplissage du buffer*/
		recordedFrames.push(event.data);
	}else{/* console.log("Je ne reçois pas de données."); */}
}

function dataLiveAvailable(event){
	noRecorderPlaying = false;
	live = true;
	if(event.data.size > 0){
		recordedLiveFrames.push(event.data);
	}else{/* console.log("Je ne reçois pas de données."); */}
}

/* IMPORTANT : callback lorsque qu'on arrete le media recorder */
function onStop(){
	/* On creer un Blob a partir des frames disponibles dans notre tableau*/
	var BlobVideo = new Blob(recordedFrames,{'type':'video/webm'});
	/* Fonction d'enregistrement sur le serveur */
	uploadVideo(BlobVideo);
	/* On clear le buffer*/
	recordedFrames = [];
}

/* Meme chose que onStop() mais pour le recorder du live */
function onLiveStop(){
	var BlobVideo = new Blob(recordedLiveFrames,{'type':'video/webm'});
	uploadLiveVideo(BlobVideo);
	recordedLiveFrames = [];
	live = false;
}

/************************* fonctionnalite differer *****************/
/* IMPORTANT : differer audio, audio+video, video */
function switchToDifferer(type,delayAudio,delayVideo){
	sequenceStopped = false;
	currentSequence = 'differer';
	switch(type){
		case 'audio':
			/* Live dans le container video */
			containerVideo.src = URL.createObjectURL(mainStream);
			/* on creer le flux final avec un delay audio en plus*/
			createSimpleOutputStream(delayAudio);
			createRecorder();
			startRecorder();
			break;
		case 'video':
			differer = true;
			/* Pour un differer video, on decale le retour des frames du mediaRecorder (dataAvailableForDelay)
			   du nombre de secondes voulues
			   Puis envoie des frames dans un mediaSource ( affichage  des blobs videos)*/
			VideoUtil.createFileReader(appendToSourceBuffer);
 			ms = VideoUtil.createMediaSource(containerVideo); 
 			createDiffererStream();
			createSimpleOutputStream();
			createRecorderDifferer();
			createRecorder();
			startDiffererRecorder(delayVideo);
 			startRecorder();
			break;
		case 'audiovideo':
			/* Ni plus ni moins que la combinaison des deux precedents*/
			differer=true;
			VideoUtil.createFileReader(appendToSourceBuffer);
			ms = VideoUtil.createMediaSource(containerVideo);
			createDiffererStream();
			createSimpleOutputStream(delayAudio);
			createRecorderDifferer();
			createRecorder();
			startDiffererRecorder(delayVideo);
			startRecorder();
			break;
	}
}

/*** Fin d'une sequence de differer, on release le mediasource */
function stopDifferer(){
	if(ms){
		ms.removeSourceBuffer(sourceBuffer);
		ms.endOfStream();
	}
	sequenceStopped = true;
}

/*Le stream pour le differer n'a besoin que de video
donc creation d'un nouveau stream plutot qu'utilisation d'une main stream*/
function createDiffererStream(){
	differerStream = new MediaStream();
	var videoTracks = mainStream.getVideoTracks();
	
	videoTracks.forEach(function(track){
		differerStream.addTrack(track);
	});
}

/*Recorder uniquement pour du differer
Utilise un stream video differer*/
function createRecorderDifferer(){
	recorderDifferer = VideoUtil.createMediaRecorder(differerStream,dataAvailableForDelay,onStopDifferer,onError);
}

function startDiffererRecorder(differera){
	recorderDifferer.start(differera);
}

function stopRecorderDifferer(){
	/*Petit test pour eviter les invalides states quand on le coupe*/
	if(recorderDifferer){
		if(recorderDifferer.state ==='recording' || recorderDifferer.state ==='paused' ){
			recorderDifferer.stop();
		}	
	}
}

/* Les frames recuperees le recorder du flux differer sont poussees
dans un buffer specifique pour le MediaSource */
function appendToSourceBuffer(){
	arrayBuffer = this.result;
	sourceBuffer.appendBuffer(arrayBuffer);
}

/* Callback du recorder differer lorsqu'il recoit des frames*/
function dataAvailableForDelay(event) {
  differer= false;
  noRecorderPlaying = false;
  if (event.data.size > 0) {
	//On transforme le blob en ArrayBuffer Uint8Array pour le sourceBuffer du MediaSource
	fileReader.readAsArrayBuffer(event.data);
  } else {/* console.log("Aucune donnée reçue"); */}
}

function onStopDifferer(){
/* 	console.log("Arret du recorder pour le differer video"); */
}

/* Affichage d'erreur lorsqu'un mediaRecorder plante*/
function onError(event){
	console.log("Une erreur est survenue :"+ event);
}

/*********************************** FONCTIONNALITE VIDEO ************************/
//On balance une video dans le tag <video> containerVideoPlay
function switchToReplay(filename){
	sequenceStopped = false;
	currentSequence = 'video';
	//On change le source du container avec la nouvelle video
	var jcontainerVideo = $('#containerVideoPlay');
	containerVideoPlay = jcontainerVideo[0];
	jcontainerVideo.attr("src","/doublevideo/media/video/"+filename);
	
	/*On demute la video pour generer des données audio*/
	muteVideo(containerVideoPlay,false);
	/* creation du stream d'enregistrement canvas + audio du tag <video>*/
	createReplayOutputStream();
	/*on charge la video*/
	jcontainerVideo.load();
	containerVideoPlay.addEventListener('canplay',function(){
		containerVideoPlay.play();
		videoPlay = true;
	});
	
	containerVideoPlay.addEventListener('ended',function(){
		tempLive(true);
		videoPlay = true;
	});
	
	createRecorder();
	startRecorder();
}

/***** Fin d'une sequence replay *****/
function stopReplay(){
	muteVideo(containerVideo,true);
	containerVideoPlay.pause();
	// On release le precedent stream
	URL.revokeObjectURL(containerVideo.src);
	videoPlay = false;
	sequenceStopped = true;
}


/* IMPORTANT: Meme chose que pour createSimpleOutputStream
mais la source audio est ici notre tag video plutot que l'audio de la cam*/
/* outputstream de la fonction switchToReplay*/
function createReplayOutputStream(){
	audioStream = new MediaStream();
	videoStream = canvas.captureStream(30);

	audioContexte = new (window.AudioContext || window.webkitAudioContext)();
	streamDestination = audioContexte.createMediaStreamDestination();
	
	var videoSource = audioContexte.createMediaElementSource(containerVideoPlay);
	videoSource.connect(audioContexte.destination);
	videoSource.connect(streamDestination);

	var processedAudioStream = streamDestination.stream;
	
	outputStream = new MediaStream();

	[processedAudioStream, videoStream].forEach(function(s) {
		s.getTracks().forEach(function(t) {
			outputStream.addTrack(t);
		});
	});
}

/************************** FONCTIONNALITE SON **************************/
function stopSound(){
	muteVideo(containerAudio,true);
	// On release le precedent stream
	if(containerAudio){
		URL.revokeObjectURL(containerAudio.src);	
	}
	sequenceStopped = true;
}

/******Initialisation d'une sequence Audio *******/
function switchToplaySound(path){
	canaudio = false;
	sequenceStopped = false;
	currentSequence = 'audio';
	/*On change le source du container avec la nouvelle video*/
	var jcontainerAudio = $('#containerAudio');
	containerAudio = jcontainerAudio[0];
	jcontainerAudio.attr("src","/doublevideo/media/son/"+path);
	jcontainerAudio.load();
	muteVideo(containerAudio,false); 	//On peut utiliser cette fonction aussi pour un tag audio
	containerAudio.addEventListener('canplay',function(){
		var t = setTimeout(function(){
			containerAudio.play();
		},2000);
		canaudio = true;
	});
	createSoundOutputStream();
	createRecorder();
	startRecorder();
}

/* Meme chose que pour createSimpleOutputStream
mais la source audio est ici notre tag audio  plutot que l'audio de la cam*/
/* En vrai il n'y a pas besoin d'une deuxieme fonction, mais manque de temps
on oublie les bonnes pratiques*/
function createSoundOutputStream(){
	audioStream = new MediaStream();
	videoStream = canvas.captureStream(30);
	
	var audioTracks = mainStream.getAudioTracks();
	//Ici on creer notre stream audio en recuperant les tracks du mainstream(en clair le son de la camera)
	// on s'en resert dans createSimpleOutputStream
	audioTracks.forEach(function(track){
		audioStream.addTrack(track);
	});
	
	//On recupere l'audio de la camera, on l'envoie dans la sortie et le stream de record
	audioContexte = new (window.AudioContext || window.webkitAudioContext)();
	streamDestination = audioContexte.createMediaStreamDestination();
	mainAudioNode = audioContexte.createMediaStreamSource(audioStream);
	mainAudioNode.connect(audioContexte.destination);
	mainAudioNode.connect(streamDestination);
	
	//Meme chose pour l'audio du tag audio qui jouera notre son
	var audioSource = audioContexte.createMediaElementSource(containerAudio);
	audioSource.connect(audioContexte.destination);
	audioSource.connect(streamDestination);
	
	//On recupere le stream de record dans un objet
	var processedAudioStream = streamDestination.stream;
	
	outputStream = new MediaStream();

	[processedAudioStream, videoStream].forEach(function(s) {
		s.getTracks().forEach(function(t) {
			outputStream.addTrack(t);
		});
	});
}

/**************** FONCTIONNALITE IMAGE **************/
/* On met la variable draw a true pour que le canvas dessine
l'objet image*/
function switchToImageOverVideo(path,xc,yc,lc,hc){
	sequenceStopped = false;
	currentSequence = 'image';
	containerVideo.src = URL.createObjectURL(mainStream);
	createSimpleOutputStream();
	createRecorder();
	image.src = "/doublevideo/media/images/"+path;
	x= xc;
	y=yc;
	l = lc;
	h= hc;
	draw = true;
	startRecorder();
}

function stopImageOverVideo(){
	draw = false;
	sequenceStopped = true;
}

/* Permet de switcher sur du live pendant le changement
d'une sequence*/
function tempLive(enabled){
	if(!enabled){
		loading = false;
		$("#containerVideoTemp")[0].pause();
	}else{
		$("#containerVideoTemp")[0].play();
		loading = true;
	}
}

/* important : permet de muter une <video> ou <audio> */
function muteVideo(containerVideo,mute){
	if(mute){
        containerVideo.muted = true;
	}else{
        containerVideo.muted = false;
	}
}

/* Lorsque qu'on stop une sequence, on veut que les objets d'enregistrements
soient bien tous arreter pour en demarrer une nouvelle
Le role de cette fonction est donc d'attendre l'arret total de tous les recorders*/
function stopMainRecorders(){
	
	var rdif=true;
	var r=true;
	var rlive = true;
	
	if (typeof recorderOutputStream ==="undefined" && typeof recorderDifferer === "undefined" && typeof liveRecorder==="undefined" ){
		rdif=false;
		r=false;
		rlive = false;
	}else{
		if(typeof recorderOutputStream!=="undefined"){
			if(recorderOutputStream.state == "paused" || recorderOutputStream.state =="recording"){
				stopRecorder();	
			}else{
				r=false;
			}
		}else{
			r=false;
		}
		
		if(typeof recorderDifferer!=="undefined"){
			if(recorderDifferer.state == "paused" || recorderDifferer.state =="recording"){
 				stopRecorderDifferer(); 
			}else{
				rdif=false;
			}
		}else{
			rdif=false;
		}
		
		if(typeof liveRecorder!=="undefined"){
			if(liveRecorder.state == "paused" || liveRecorder.state =="recording"){
				stopLiveRecorder();	
			}else{
				rlive=false;
			}
		}else{
			rlive=false;
		}
	}

	if(!rdif && !r && !rlive){
		noRecorderPlaying = true;
		return true;
	}
}

/* Permet de stopper correctement une sequence en cours */
function stopCurrentSequence(){
	var waitForRecorders = setInterval(function(){
		if(!noRecorderPlaying){
			stopMainRecorders();
		}else{
			switch(currentSequence){
				case 'live':
					stopLive();
					break;
				case 'differer':
					stopDifferer();
					break;
				case 'video':
					stopReplay();
					break;
				case 'image':
					stopImageOverVideo();
					break;
				case 'audio':
					stopSound();
					break;
			}
			allRecorderStopped = true;
			clearInterval(waitForRecorders);
		}
	},500);
}

/*Permet a partir d'une action(comprendre action d'une sequence) en Json
de creer les bon parametres*/
function parseActionThenInit(action){
	createLiveRecorder();
	startLiveRecorder();
	switch(action.nom){
		case 'live':
			switchToLive();
			break;
		case 'differer':
			var type = "";
			var audio = 0;
			var video = 0;
			if(action.param.hasOwnProperty('audio')){
				type = type + "audio";
				var unite = "";
				
				if(action.param.typeAudio == "ms"){
					unite = 1000;
				}else if(action.param.typeAudio == "sc"){
					unite = 1;
				}
				audio = action.param.audio / unite;
			}
			if(action.param.hasOwnProperty('video')){
				type = type +"video";
				var unite = 0;
				
				if(action.param.typeVideo === "ms"){
					unite = 1;
				}else if(action.param.typeVideo === "sc"){
					unite = 1000;
				}
				video = action.param.video * unite;
			}
			switchToDifferer(type,audio,video);
			break;
		case 'video':
			var filename = action.param.filename;
			var type = action.param.type;
			var xt = 0;
			var yt = 0;
			var lt = canvas.width;
			var ht = canvas.height;
			var filigrane = 1;
			if(action.param.hasOwnProperty('filigrane')){
				filigrane = action.param.filigrane;
				if(filigrane > 1){
					filigrane = 1;
				}else{
					if(filigrane<0){
						filigrane = 0.1;
					}
				}
			}
			if(type =="perso"){
				xt = action.param.x;
				yt = action.param.y;
				lt = action.param.largeur;
				ht = action.param.hauteur;
			}
			x=xt;y=yt;l=lt;h=ht;
			alpha = filigrane;
			switchToReplay(filename);
			break;
		case 'image':
			var filename = action.param.filename;
			var type = action.param.type;
			var xt = 0;
			var yt = 0;
			var lt = canvas.width;
			var ht = canvas.height;
			var filigrane = 1;
			if(action.param.hasOwnProperty('filigrane')){
				filigrane = action.param.filigrane;
				if(filigrane > 1){
					filigrane = 1;
				}else{
					if(filigrane<0){
						filigrane = 0.1;
					}
				}
			}
			if(type =="perso"){
				xt = action.param.x;
				yt = action.param.y;
				lt = action.param.largeur;
				ht = action.param.hauteur;
			}
			alpha = filigrane;
			switchToImageOverVideo(filename,xt,yt,lt,ht,filigrane);
			break;
		case 'sequence':
			break;
		case 'audio':
			var filename = action.param.filename;
			switchToplaySound(filename);
			break;
	}
}

/* Receiver de postMessage */
addEventListener("message",function(e)
{
		/*Demande d'initialisation d'une nouvelle action par le moniteur*/
		if(e.data.cmd =='action'){
			record=false;
			tempLive(true);
			stopCurrentSequence();
			/* On attend que qu'il n'y ai aucune sequence en train d'etre jouee
				(sequenceStopped) ou de recorder encore en memoire(allRecorderStopped)
				oiyr demarrer une nouvelle initialisation de sequence*/
			var initNextSequence = setInterval(function(){
				fullStop = false;
				if(sequenceStopped && allRecorderStopped){
					sequenceName  = e.data.sequencename;
					scenarioName = e.data.scenarioname;
					parseActionThenInit(e.data.action);
					allRecorderStopped = false;
					clearInterval(initNextSequence);
				}
			},500);
		}else if(e.data.cmd ==='start'){
			/*Le moniteur dit au client demarrer*/
			tempLive(false);
			record = true;
		}else if(e.data.cmd === 'stop'){
			/* fin total du scenario */
			sequenceName  = e.data.sequencename;
			scenarioName = e.data.scenarioname;
			record=false;
			tempLive(true);
			stopMainRecorders();
		}
},false);


/*fonctions de sauvegarde sur le server */
function uploadVideo(blob){
	
	var reader1 = new FileReader();
	var  seqname = sequenceName;
	var scename = scenarioName;
    reader1.onload = function(event){
        var fd = new FormData();
		fd.append('ecran', 'ecran1');
		fd.append('sequence_name',seqname);
		fd.append('scenario_name',scename);
        fd.append('data', event.target.result);
        $.ajax({
            type: 'POST',
            url: 'http://localhost/doublevideo/php/video_saver.php',
            data: fd,
            processData: false,
            contentType: false
        }).done(function(data) {
            //console.log(data);
        });
    };      
    reader1.readAsDataURL(blob);
}

function uploadLiveVideo(blob){
	
	var reader2 = new FileReader();
	var  seqname = sequenceName;
	var scename = scenarioName;
    reader2.onload = function(event){
        var fd = new FormData();
		fd.append('ecran', 'ecran1');
		fd.append('sequence_name',seqname);
		fd.append('scenario_name',scename);
        fd.append('data', event.target.result);
        $.ajax({
            type: 'POST',
            url: 'http://localhost/doublevideo/php/videolive_saver.php',
            data: fd,
            processData: false,
            contentType: false
        }).done(function(data) {
            //console.log(data);
        });
    };      
    reader2.readAsDataURL(blob);
}