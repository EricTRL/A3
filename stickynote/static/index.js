//AUTHOR: 1004076
//NOTE: This could probably be done way more efficient, but at least it works
/*Browser Compatibility:
Versions lower than the ones specified here are probabably NOT compatible/do NOT work.
Versions of incompatible browsers released after 6-12-2017 may become compatible in the future once CSS Grid properties are implemented in those browsers
Desktop Browsers:
	Works on: 								Chrome (v57+), iOS Safari (v10.3+), Steam Web Browser (v017), Edge (v16+), Firefox (v52+),
	Doesn't work on: 						IE, Opera Mini
	Presumably works on (but not tested): 	Opera (v47+),
Mobile Browsers:
	Works on: 								Android webview (v62+), Chrome for Android (v62+), Samsung Internet (v62+), Firefox for Android (v57+)
	Doesn't work on:						IE Mobile, Opera Mobile, Blackberry Browser
	Presumably works on (but not tested):	-
*/

$(document).ready(function() {
	//What happens when "Login" (topright corner) is clicked
	$('#id_login_button').on('click', function(e) {
		e.preventDefault();
		//you can't login twice!
		if (!bIsLoggedIn) {
			$('#id_dropdown_login').stop().slideToggle();
		}else{
			$('#id_dropdown_logout').stop().slideToggle();
		}
	});

	//what happens when you submit the login-form
	$('#id_login_form').submit(function(e) {
		e.preventDefault();
		console.log('Login Form Submitted');
		const sUsername = $("#id_login_form input[name=username]").val();
		const sPassword = $("#id_login_form input[name=password]").val();

		//clear the fields
		$("#id_login_form input[name=username]").val("");
		$("#id_login_form input[name=password]").val("");

		//set a valid CSRF token
		setupSafeAjax();

		//actually perform the request
		$.ajax({
					type:"POST",
					url:"ajax/user_login/",
					data: {
					      'username': sUsername,
								'password': sPassword,
					      },
					success: function(){
							console.log('SUCCESSFUL LOGIN');
							onLogin();
							$('#error_invalid_username_or_password').hide();
					},
					error: function(jqXHR, status, errorThrown) {
							console.log('FAILED LOGIN');
							$('#error_invalid_username_or_password').show();
					  	//console.log(jqXHR);
					},
	      });
	});

	//what happens when you submit the logout-form
	$('#id_logout_form').submit(function(e) {
	  e.preventDefault();
	  console.log('Logout Form Submitted');

		//set a valid CSRF token
		setupSafeAjax();

		//actually perform the request
		$.ajax({
					type:"POST",
					url:"ajax/user_logout/",
					data: {},
					success: function(){
							console.log('SUCCESSFUL LOGOUT');
							onLogout();
					},
					error: function(jqXHR, status, errorThrown) {
							console.log('FAILED LOGOUT');
					  	//console.log(jqXHR);
					},
	      });
	});


	//What happens wehn the 'New Sticky' button is pressed
	$('#id_add_sticky_button').on('click', function(e) {
		console.log("Add Sticky button clicked");
		createStickynote(true, chooseRandomStickyColour()); //!!!
	});

	//update the grid each time the user zooms in or out
	$(window).resize(function() {
	  //console.log("Screen size changed!");
	   calculateGridSize();
	});

	//what happens when the edit/create sticky popup is saved/cancelled:
	//(https://stackoverflow.com/questions/5721724/jquery-how-to-get-which-button-was-clicked-upon-form-submission)
	$(".sticky_edit").submit(function(e) {
		e.preventDefault();
		if (bAddStickyPopupIsActive) {
			const val = $("input[type=submit][clicked=true]").val();
			if (val=="Save"){
				saveStickynote(iNewStickyColour,$("#id_sticky_form input[name=title]").val(), JSON.stringify(quill.getContents()));
			}else{
				cancelStickynote();
			}
			bAddStickyPopupIsActive = false;
			$('#id_popup_add_sticky').stop().fadeOut();
		}
	});
	$(".sticky_edit input[type=submit]").click(function() {
		$("input[type=submit]", $(this).parents(".sticky_edit")).removeAttr("clicked");
		$(this).attr("clicked", "true");
	});

	//What happens when the 'Delete Sticky' option is clicked
	$('#id_sticky_options_delete_sticky').on('click', function(e) {
		console.log("Deleting sticky " + iSelectedSticky);
		deleteStickynote(iSelectedSticky-1, true);
		bAddStickyPopupIsActive = false;
		$('#id_popup_add_sticky').stop().fadeOut();
	});

	//animation when hovering over the 'delete sticky' button
	$('#id_sticky_options_delete_sticky').on('mouseenter', function(e) {
		$('#id_trashcan_icon').attr("src", "static/Images/trashcan_white_open.png");
	}).on('mouseleave', function(e) {
		$('#id_trashcan_icon').attr("src", "static/Images/trashcan_white_closed.png");
	});

	//update the grid upon load
	calculateGridSize();
	//retrieve the editor's colours upon load
	retrieveStickyColoursAJAX(initColourList);
	//display the correct login stuff upon load
	checkLoginPageLoadAJAX();
});

