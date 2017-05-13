var maxSequence = 0;
var currentSequence = 0;
var arraySequence = [];
var scenarioPath = "http://localhost/projet_double_video/scenarios/";
var scenario;

/* Structure d'un scenario

 var scenario = {
	 nom : String,
	 sequences : [
		sequence : {
			id:
			nomSequence : int,
			minutes : int,
			secondes : int,
			ecran1 : {
				nomAction :
				[param]:
			}
			ecran2 : {
				nomAction :
				[param]:
			}
		}
	 ]
 }

*/window.onload = function(){
	initUi();
}

function initUi(){
	$('.ui.radio.checkbox').checkbox();
	$( "#selectable" ).selectable();
	$('.menu .item').tab();
	$('.ui.dropdown').dropdown();
	initCheckboxes();
	initChooseFile();
	if(localStorage.scenario =='' || localStorage.scenario == null){
		addSequence();
	}else{
		var filename = localStorage.scenario;
		disableAllInput();
		getScenarioFromServer(filename);
	}
}

function getScenarioFromServer(filename){
	 $.get(scenarioPath+filename, function(data) {
		setScenarioInfos(filename);
		scenario = JSON.parse(data);
		arraySequence = scenario.sequences;
		initSequence();
		enableAllInput();
		disableScenarioParam();
	});
}

function initSequence(){
	arraySequence.forEach(function (sequence){
		maxSequence ++;
		var idButton = "buttonSequence" + sequence.id;
		var nomButton = sequence.nom ;
		var $input = $('<div class="item" id='+idButton+'><button class="ui button">'+nomButton+'</div></div>');
		$input.appendTo($("#list_sequence"));
		
		$("#"+idButton).find('button').click(function(){
			//On change la couleur du bouton 
			$('button[class*="red"]').removeClass("red");
			$(this).addClass("red");
			
			updateSequence();
			
			//On recupere l'index de la sequence associee au bouton
			var array = $('div[id*="buttonSequence"]').find('.button');
			index = array.index($(this));

			currentSequence = arraySequence[index].id;
			changeSequenceForm(arraySequence[index]); 
		});
	});
	
	var sequence = arraySequence[arraySequence.length-1];
	changeSequenceForm(sequence);
	currentSequence = sequence.id;
	$('div[id*="buttonSequence"]').find('button[class*="red"]').removeClass("red");
	$('div[id="buttonSequence'+currentSequence+'"]').find('.button').addClass("red");
}

function disableAllInput(){
	$('.segment').addClass('loading');
	$('.input').addClass('disabled');
}

function enableAllInput(){
	$('.segment').removeClass('loading');
	$('.input').removeClass('disabled');
}

function updateSequenceDropdown(){
	var i = 0;
	arraySequence.forEach(function(sequence){
		i++;
		var $input = $('<div data-value="'+i+'" class="item">'+sequence.nom+'</div>');
		$input.appendTo($('.list_sequence_dropdown'));

	});
}

function initChooseFile(){
	for(let i=1;i<=2;i++){
		$('#param_ecr'+i).find("input[type=file][class*=fileVideo]").change(function(){
			$('#param_ecr'+i).find("input[type=text][class*=fileVideo]").val(($(this).val()));
		});
		$('#param_ecr'+i).find("input[type=file][class*=fileImage]").change(function(){
			$('#param_ecr'+i).find("input[type=text][class*=fileImage]").val(($(this).val()));
		});

		$('#param_ecr'+i).find("input[type=file][class*=ecr_chooseFileAudio]").change(function(){
			$('#param_ecr'+i).find("input[type=text][class*=fileAudio]").val(($(this).val()));
		});
	}
}

