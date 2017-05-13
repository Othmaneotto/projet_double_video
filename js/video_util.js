/******************************************
/* lib regroupant les fonctions pour
/* le traitement de la video
/* le parametrage des sources videos
/******************************************/

/********************/
/* Auteur: Valerian */
var fileReader;

var VideoUtil = {
	/* 
		Parcours la liste des peripheriques/sources audio
		disponibles et les mets dans un tableau
		Retourne le tableau de sources 
	*/
	listerDevices:function(){
		navigator.mediaDevices.enumerateDevices().then(function(devices){
			var arrayDevice=[];
			devices.forEach(function(device) {
				var tempDevice = {
					type:device.kind, //Le type de device ( audio/video)	
					name:device.label, //le nom du device 
					id:device.deviceId //L'id pour le getUserMedia()
				};
				arrayDevice.push(tempDevice);
				console.log(tempDevice);
			});
			var json = JSON.stringify(arrayDevice);
			localStorage.setItem("devices",json);
		}).catch(function(err) {
		  console.log("erreur lors de la recuperation des devices");
		});
	},
		
	/* Setup de la variable device contenant les infos
	sur notre camera pour pouvoir creer le flux video plus tard */
	getCameraObject:function(label_camera){
		var dev;
		var arrayVideo;
		
		arrayVideo = JSON.parse(localStorage.devices);
		//On cherche la camera correspondante au bebe
 		arrayVideo.forEach(function(device){
			if(device.type == "videoinput"){ 	
				if(device.name == label_camera){
					dev = device;
				}
			}
		});
		return dev;
	},
	
	getMicroObject:function(label_microphone){
		var dev;
		var arrayMicro;
		
		arrayMicro = JSON.parse(localStorage.devices);
		//On cherche la camera correspondante au bebe
 		arrayMicro.forEach(function(device){
			if(device.type == "audioinput"){ 	
				if(device.name == label_microphone){
					dev = device;
				}
			}
		});
		return dev;
	},
	
	createMediaRecorder:function(stream,handleDataAvailable,handleOnStop=undefined,handleError=undefined){
		//var options = this.getVideoMime(type);
		var mediaRecorder = new MediaRecorder(stream,{mimeType: 'video/webm;codecs=vp8'});
		mediaRecorder.ondataavailable = handleDataAvailable;
		if(handleOnStop){
			mediaRecorder.onstop = handleOnStop;
		}
		if(handleError){
			mediaRecorder.onerror = handleError;
		}
		return mediaRecorder;
	},
	
	createMediaStreamRecorder:function(stream,handleDataAvailable,type){
		var audioRecorder = RecordRTC(stream, {
		  recorderType: StereoAudioRecorder
		});
		return audioRecorder;
	},
	
	//Recupere le codec video/audio supporter par la navigateur
	//Pour le MediaRecorder
	getVideoMime: function(type){
		var options;
		if(type=='audio'){
			console.log("je passe dans l'audio");
			if (MediaRecorder.isTypeSupported('audio/wav')) {
			  options = {mimeType: 'audio/wav'};
			} else {
				console.log("getVideoMime : Probleme lors de la recuperation d'un type Mime"
							+ " audio.");
			}
		}else if(type=='video'){
			if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
			  options = {mimeType: 'video/webm;codecs=vp8'};
			} else {
				console.log("getVideoMime : Probleme lors de la recuperation d'un type Mime"
							+ " video.");
			}
		}
		return options;
	},
	
	//Blob --> Uint8Array
	createFileReader:function(fileReaderOnLoad){
		fileReader = new FileReader();
		fileReader.onload = fileReaderOnLoad;
	},
	
	
	
	/* 
		Creer un MediaSource
		MediaSource == Lecteur de buffer
	 */
	createMediaSource:function (container){
		if (this.hasMediaSource()) { 
			ms = new MediaSource();
			container.src = window.URL.createObjectURL(ms); // blob URL pointing to the MediaSource.
			ms.addEventListener('sourceopen', function(e){
			  sourceBuffer = ms.addSourceBuffer('video/webm; codecs="vp8"');
			});
			return ms;
		} else {
		  console.log("createMediaSource : Media source API non supportee.");
		}
	},
	
	/* 
	verifie si le navigateur peut utiliser l API MediaSource
	 */
	hasMediaSource:function(){
		return !!(window.MediaSource || window.WebKitMediaSource);	
	}
};