let bIsLoggedIn = false; //whether the user is logged in
let iNumMaxColStickies = 1; //updated in calculateGridSize();
let iPrevNavWidth = -1; //The scrollbarlistener fires the resize event twice, so this prevents unnecessary calculations

let tStickies = []; //array that will contain instances of the stickynote class
let iNewStickyColour; //set by the add-sticky button to keep track of a new sticky's colour
let bAddStickyPopupIsActive = false; //true when the add/edit-sticky popup is opened up
let iSelectedSticky = -1; //set by the onclicklisteners to retrieve the correct data

let iCurrentUser = -1; //the currently logged in user

function calculateGridSize() {

	//get screen size, etc. to adjust grid-template-columns dynamically. (Usually returned in pixels)
	//Nothing to change here, as bootstrap now correctly shrinks down the navbar
	const iWidth = $('#id_navbar').width(); //NOT returned in pixels!

	//only update if there's a need to update.
	//(The scrollbar listener causes the event to fire twice if a scrollbar is active)
	if (iWidth != iPrevNavWidth){
		iPrevNavWidth = iWidth;
		let sColSize = $(".stickyNotesGrid").css("grid-template-columns");

		sColSize = sColSize.slice(0,sColSize.search("px"));
		const iColSize = parseInt(sColSize);
		console.log("Width: " + iWidth + " | colSize: " + iColSize);

		//set the number of columns dynamically based on screen size:
		const iNumColumns = Math.floor(iWidth/iColSize);
		//const iNumColumns = Math.floor((iWidth - parseInt(sGridGap))/(parseInt(sColSize) + parseInt(sGridGap)));

		//calculate and set the grid_row_gap, grid_column_gap, and padding of the grid
		const iGapSize = (iWidth - iNumColumns*iColSize)/(iNumColumns + 1);
		$('.stickyNotesGrid').css("grid-column-gap",iGapSize + "px");
		$('.stickyNotesGrid').css("grid-row-gap",iGapSize + "px");
		$('.stickyNotesGrid').css("padding","0px " + iGapSize + "px");

		//console.log($('.stickyNotesGrid').css("grid-column-gap"));
		//console.log("ColGap: " + iGapSize + " | RowGap: " + iGapSize + " | Padding: " + iGapSize);

		//console.log("New Number of Columns (min 1): "+iNumColumns);
		$('.stickyNotesGrid').css("grid-template-columns","repeat( " + (iNumColumns > 0 ? iNumColumns : 1) + ","+ sColSize +"px)");
		iNumMaxColStickies = iNumColumns;
		console.log("Screen size updated");
	}

}

//stickynote class:
class Stickynote {
	constructor(iColour, sTitle, sContents, iID) {
		this._id = iID;
		this._colour = iColour;
		this._title = sTitle;
		this._contents = sContents;
	}
	get colour() {return this._colour;}
	get title() {return this._title;}
	get contents() {return this._contents;}
	get id() {return this._id;}

	set colour(iColour) {
		this._colour = iColour;
	};
	set title(sTitle) {
		//no checking needed as of now
		this._title = sTitle;
	}
	set contents(sContents) {
		//no checkign needed as of now
		this._contents = sContents;
	}
	set id(iID){
		//this is actually never called!
		this._id = iID;
	}
}

//available stickynote colours: All in the DB now
//const tStickyColours = ['blue','brown','green','grey','orange','purple','red','turquoise','yellow'];
//file paths of these colours follow this format: static/Images/stickynote_COLOUR.png