function initCheckboxes(){
	$('input[type=radio][name=action_ecr1]').on('change', function() {
		var id = "unknown";
		 switch($(this).val()) {
			 case 'live':
				 id = "param_ecr1_live";
				 break;
			 case 'differer':
				 id = "param_ecr1_dif";
				break;
			case 'video':
				 id = "param_ecr1_video";
				 break;
			 case 'image':
				 id = "param_ecr1_image";
				break;
			case 'sequence':
				 id = "param_ecr1_sequence";
				 break;
			 case 'audio':
				 id = "param_ecr1_audio";
				break;
		 }
		$('div[id='+id+']').css("display","inline");
		$('div[class=param1][id!='+id+']').css("display","none");
	});
	$('input[type=radio][name=action_ecr2]').on('change', function() {
		var id2 = "unknown";
		 switch($(this).val()) {
			 case 'live':
				 id2 = "param_ecr2_live";
				 break;
			 case 'differer':
				 id2 = "param_ecr2_dif";
				break;
			case 'video':
				 id2 = "param_ecr2_video";
				 break;
			 case 'image':
				 id2 = "param_ecr2_image";
				break;
			case 'sequence':
				 id2 = "param_ecr2_sequence";
				 break;
			 case 'audio':
				 id2 = "param_ecr2_audio";
				break;
		 }
		 var a =$('div[id='+id2+']');

		 $('div[id='+id2+']').css("display","inline");
		 $('div[class=param2][id!='+id2+']').css("display","none");
	});
	$('#tab_ecr1').find('input[type=checkbox][class*=differer]').on('change', function() {
		var checked = $('#tab_ecr1').find('input[type=checkbox][class*=differer]:checked');
		if(checked.length == 0){
			$(this).prop("checked", true);
		}
	});
	$('#tab_ecr2').find('input[type=checkbox][class*=differer]').on('change', function() {
		var checked = $('#tab_ecr2').find('input[type=checkbox][class*=differer]:checked');
		if(checked.length == 0){
			$(this).prop("checked", true);
		}
	});
}

function updateSequence(){
	//On met a jour la sequence precedemment selectionnee
	if(currentSequence!=0){
		var sequence = parseSequence();
		var result = $.grep(arraySequence, function(e){ return e.id == currentSequence; });
		
		var i = 0;
		var index = 0;
		arraySequence.forEach(function(seq){
			if(result[0].id == seq.id){
				index = i;
			}
			i++;
		});
		arraySequence[index] = sequence;
	}
}

function addSequence(){
	maxSequence ++;
	var idButton = "buttonSequence" + maxSequence;
	var nomButton = "Sequence "+ maxSequence ;
	
	var $input = $('<div class="item" id='+idButton+'><button class="ui button">'+nomButton+'</div></div>');
    $input.appendTo($("#list_sequence"));
	
	$("#"+idButton).find('button').click(function(){
		//On change la couleur du bouton 
		$('button[class*="red"]').removeClass("red");
        $(this).addClass("red");

		updateSequence();
		
		//On recupere l'index de la sequence associee au bouton
		var array = $('div[id*="buttonSequence"]').find('.button');
		index = array.index($(this));

		currentSequence = arraySequence[index].id;

		changeSequenceForm(arraySequence[index]); 
    }); 
	
	var sequence = {
		id: maxSequence,
		nom: "sequence"+maxSequence,
		minute: 1,
		seconde: 0,
		action1:{
			nom : 'live'
		},
		action2:{
			nom : 'live'
		}
	}
	
		//Valeurs par defaut
	setFormDefaultValue();
	updateSequence();
	changeSequenceForm(sequence);
	arraySequence.push(sequence);
	
	currentSequence = sequence.id;
	$('div[id*="buttonSequence"]').find('button[class*="red"]').removeClass("red");
	$('div[id="buttonSequence'+currentSequence+'"]').find('.button').addClass("red");
}

/*Permet de modifier les valeurs du formulaire en fonction d'une sequence*/
function changeSequenceForm(sequence){
	var id = sequence.id;
	var nom = sequence.nom;
	var action1 = sequence.action1;
	var action2 = sequence.action2;
	var duree_m = sequence.minute;
	var duree_s = sequence.seconde;
	
	//On change le nom de la sequence
	$('#nomSequence').val(nom);
	
	//Duree de la sequence
	$('#seconde_sequence').val(duree_s);
	$('#minute_sequence').val(duree_m);
	
	//On met les bonnes actions dans les params
	setActionForm(1,action1);
	setActionForm(2,action2);
}

function setFormDefaultValue(){
	for(let i = 1 ; i<= 2; i++){
		var container = "#tab_ecr"+i;
						
		$(container).find('input[type=checkbox][class=differerAudio]').prop("checked", true);
		$(container).find("input[type=text][class*=differerVideo]").val('500');
		$(container).find("input[type=text][class*=differerAudio]").val('500');
		$(container).find(".videoDiffererDropdown").dropdown('set value','ms');
		$(container).find(".videoDiffererDropdown").dropdown('set selected','ms');
		$(container).find(".audioDiffererDropdown").dropdown('set value','ms');		
		$(container).find(".audioDiffererDropdown").dropdown('set selected','ms');			
		$(container).find(".video_ecr_x").val(0);
		$(container).find(".video_ecr_x").val(0);
		$(container).find(".video_ecr_w").val(100);
		$(container).find(".video_ecr_h").val(100);
		$(container).find('[value="fullscreen"]').prop("checked", true);	
		$(container).find(".video_ecr_opacity").val(0.5);			
		$(container).find(".image_ecr_x").val(0);
		$(container).find(".image_ecr_x").val(0);
		$(container).find(".image_ecr_w").val(100);
		$(container).find(".image_ecr_h").val(100);
		$(container).find('[value="fullscreen"]').prop("checked", true);	
		$(container).find(".image_ecr_opacity").val(0.5);
	}
}