/*
//No longer needed. It's all in the DB now
const tStickyColoursRGBs = {
	//Colour		R			G			B			A
	blue: 			[109,	144,	206,	255	],
	brown:			[133,	81,		46,		255	],
	green:			[109,	206,	128,	255	],
	grey:				[176,	176,	176,	255	],
	orange:			[234,	142,	81,		255	],
	purple:			[220,	136,	221,	255	],
	red:				[206,	109,	109,	255	],
	turquoise:	[109,	206,	206,	255	],
	yellow:			[219,	220,	95,		255	],
};
*/

/////////////////////////////////////////////////////////////////////////
//AJAX GETs and POSTs

let tStickyColours = {};
let bRandomAddStickyColourChosen = false;

//Event Listener. Functions can be 'hooked' into it here:
//Fires whenever stickynote colours have been successfully retrieved from the DB
$(window).on('StickyColoursRetrieved', function (e) {
		//e.state contains a list of colours. Each index has the following format: [id,name,r,g,b,a]

		//cache the data so that it can be used later
		tStickyColours = [];
		//console.log(e.state)
		for (index in e.state) {
			//console.log(sColour)
			tStickyColours[e.state[index][0]] = [e.state[index][1], e.state[index][2], e.state[index][3], e.state[index][4]]
		}
		console.log(tStickyColours);

		if (!bRandomAddStickyColourChosen){
			//randomizes the colour of the 'Add sticky'-sticky (only do this once upon page load)
			bRandomAddStickyColourChosen = true;
			$(".sticky_img").attr("src","static/Images/stickynote_" + tStickyColours[chooseRandomStickyColour()][0] + ".png");
		}
		//new stickycolour-table == e.state
});

function setupSafeAjax(){
	//set a valid CSRF token
	$.ajaxSetup({
			headers: { "X-CSRFToken": getCookie("csrftoken") }
	});
}

//https://stackoverflow.com/questions/6506897/csrf-token-missing-or-incorrect-while-post-parameter-via-ajax-in-django
//gets a cookie which is used for CSRF tokens/security of the Django POST requests
function getCookie(c_name)
{
		if (document.cookie.length > 0)
		{
				c_start = document.cookie.indexOf(c_name + "=");
				if (c_start != -1)
				{
						c_start = c_start + c_name.length + 1;
						c_end = document.cookie.indexOf(";", c_start);
						if (c_end == -1) c_end = document.cookie.length;
						return unescape(document.cookie.substring(c_start,c_end));
				}
		}
		return "";
 }

//Gets all colours in the DB
function retrieveStickyColoursAJAX(func) {
	$.ajax({
	    url: '/ajax/retrieve_sticky_colours/',
	    data: {},
			type: 'GET',
	    dataType: 'json',
	    success: function (data) {
					//fire the respective event:
					evt = $.Event('StickyColoursRetrieved');
					evt.state = data.colourlist;
					$(window).trigger(evt);

					//fire the (render ONLY!)-function. I.e. it cannot return variables
					func(data);
	    }
	});
}
//retrieveStickyColoursAJAX(function(data){console.log(data)});

function saveStickynoteAJAX(table, onSuccess) {
	//set a valid CSRF token
	setupSafeAjax();

	//actually uplaod the stickies
	$.ajax({
				type:"POST",
				url:"ajax/create_stickies/",
				data: {
							'stickydata[]': table,
							},
				success: function(){
						console.log('SUCCESSFUL UPLOAD');
						onSuccess();
				},
				error: function(jqXHR, status, errorThrown) {
						console.log('FAILED UPLOAD');
						//console.log(jqXHR);
				},
			});
}

/*
//gets the RGB value of a given colour in the DB (returns {name: a, r: 0, g: 0, b: 0})
function retrieveColourRGBAJAX(sColour,func) {
	$.ajax({
	    url: '/ajax/get_colour_rgb/',
	    data: {'colour': sColour},
			type: 'GET',
	    dataType: 'json',
	    success: function (data) {
					//console.log(data)
					func(sColour,data.r,data.g,data.b);
	    }
	});
}
//retrieveColourRGBAJAX('blue',function(data){console.log(data.b)})
*/

/*
//Gets a random colour from the DB (name AND its rgb values)
function retrieveRandomColourAJAX(func) {
	$.ajax({
	    url: '/ajax/get_random_colour/',
			data: {},
			type: 'GET',
	    dataType: 'json',
	    success: function (data) {
					console.log(data)
					func(data.colour,data.r,data.g,data.b);
	    }
	});
}
//retrieveRandomColourAJAX(function(data){console.log(data.colour)})
*/



////////////////////////////////////////////////////////////////////////
//Everything related to the creation, deletion, styling, etc. of Sticky Notes

function chooseRandomStickyColour(){
	//extra logic as there may be holes in the table (E.g. no colour with id=4)
	table = [];
	tStickyColours.forEach(function(_,id){
		table.push(id);
	});
	return table[Math.floor(Math.random()*table.length)];
}

//Creates a temporary stickynote on the screen
function createStickynote(bOpensEditor, iColour){
	iNewStickyColour = iColour;
	sColour = tStickyColours[iColour][0];
	const stickyFormat = 	'<div class="sticky_data sticky_div new_sticky"><div class="stickynote clickable">' +
									'<img class="sticky_img sticky_elem" src="static/Images/stickynote_' + sColour + '.png/">' +
									'<p class="add_sticky_text sticky_elem">NEW STICKY</p>' +
								'</div></div>';
	let sticky = $(stickyFormat);   // Create with jQuery
	$(".stickyNotesGrid").append(sticky);      // Append the new element

	if (bOpensEditor) {
		iSelectedSticky = 0;
		openStickyEditor();
	}
}

//Creates (and saves) the actual stickynote
function saveStickynote(iRandomStickyColour, sTitle, sContents) {
	//do some extra stuff if a new sticky was created
	if (iSelectedSticky == 0){
		console.log("Sticky Added")
		iRandomStickyColour = iNewStickyColour;
		//create a sticky obj
		let pSticky = new Stickynote(iRandomStickyColour, sTitle, sContents, -1);
		tStickies.push(pSticky);

		//remove the 'new_sticky' class from the newly rendered sticky;
		$( ".sticky_div:eq(-1)" ).removeClass("new_sticky");

		//Add an onclick-listener
		const temp = tStickies.length; //tStickies is a global variable, but we want the listener to always return the value this global had upon DECLARATION of the listener!
		$('.sticky_div:eq(-1)').on('click', function(e) {
			console.log('Existing Sticky Clicked: ' + temp);
			iSelectedSticky = temp;
			openStickyEditor();
		});

		iSelectedSticky = tStickies.length;

		//debug in the console:
		console.log("New sticky added: ");
	}else{
		console.log("Updating sticky " + iSelectedSticky);
	}

	//update the object
	tStickies[iSelectedSticky-1].colour = iRandomStickyColour;
	tStickies[iSelectedSticky-1].title = sTitle;
	tStickies[iSelectedSticky-1].contents = sContents;


	//if the user is logged in, also store the sticky in the DB (or update it if it's already there)
	if (bIsLoggedIn){
			let func = function() {};
			if (tStickies[iSelectedSticky-1].id < 0){
				func = function() {
					clearStickies(); //clear the stickies from the screen
					retrieveCurrentUserStickies(); //re-add them (we need the newly assigned ID of the newly stored sticky!)
				}
			}

			saveStickynoteAJAX(
				[JSON.stringify({
					'id': tStickies[iSelectedSticky-1].id,
					'colour': tStickies[iSelectedSticky-1].colour,
					'title': tStickies[iSelectedSticky-1].title,
					'contents': tStickies[iSelectedSticky-1].contents,
				})]
				, func)
	}

	//Sort the stickies and update the screen (and log the result)
	sortStickies();
}

//what happens when the 'cancel' button is pressed in the sticky note editor
function cancelStickynote(){
	console.log("Changes discarded");
	$('.stickyNotesGrid div').remove('.new_sticky'); //remove newly created stickies (or save no data if a sticky was edited)
	//no need to update or sort here
}

//updates the display of stickynote at index i (based upon its data in the array)
//call this after updating the data of a sticky in the array
function updateStickynote(i){
	//update the title
	$( ".sticky_div p:eq(" + (i+1) + ")" ).text(tStickies[i].title);
	//update the colour
	$(".sticky_div .sticky_img:eq(" + (i+1) + ")").attr("src","static/Images/stickynote_"+ tStickyColours[tStickies[i].colour][0] + ".png");
	//DO NOT CALL sortStickies() IN HERE AS sortStickies() CALLS THIS FUNCTION!
}