function setActionForm(ecran,action){
	var container = "";
	var idRadio = "";
	
	switch(ecran){
		case 1:
			container = "#tab_ecr1";
			break;
		case 2:
			container = "#tab_ecr2";
			break;
	}

	switch(action.nom){
		case 'live':
			idRadio = '.checkbox_live';
			break;
		case 'differer':
			idRadio = '.checkbox_differer';
			if(action.param.hasOwnProperty('audio')){
				$(container).find("input[type=text][class*=differerAudio]").val(action.param.audio);
				$(container).find('input[type=checkbox][class*=differerAudio]').prop("checked", true);
				$(container).find(".audioDiffererDropdown").dropdown('set value',action.param.typeAudio);
			}
			if(action.param.hasOwnProperty('video')){
				$(container).find("input[type=text][class*=differerVideo]").val(action.param.video);
				$(container).find('input[type="checkbox"][class*=differerVideo]').prop("checked", true);
				$(container).find(".videoDiffererDropdown").dropdown('set value',action.param.typeVideo);
			}
			break;
		case 'video':
			idRadio = '.checkbox_video';
			$(container).find("input[type=text][class*=fileVideo]").val(action.param.filename);
			
			if(action.param.type =="perso"){
				$(container).find('[value="perso"]').prop("checked", true);
				$(container).find(".video_ecr_x").val(action.param.x);
				$(container).find(".video_ecr_x").val(action.param.y);
				$(container).find(".video_ecr_w").val(action.param.largeur);
				$(container).find(".video_ecr_h").val(action.param.hauteur);
			}else{
				$(container).find('[value="fullscreen"]').prop("checked", true);	
			}
			
			if(action.param.hasOwnProperty("filigrane")){
				$(container).find('input[class="video_ecr_fili"]').prop("checked", true);
				filigrane = $(container).find(".video_ecr_opacity").val(action.param.filigrane);				
			}
			break;
		case 'image':
			idRadio = '.checkbox_image';
			$(container).find("input[type=text][class*=fileImage]").val(action.param.filename);
			
			if(action.param.type =="perso"){
				$(container).find('[value="perso"]').prop("checked", true);
				$(container).find(".image_ecr_x").val(action.param.x);
				$(container).find(".image_ecr_x").val(action.param.y);
				$(container).find(".image_ecr_w").val(action.param.largeur);
				$(container).find(".image_ecr_h").val(action.param.hauteur);
			}else{
				$(container).find('[value="fullscreen"]').prop("checked", true);	
			}
			
			if(action.param.hasOwnProperty("filigrane")){
				$(container).find('input[class="image_ecr_fili"]').prop("checked", true);
				filigrane = $(container).find(".image_ecr_opacity").val(action.param.filigrane);				
			}
			break;
		case 'sequence':
			idRadio = '.checkbox_replay';
			$(container).find(".sequence_dropdown").dropdown('set value',action.param.sequence_id);
			$(container).find(".ecr_flux_dropdown").dropdown('set value',action.param.sequence_flux);
			break;
		case 'audio':
			idRadio = '.checkbox_audio';
			$(container).find("input[type=text][class*=fileAudio]").val(action.param.filename);
			break;
	}
    $(container).find(idRadio).prop("checked", true).trigger('change');
}

function validerScenario(){
	//On recupere le nom du scenario
	updateSequence();
	var scenario = {}
	scenario['nom'] = $('#nomScenario').val();
	scenario['sequences'] = arraySequence;
	saveScenario(scenario,scenario['nom']);
}

function setScenarioInfos(scenarioName){
	$('#nomScenario').val(scenarioName);
}

function disableScenarioParam(){
	$('#divNomScenario').addClass('disabled');
}


/* Permet de retourner une sequence a partir des champs dans le formulaire */
function parseSequence(){
	//On recupere le nom de la sequence
	var nomSequence = $('#nomSequence').val();
	var minutesSequence = $('#minute_sequence').val();
	var secondesSequence = $('#seconde_sequence').val();
	
	var nomAction1 = $('#tab_ecr1').find('[type="radio"]:checked').val();
	var nomAction2 = $('#tab_ecr2').find('[type="radio"]:checked').val();
	
	var a1 = parseAction(1,nomAction1);
	var a2 = parseAction(2,nomAction2);
	
	var sequence = {
		id : currentSequence,
		nom : nomSequence,
		minute : minutesSequence,
		seconde : secondesSequence,
		action1 : a1,
		action2 : a2
	}
	
	return sequence;
}