//deletes the stickynote at index i;
function deleteStickynote(i, bFromDB){
	console.log("Sticky " + tStickies[i].title + "(" + i + ") has been deleted...")
	const id = tStickies[i].id;
	tStickies[i] = tStickies[tStickies.length-1]; //put the last element in its place (so we don't fck up the onclicklisteners)
	tStickies.pop(); //delete the data from the array
	$('.stickyNotesGrid div').remove(".sticky_div:eq(-1)") //delete the sticky from the screen

	if (bFromDB && bIsLoggedIn){
		console.log('attempting to delete sticky from DB')

		//set a valid CSRF token
		setupSafeAjax();

		//actually uplaod the stickies
		$.ajax({
					type:"POST",
					url:"ajax/delete_sticky_by_id/",
					data: {	'id': id} ,
					success: function(){
							console.log('SUCCESSFUL DELETE');
					},
					error: function(jqXHR, status, errorThrown) {
							console.log('FAILED DELETE');
							//console.log(jqXHR);
					},
				});
	}
	//sort and update the stickies (and log the result)
	sortStickies();
}

//gets rid of all stickies on the screen. I.e. it deletes them from the tables
//it does NOT delete them from the DB
function clearStickies(){
	//delete backwards
	for (i=tStickies.length-1; i>=0; i--){
		deleteStickynote(i,false);
	}
}

//call this when the stickies need to be sorted
//this function doesn't actually re-arrange the divs on the screen, it simply changes all the data within them (to prevent the onclick-listeners from messing up)
function sortStickies() {
	tStickies.sort(sortStickyByTitle); //sort the array

	for (i = 0; i<tStickies.length; i++) {
		updateStickynote(i);
	}
	console.log("SORTED: ");
	console.log(JSON.parse(JSON.stringify(tStickies)));
}

//sort function for sorting the sticky array
function sortStickyByTitle(a, b) {
  if (a.title.toUpperCase() < b.title.toUpperCase()) {
    return -1;
  }
  if (a.title.toUpperCase() > b.title.toUpperCase()) {
    return 1;
  }
  //leave the order as is if two stickies have the same title.
  return 0;
}

//returns true if a given sticky is already being displyaed on teh screen. returns false otherwise (based on IDs)
function isAlreadyDisplayed(iID){
	for (j=0; j<tStickies.length; j++){
		if (tStickies[j].id == iID && iID>0) {
			return true;
		}
	}
	return false;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////
//stickynote editor:

function openStickyEditor(){
	console.log('STICKY EDITOR OPENED UP... (' + iSelectedSticky + ')');
	if (iSelectedSticky == 0){
		//Newly created sticky (I.e. No data yet, so empty all the fields)
		$("#id_popup_add_sticky input[name=title]").val("");
		quill.setContents("");
		$(".popup_title").text("Create Sticky");
	}else{
		//existing sticky that the user wants to edit, so retrieve all the fields
		console.log(tStickies[iSelectedSticky-1]);
		let pSelectedSticky = tStickies[iSelectedSticky-1];
		$("#id_popup_add_sticky input[name=title]").val(pSelectedSticky.title);
		quill.setContents(JSON.parse(pSelectedSticky.contents));
		$(".popup_title").text("Edit Sticky");
		iNewStickyColour = pSelectedSticky.colour;
	}
	retrieveStickyColoursAJAX(initColourList);
	updateEditorOptions();
	//Set the editor's colour to the sticky's colour
	updateEditorColours(iNewStickyColour);

	bAddStickyPopupIsActive = true;
	$('#id_popup_add_sticky').stop().fadeIn();
}

//Editor color defintions. Several pieces get a darker or lighter shade based upon the Sticky Colour. Several variables for possible finetuning
const iHeaderColourModifier = 0.75; //the Sticky's Header receives a darker shade of said colour
const iButtonColourModifier = 0.75; //the save/cancel buttons receive a darker shade of said colour
const iEditorColourModifier = 0.75; //the Quill editor receives a lighter shade of said colour
const iOptionElementColourModifier = 0.75; //the background-colour for the options is a bit lighter
const iOptionElementBorderColourModifier = 0.75; //the border-colour for the options is a bit darker
const iOptionElementTextColourModifier = 0.75; //the text-colour gets the dark variant;

//Updates the Editor's Colours:
function updateEditorColours(iColour){
	sColour = tStickyColours[iColour][0]
	console.log("Updating editor colours: " + sColour /*+ "(" + r + "," + g + "," + b + ")"*/);

	//set the correct checkbox:
	//MOVED TO initColourList!

	if (iSelectedSticky == 0) {
		//update the NEW STICKY as well
		$( ".new_sticky:eq(-1) .sticky_img" ).attr("src","static/Images/stickynote_" + sColour + ".png");
	}
	const iR = tStickyColours[iColour][1];
	const iG = tStickyColours[iColour][2];
	const iB = tStickyColours[iColour][3];

	//actually update the colours
	$('.popup .sticky_edit .header').css("background-color","rgb(" + Math.round(iR*iHeaderColourModifier) + ", " + Math.round(iG*iHeaderColourModifier) + ", " + Math.round(iB*iHeaderColourModifier) + ")");
	$('.popup .sticky_edit .body').css("background-color","rgb(" + iR + ", " + iG + ", " + iB + ")");
	$('.popup .sticky_edit .body .buttons input').css("background-color","rgb(" + Math.round(iR*iButtonColourModifier) + ", " + Math.round(iG*iButtonColourModifier) + ", " + Math.round(iB*iButtonColourModifier) + ")");
	$('.popup .sticky_edit .body form .editor_input').css("background-color","rgb(" + Math.round(iR + (255-iR)*iEditorColourModifier) + ", " + Math.round(iG + (255-iG)*iEditorColourModifier) + ", " + Math.round(iB + (255-iB)*iEditorColourModifier) + ")");
	$('.popup .sticky_edit .body #id_sticky_options .sticky_option_element').css("background-color","rgb(" + Math.round(iR + (255-iR)*iOptionElementColourModifier) + ", " + Math.round(iG + (255-iG)*iOptionElementColourModifier) + ", " + Math.round(iB + (255-iB)*iOptionElementColourModifier) + ")");
	$('.popup .sticky_edit .body #id_sticky_options .sticky_option_element').css("border-color","rgb(" + Math.round(iR*iOptionElementBorderColourModifier) + ", " + Math.round(iG*iOptionElementBorderColourModifier) + ", " + Math.round(iB*iOptionElementBorderColourModifier) + ")");
	$('.popup .sticky_edit .body #id_sticky_options h3').css("color","rgb(" + Math.round(iR*iOptionElementTextColourModifier) + ", " + Math.round(iG*iOptionElementTextColourModifier) + ", " + Math.round(iB*iOptionElementTextColourModifier) + ")");
	//$('.popup .sticky_edit .body #id_sticky_options label').css("color","rgb(" + Math.round(iR*iOptionElementTextColourModifier) + ", " + Math.round(iG*iOptionElementTextColourModifier) + ", " + Math.round(iB*iOptionElementTextColourModifier) + ")");

}

//Reads all available colours from the DB and appends them to the option in the menu
//data is an object containing all colours
function initColourList(data){
	const colourlist = data.colourlist;
	//remove all previously added things first:
	$('#id_sticky_options_form_colour div').remove('.colour_option');

	for (i=0; i<colourlist.length; i++){
		const optionFormat = 	'<div class="colour_option"><label class="clickable"><input type="radio" name="colour" value="' + colourlist[i][0] + '"/><strong>' + colourlist[i][1].toUpperCase() + '</strong></label></div>';
		$("#id_sticky_options_form_colour").append($(optionFormat)); // Create & Append the new element

		//set the text-colour to its respective stickynote colour
		const iR = colourlist[i][2]
		const iG = colourlist[i][3]
		const iB = colourlist[i][4]
		$("#id_sticky_options_form_colour label:eq(" + i + ")").css("color","rgb(" + iR + ", " + iG + ", " + iB + ")");

		const temp = colourlist[i][0];
		$("#id_sticky_options_form_colour label:eq(" + i + ")").on('click', function(e) {
			console.log('Sticky Colour Changed: ' + temp);
			iNewStickyColour = temp;
			updateEditorColours(temp);
		});
	};

	//set the checkbox of the current colour
	$('#id_sticky_options_form_colour input[name=colour][value=' + iNewStickyColour + ']').prop('checked', true);
}

function updateEditorOptions(){
	if (iSelectedSticky == 0){
		$('.edit_only').hide();
	}else{
		$('.edit_only').show();
	}
}

/////////////////////////////////////////////////////////////////////////////////////
//Everything related to user handling

//when logging in, save all stickies currently on the screen to the DB
function onLogin(){
	$('#id_dropdown_login').stop().slideUp();
	bIsLoggedIn = true;

	//Upload all stickies to the DB that were not already in there
	let table = [];
	for (i=0; i<tStickies.length; i++){
		if (tStickies[i].id<=0) {
			table.push(
				JSON.stringify({
					'id': 			tStickies[i].id,
					'colour': 	tStickies[i].colour,
					'title': 		tStickies[i].title,
					'contents':	tStickies[i].contents,
				})
			);
		}
	}

	//only upload stuff to the DB if there is stuff to upload
	if (table.length > 0) {
		saveStickynoteAJAX(table, function() {
				//success function:
				clearStickies(); //clear the stickies from the screen (we'll be readding them shortly)
				retrieveCurrentUserStickies();
		});
	}else{
		//otherwise only retrieve stuff
		retrieveCurrentUserStickies();
	}
}

//what happens when the user logs out
function onLogout(){
	$('#id_dropdown_logout').stop().slideUp();
	bIsLoggedIn = false;
	$('#id_login_button').text('LOGIN');
	clearStickies();
}

//Retrieve all of the user's stickies from the DB (id, colour, title, etc.)
function retrieveCurrentUserStickies(){
	$.ajax({
	    url: '/ajax/retrieve_current_user_data/',
	    data: {},
			type: 'GET',
	    dataType: 'json',
	    success: function (data) {
					//fire the respective event:
					evt = $.Event('UserDataRetrieved');
					evt.state = data;
					$(window).trigger(evt);

					//Update the text to state 'Logged in'
					$('#id_login_button').text('LOGGED IN (' + data.name + ')');

					//Greeting to the user
					$('#id_greeting_user').text('Hi ' + data.name + '!');

					//Update the sticky table (with the stickies retrieved from the DB)
					for (i=0; i<data.stickies.length; i++) {
						if (!isAlreadyDisplayed(data.stickies[i].id)){
							//create an instance
							let pSticky = new Stickynote(data.stickies[i].colour, data.stickies[i].title, data.stickies[i].contents, data.stickies[i].id);
							//add it to the table
							tStickies.push(pSticky);
							//add it to the screen
							createStickynote(false, pSticky.colour);
							//remove the 'new_sticky' class from the newly rendered sticky;
							$( ".sticky_div:eq(-1)" ).removeClass("new_sticky");

							//Add an onclick-listener
							const temp = tStickies.length; //tStickies is a global variable, but we want the listener to always return the value this global had upon DECLARATION of the listener!
							$('.sticky_div:eq(-1)').on('click', function(e) {
								console.log('Existing Sticky Clicked: ' + temp);
								iSelectedSticky = temp;
								openStickyEditor();
							});

							iSelectedSticky = tStickies.length;
						}
					}
					//Sort the stickies and update the screen (and log the result)
					sortStickies();
	    }
	});
}

//sets the logged in boolean on page load. (I.e. extra handling in case the user is already logged in from a previous session)
function checkLoginPageLoadAJAX(){
	$.ajax({
	    url: '/ajax/user_is_authenticated/',
	    data: {},
			type: 'GET',
	    dataType: 'json',
	    success: function (data) {
					bIsLoggedIn = data.authenticated;
					if (bIsLoggedIn) {
						console.log('USER WAS ALREADY LOGGED IN FROM A PREVIOUS SESSION!');
						onLogin();
					}
	    }
	});
}

////////////////////////////////////////////////////////////////////////////////////
//Initialize Quill editor (used in the sticky editor)
var quill = new Quill('.quill_editor', {
	modules: {
		history: {
			delay: 2000,
			maxStack: 500,
			userOnly: true
		},
	},
	bounds: '#scrolling-container',
	scrollingContainer: '#scrolling-container',
	placeholder: "Insert Contents Here...",
	theme: 'snow',
});