/* Creer les params d'une sequence en fonction des actions */
function parseAction(ecran,type){
	var action = {};
	var param = {};
	var nomAction = type;
	var container = "";
	
	switch(ecran){
		case 1:
			container = "#param_ecr1";
			break;
		case 2:
			container = "#param_ecr2";
			break;
	}

	switch(type){
		case 'live':
			//On fait rien
			break;
		case 'differer':
			//On veut le decalage
			var checked = $(container).find('input[type=checkbox][class*=differerAudio]:checked');
			if(checked.length != 0){
				var audio = $(container).find("input[type=text][class*=differerAudio]").val();
				var typeAudio = $(container).find(".audioDiffererDropdown").dropdown('get value');
				param['audio']= audio;
				param['typeAudio'] = typeAudio;
			}
			var checked = $(container).find('input[type=checkbox][class*=differerVideo]:checked');
			if(checked.length != 0){
				var video =  $(container).find("input[type=text][class*=differerVideo]").val();
				var typeVideo = $(container).find(".videoDiffererDropdown").dropdown('get value');
				param['video']= video;
				param['typeVideo'] = typeVideo;
			}
			break;
		case 'video':
			var filename = $(container).find("input[type=text][class*=fileVideo]").val();
			param['filename'] = filename;
			
			var typeVideo = $(container).find('[type=radio][class*="radioTypeVideo"]:checked').val();
			param['type'] = typeVideo;
			
			if(typeVideo==='perso'){
				var x = $(container).find(".video_ecr_x").val();
				var y = $(container).find(".video_ecr_x").val();
				var largeur = $(container).find(".video_ecr_w").val();
				var hauteur = $(container).find(".video_ecr_h").val();
				param['x'] = x;
				param['y'] = y;
				param['largeur'] = largeur;
				param['hauteur'] = hauteur;
			}
			
			var filigrane =  $(container).find('input[class="video_ecr_fili"]:checked');
			if(!filigrane.length==0){
				var filigrane = $(container).find(".video_ecr_opacity").val();
				param['filigrane'] = filigrane;
			}
			break;
		case 'image':
			var filename = $(container).find("input[type=text][class*=fileImage]").val();
			param['filename'] = filename;
			
			var typeImage = $(container).find('[type=radio][class*="radioTypeImage"]:checked').val();
			param['type'] = typeImage;
			
			if(typeImage==='perso'){
				var x = $(container).find(".image_ecr_x").val();
				var y = $(container).find(".image_ecr_x").val();
				var largeur = $(container).find(".image_ecr_w").val();
				var hauteur = $(container).find(".image_ecr_h").val();
				param['x'] = x;
				param['y'] = y;
				param['largeur'] = largeur;
				param['hauteur'] = hauteur;
			}
			var filigrane =  $(container).find('input[class="image_ecr_fili"]:checked');
			if(!filigrane.length==0){
				var filigrane = $(container).find(".image_ecr_opacity").val();
				param['filigrane'] = filigrane;
			}
			break;
		case 'sequence':
			var sequence_id = $(container).find(".sequence_dropdown").dropdown('get value');
			var sequence_flux = $(container).find(".ecr_flux_dropdown").dropdown('get value');
			param['sequence_id'] = sequence_id;
			param['sequence_flux'] = sequence_flux;
			break;
		case 'audio':
			var filename = $(container).find("input[type=text][class*=fileAudio]").val();
			param['filename'] = filename;
			break;
	}
	action['nom'] = nomAction;
	action['param'] = param;
	return action;
}

function suppSequence(){
 	if(currentSequence!=0){
		var $sequencebutton = $('#buttonSequence'+currentSequence).find('.button').remove();
		
		var i = 0;
		arraySequence.forEach(function(sequence){
			if(sequence.id == currentSequence){
				arraySequence.splice(i,1);
			}
			i++;
		});
		currentSequence = 0;
	} 
}


function saveScenario(scenario,file){
	$.ajax
    ({
        type: "GET",
        dataType : 'json',
        async: false,
        url: 'http://localhost/projet_double_video/php/scenario_saver.php',
        data: { 
			data: JSON.stringify(scenario),
			filename: file
		},
        success: function () {alert("Scenario save success"); },
        failure: function() {alert("Erreur lors de l'enregistrement du scenario");},
		contentType: 'application/json; charset=utf-8'
    });
}