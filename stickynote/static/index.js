//AUTHOR: 1004076
/*Browser Compatibility:
TODO
*/

$(document).ready(function() {
	//////////////////////////////////////////////////////////////////////////////
	//Login/Logout forms

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

	//When opening/closing the menu in mobile browsers (or other small screens), hide the login form initially
	$('.navbar-toggle').on('click', function(e) {
		e.preventDefault();
		if (!bIsLoggedIn) {
			$('#id_dropdown_login').stop().slideUp();
		}else{
			$('#id_dropdown_logout').stop().slideUp();
		}
	});
	//////////////////////////////////////////////////////////////////////////////
	//Logging in/out stuff (communicate with the DB):

	//what happens when you submit the login-form
	$('#id_login_form').submit(function(e) {
		e.preventDefault();
		print('Login Form Submitted');
		//get what was entered in the fields
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
							print('SUCCESSFUL LOGIN');
							location.reload(); //reload the page on success
					},
					error: function(jqXHR, status, errorThrown) {
							print('FAILED LOGIN');
							$('#error_invalid_username_or_password').show(); //show an error msg on fail
					  	//print(jqXHR);
					},
	      });
	});

	//what happens when you submit the logout-form
	$('#id_logout_form').submit(function(e) {
	  e.preventDefault();
	  print('Logout Form Submitted');

		//set a valid CSRF token
		setupSafeAjax();

		//actually perform the request
		$.ajax({
					type:"POST",
					url:"ajax/user_logout/",
					data: {},
					success: function(){
							print('SUCCESSFUL LOGOUT');
							location.reload();
					},
					error: function(jqXHR, status, errorThrown) {
							print('FAILED LOGOUT');
					  	//print(jqXHR);
					},
	      });
	});
	//////////////////////////////////////////////////////////////////////////////
	//Renaming, deleting, sharing, and adding a Group

	//Renaming:
	$('.button_rename_group').on('click',function(e){
			const iGroup = $(this).attr("id").substring("id_rename_group_".length);
			//print($('#group_head_' + iGroup + ' input[name=group-title]').attr('name'))
			$('#group_head_' + iGroup + ' .group-header p').hide();

			$('#group_head_' + iGroup + ' input[name=group-title]').css('width',$('#group_head_' + iGroup + ' .group-header p').css('width'));
			$('#group_head_' + iGroup + ' input[name=group-title]').show();

			$('#id_option_r_d_group_' + iGroup + '').hide();
			$('#id_option_c_c_group_' + iGroup + '').show();
			$('#id_option_c_c_group_' + iGroup + '').css('display','inline-block'); //for whatever reason django likes adding display:block when unhiding the div

			//set the cursor to the textbox
			const input = document.getElementById('id_input_group_' + iGroup);
			setCaretPosition(input, input.value.length);
	});

	//Confirming rename
	$('.button_confirm_rename_group').on('click',function(e){
		const iGroup = $(this).attr("id").substring("id_confirm_rename_group_".length);
		const sTitle = $('#group_head_' + iGroup + ' input[name=group-title]').val().toUpperCase();
		$('#group_head_' + iGroup + ' .group-header p').text(sTitle);
		$('#group_head_' + iGroup + ' .group-header p').show();
		$('#group_head_' + iGroup + ' input[name=group-title]').hide();

		$('#id_option_r_d_group_' + iGroup + '').show();
		$('#id_option_c_c_group_' + iGroup + '').hide();

		set_or_create_group_by_id(iGroup, sTitle, null, null, null);

	});

	//Cancelling rename
	$('.button_cancel_rename_group').on('click',function(e){
		const iGroup = $(this).attr("id").substring("id_cancel_rename_group_".length);
		$('#group_head_' + iGroup + ' input[name=group-title]').val($('#group_head_' + iGroup + ' .group-header p').text());
		$('#group_head_' + iGroup + ' .group-header p').show();
		$('#group_head_' + iGroup + ' input[name=group-title]').hide();

		$('#id_option_r_d_group_' + iGroup + '').show();
		$('#id_option_c_c_group_' + iGroup + '').hide();
	});

	//Deleting a group:
	$('.button_delete_group').on('click',function(e){
			const iGroup = $(this).attr("id").substring("id_rename_group_".length);

			//update the DB
			delete_group_by_id(iGroup,function(){
				location.reload();
			},null);
	});

	//Sharing (or un-sharing) a group
	$('.button_share_group').on('click', function(e){
			const iGroup = $(this).attr("id").substring("id_share_group_".length);
			const bShared =$(this).is(":checked");

			set_or_create_group_by_id(iGroup, null, bShared, null, null);
	});

	//Adding a group:
	$('#id_add_group_button').on('click',function(e){
		const sTitle = $('#id_new_group_title').val();
		const bShared =$('#id_new_group_is_shared').is(":checked")

		set_or_create_group_by_id(-1, sTitle, bShared, function(){
			location.reload();
		}, null);
	});

	//////////////////////////////////////////////////////////////////////////////
	//Creating/Saving a Stickynote

	//What happens when the 'New Sticky' button is pressed
	$('.group').on('click', function(e) {
		//print(e.target.id) //e.target.id returns the id of the element that was clicked, including children
		//print($(this).attr("id")) //this returns the actual id of the item that the event was hooked onto!
		const iGroup = $(this).attr("id").substring("group_".length); //extract the groupID from the html-id (I.e. everything after "group_")

		print("Add Sticky button clicked");
		iLastSelectedSticky = -1;
		openStickyEditor(iGroup,true);
	});

	//What happens when an existing sticky is clicked
	$('.stickynote').on('click', function(e) {
		const iSticky = $(this).attr("id").substring("sticky_".length); //extract the ID from the html-id (I.e. everything after "sticky_")
		//print(iSticky)

		print("Existing Sticky Clicked");
		iLastSelectedSticky = iSticky;
		openStickyEditor(iSticky,false);
	});

	//what happens when the stickynote that's opened up in the editor is saved/cancelled:
	//(https://stackoverflow.com/questions/5721724/jquery-how-to-get-which-button-was-clicked-upon-form-submission)
	$(".sticky_edit").submit(function(e) {
		e.preventDefault();
		if (bAddStickyPopupIsActive) {
			const val = $("input[type=submit][clicked=true]").val();
			if (val=="Save"){

				const iColour = $('#id_sticky_options_form_colour input[name=colour]:checked').val();
				const sTitle = $("#id_sticky_form input[name=title]").val();
				const sContents = JSON.stringify(quill.getContents());
				//TODO
				const iGroup = $("#id_sticky_options_group select").val();
				const bShared = $("#id_sticky_options_shared input[name=shared]").prop('checked');
				//print(iColour)
				set_or_create_sticky_by_id(iLastSelectedSticky, sTitle, sContents, iColour, iGroup, bShared, function(){
					bAddStickyPopupIsActive = false;
					$('#id_popup_add_sticky').stop().fadeOut();
					location.reload();
				}, null)
			}else{
				//Do nothing TODO: remove NEW STICKY
				bAddStickyPopupIsActive = false;
				$('#id_popup_add_sticky').stop().fadeOut();
			}
		}
	});
	$(".sticky_edit input[type=submit]").click(function() {
		$("input[type=submit]", $(this).parents(".sticky_edit")).removeAttr("clicked");
		$(this).attr("clicked", "true");
	});

	//////////////////////////////////////////////////////////////////////////////
	//Stickynote forms on the left of the Editor

	//When Clicking a Colour Radio Button, update the Editor's Colours as well
	$('.colour_option').on('click', function(e) {
		//$("input[name=colour]", this).prop('checked', true);
		const iID = $(this).attr("id").substring("colour_".length)
		print('Sticky Colour Changed: ' + iID);

		get_colour_by_id(iID, function(data){
			//Update the Editor Colours
			UpdateEditorColours(data.r, data.g, data.b, data.a, data.filename);
		});
	});

	//When the dropdown selection is changed, see if the group-sharing also changes
	//Some elements may need to show/hide based on the group-shared value
	$('#id_sticky_options_group select').change(function(e){
		const iGroupID = $(this).val();
		
		get_group_by_id(iGroupID, function(data){
			if (data.shared){
				$('.show_if_group_shared').show();
				$('.hide_if_group_shared').hide();
			}else{
				$('.show_if_group_shared').hide();
				$('.hide_if_group_shared').show();
			}
		});
	});

	//What happens when the 'Delete Sticky' option is clicked
	$('#id_sticky_options_delete_sticky').on('click', function(e) {
		print("Deleting sticky " + iLastSelectedSticky);

		delete_sticky_by_id(iLastSelectedSticky,function(){
			location.reload();
		},null);

		bAddStickyPopupIsActive = false;
		$('#id_popup_add_sticky').stop().fadeOut();
	});

	//animation when hovering over the 'delete sticky' button
	$('#id_sticky_options_delete_sticky').on('mouseenter', function(e) {
		$('#id_trashcan_icon').attr("src", "static/Images/trashcan_white_open.png");
	}).on('mouseleave', function(e) {
		$('#id_trashcan_icon').attr("src", "static/Images/trashcan_white_closed.png");
	});



	//////////////////////////////////////////////////////////////////////////////
	//Miscellaneous:
	let sPath = $('#STATICPATH').text();
	if (sPath !== undefined) {
		sPath = sPath.substring(0, sPath.indexOf("/Images/") + "/Images/".length);
	}
	const STATICPATH = sPath;
	print(STATICPATH)

	//Randomize the Colour of the "Add Sticky" buttons
	/*
	const iNumGroups = $('.sticky_add_img').length
	for (let i=0; i<iNumGroups; i++){
		get_random_colour(function(_,_,_,_,_,_,sFilename){
			$('.sticky_add_img:eq(' + i + ')').attr("src",STATICPATH + '/Images/' + sFilename);
		});
	}
	*/

	//update the grid each time the user zooms in or out
	$(window).resize(function() {
	  //print("Screen size changed!");
	   calculateGridSize();
	});


	//update the grid upon load
	calculateGridSize();

	//retrieve the editor's colours upon load TODO
	//retrieveStickyColoursAJAX(initColourList);

	//display the correct login stuff upon load
	checkLoginPageLoadAJAX();
});
//end of JQuery document.ready stuff
////////////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////////////////////////////////////
//Miscellaneous functions & Defines:

function print(str){
	console.log(str);
}

let bIsLoggedIn = false; 		//whether the user is logged in
let iNumMaxColStickies = 1; //Represents how many stickies can fit in a single column of the grid (updated in calculateGridSize());
let iPrevNavWidth = -1; 		//The scrollbarlistener fires the resize event twice, so this prevents unnecessary calculations
let iLastSelectedSticky = -1; //The ID of the last selected stickynote. -1 if a new sticky was added

//TODO: remove (WARNING)
//let tStickies = []; //array that will contain all stickynotes (no matter the group)

//let iNewStickyColour; //set by the add-sticky button to keep track of a new sticky's colour
let bAddStickyPopupIsActive = false; //true when the add/edit-sticky popup is opened up


//let iSelectedSticky = -1; //set by the onclicklisteners to retrieve the correct data

//Updates the size of the grid based on screen-size.
//E.g. only a single sticky can fit on a mobile screen, but multiple fit on tables
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
		print("Width: " + iWidth + " | colSize: " + iColSize);

		//set the number of columns dynamically based on screen size:
		const iNumColumns = Math.floor(iWidth/iColSize);
		//const iNumColumns = Math.floor((iWidth - parseInt(sGridGap))/(parseInt(sColSize) + parseInt(sGridGap)));

		//calculate and set the grid_row_gap, grid_column_gap, and padding of the grid
		const iGapSize = (iWidth - iNumColumns*iColSize)/(iNumColumns + 1);
		$('.stickyNotesGrid').css("grid-column-gap",iGapSize + "px");
		$('.stickyNotesGrid').css("grid-row-gap",iGapSize + "px");
		$('.stickyNotesGrid').css("padding","0px " + iGapSize + "px");

		//print($('.stickyNotesGrid').css("grid-column-gap"));
		//print("ColGap: " + iGapSize + " | RowGap: " + iGapSize + " | Padding: " + iGapSize);

		//print("New Number of Columns (min 1): "+iNumColumns);
		$('.stickyNotesGrid').css("grid-template-columns","repeat( " + (iNumColumns > 0 ? iNumColumns : 1) + ","+ sColSize +"px)");
		iNumMaxColStickies = iNumColumns;
		print("Screen size updated");
	}
}

//sets cursor position
// Credits: http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/
function setCaretPosition(ctrl, pos) {
  // Modern browsers
  if (ctrl.setSelectionRange) {
    ctrl.focus();
    ctrl.setSelectionRange(pos, pos);

  // IE8 and below
  } else if (ctrl.createTextRange) {
    var range = ctrl.createTextRange();
    range.collapse(true);
    range.moveEnd('character', pos);
    range.moveStart('character', pos);
    range.select();
  }
}

////////////////////////////////////////////////////////////////////////////////
//Sticky Editor Stuff:

//COMMENT
function openStickyEditor(iID, bAppendNewSticky){
	//Empty all the fields first
	$("#id_popup_add_sticky input[name=title]").val("");
	quill.setContents("");

	//hide specific fields for new stickies:
	updateEditorOptions(bAppendNewSticky);

	if (bAppendNewSticky){
		//new Stickynote. iID = groupID
		$(".popup_title").text("Create Sticky");

		//select a random radio button colour
		const iNumColoursToChooseFrom = $('#id_sticky_options_form_colour .colour_option').length;
		const iRandomRadioButton = Math.floor(Math.random()*iNumColoursToChooseFrom);
		$('#id_sticky_options_form_colour .colour_option:eq(' + iRandomRadioButton + ')').trigger("click");

		//Set the group-Dropdown
		$("#id_sticky_options_group select").val(iID);

		//show the popup
		bAddStickyPopupIsActive = true;
		$('#id_popup_add_sticky').stop().fadeIn();
		//window.scrollTo(0, 0);

		const body = $("html, body");
		body.stop().animate({scrollTop:0}, 500, 'swing', function() {
		   //upon finishing
		});

		//TODO (maybe): Append a "new sticky" on the screen for fancy visuals
	}else{
		//existing stickynote. iID = stickyID
		$(".popup_title").text("Edit Sticky");

		//existing sticky that the user wants to edit, so retrieve all the fields from the DB
		get_sticky_by_id(iID, function(data){
			$("#id_popup_add_sticky input[name=title]").val(data.title);
			quill.setContents(JSON.parse(data.contents));

			//and update the editor colours:
			get_colour_by_id(data.colour_id, function(data2){
				//Update the Editor Colours
				UpdateEditorColours(data2.r, data2.g, data2.b, data2.a, data2.filename);

				//Set the correct Radio Button
				$('#colour_' + data.colour_id).prop('checked', true);

				//Set the shared-checkbox (if appropriate)
				if (data.group_is_shared){
					$('.show_if_group_shared').show();
					$('.hide_if_group_shared').hide();
				}else{
					$('.show_if_group_shared').hide();
					$('.hide_if_group_shared').show();
					$("#id_sticky_options_shared input[name=shared]").prop('checked',data.shared)
				}

				//Set the group-Dropdown
				$("#id_sticky_options_group select").val(data.group_id);

				//If that all has been done, we can finally actually open the editor
				bAddStickyPopupIsActive = true;
				$('#id_popup_add_sticky').stop().fadeIn();
			});
		});
	}
}

//Editor color defintions. Several pieces get a darker or lighter shade based upon the Sticky Colour. Several variables to allow finetuning
const iHeaderColourModifier = 0.75; 						//the Sticky's Header receives a darker shade of said colour
const iButtonColourModifier = 0.75; 						//the save/cancel buttons receive a darker shade of said colour
const iEditorColourModifier = 0.75;							//the Quill editor receives a lighter shade of said colour
const iOptionElementColourModifier = 0.75; 			//the background-colour for the options is a bit lighter
const iOptionElementBorderColourModifier = 0.75;//the border-colour for the options is a bit darker
const iOptionElementTextColourModifier = 0.75; 	//the text-colour gets the dark variant;

//Updates the colours of the Editor with the given values (and using the constants above)
function UpdateEditorColours(iR, iG, iB, iA, sFileName){
	//update a NEW_STICKY as well (if it exists).
	$( ".new_sticky:eq(-1) .sticky_img" ).attr("src",STATICPATH + '/Images/' + sFileName);


	//actually update the colours of the HTML elements
	$('.popup .sticky_edit .header').css("background-color",									"rgba(" + Math.round(iR*iHeaderColourModifier) + ", " + Math.round(iG*iHeaderColourModifier) + ", " + Math.round(iB*iHeaderColourModifier) + ", " + iA + ")");
	$('.popup .sticky_edit .body').css("background-color",										"rgba(" + iR + ", " + iG + ", " + iB + ", " + iA + ")");
	$('.popup .sticky_edit .body .buttons input').css("background-color",			"rgba(" + Math.round(iR*iButtonColourModifier) + ", " + Math.round(iG*iButtonColourModifier) + ", " + Math.round(iB*iButtonColourModifier) + ", " + iA + ")");
	$('.popup .sticky_edit .body form .editor_input').css("background-color",	"rgba(" + Math.round(iR + (255-iR)*iEditorColourModifier) + ", " + Math.round(iG + (255-iG)*iEditorColourModifier) + ", " + Math.round(iB + (255-iB)*iEditorColourModifier) + ", " + iA + ")");
	$('.popup .sticky_edit .body #id_sticky_options .sticky_option_element').css("background-color",	"rgba(" + Math.round(iR + (255-iR)*iOptionElementColourModifier) + ", " + Math.round(iG + (255-iG)*iOptionElementColourModifier) + ", " + Math.round(iB + (255-iB)*iOptionElementColourModifier) + ", " + iA + ")");
	$('.popup .sticky_edit .body #id_sticky_options .sticky_option_element').css("border-color",			"rgba(" + Math.round(iR*iOptionElementBorderColourModifier) + ", " + Math.round(iG*iOptionElementBorderColourModifier) + ", " + Math.round(iB*iOptionElementBorderColourModifier) + ", " + iA + ")");
	$('.popup .sticky_edit .body #id_sticky_options h3').css("color",					"rgba(" + Math.round(iR*iOptionElementTextColourModifier) + ", " + Math.round(iG*iOptionElementTextColourModifier) + ", " + Math.round(iB*iOptionElementTextColourModifier) + ", " + iA + ")");
	$('.popup .sticky_edit .body #id_sticky_options option').css("color",			"rgba(" + Math.round(iR*iOptionElementTextColourModifier) + ", " + Math.round(iG*iOptionElementTextColourModifier) + ", " + Math.round(iB*iOptionElementTextColourModifier) + ", " + iA + ")");
	$('.popup .sticky_edit .body #id_sticky_options select').css("color",			"rgba(" + Math.round(iR*iOptionElementTextColourModifier) + ", " + Math.round(iG*iOptionElementTextColourModifier) + ", " + Math.round(iB*iOptionElementTextColourModifier) + ", " + iA + ")");
	$('.popup .sticky_edit .body #id_sticky_options #id_sticky_options_shared label').css("color", "rgba(" + Math.round(iR*iOptionElementTextColourModifier) + ", " + Math.round(iG*iOptionElementTextColourModifier) + ", " + Math.round(iB*iOptionElementTextColourModifier) + ", " + iA + ")");

	//$('.popup .sticky_edit .body #id_sticky_options label').css("color","rgb(" + Math.round(iR*iOptionElementTextColourModifier) + ", " + Math.round(iG*iOptionElementTextColourModifier) + ", " + Math.round(iB*iOptionElementTextColourModifier) + ", " + iA + ")");
}


function updateEditorOptions(bNewSticky){
	//Hide the option elements that can only be used in edit-mode
	if (bNewSticky){
		$('.edit_only').hide();
	}else{
		$('.edit_only').show();
	}
}


////////////////////////////////////////////////////////////////////////////////
//AJAX Requests

//TODO: COMMENT
function get_sticky_by_id(iStickyID,func) {
	$.ajax({
	    url: '/ajax/get_sticky_by_id/',
	    data: {'iStickyID': iStickyID},
			type: 'GET',
	    dataType: 'json',
	    success: function (data) {
					func(data)
	    }
	});
}

//TODO: COMMENT
function get_group_by_id(iGroupID,func) {
	$.ajax({
	    url: '/ajax/get_group_by_id/',
	    data: {'iGroupID': iGroupID},
			type: 'GET',
	    dataType: 'json',
	    success: function (data) {
					func(data)
	    }
	});
}

//TODO: COMMENT
function get_colour_by_id(iColourID,func) {
	$.ajax({
	    url: '/ajax/get_colour_by_id/',
	    data: {'iColourID': iColourID},
			type: 'GET',
	    dataType: 'json',
	    success: function (data) {
					func(data)
	    }
	});
}

//TODO: COMMENT
function set_or_create_sticky_by_id(iStickyID, sTitle, sContents, iColour, iGroup, bShared, onSuccess, onFail) {
	//set a valid CSRF token
	setupSafeAjax();
	//actually uplaod the stickies
	$.ajax({
				type:"POST",
				url:"ajax/set_or_create_sticky_by_id/",
				data: {
							'id': 			iStickyID,
							'title': 		sTitle,
							'contents': sContents,
							'colour': 	iColour,
							'group': 		iGroup,
							'shared':		bShared,
							},
				success: function(){
						print('SUCCESSFUL UPLOAD');
						if (onSuccess != null){
							onSuccess();
						}

				},
				error: function(jqXHR, status, errorThrown) {
						print('FAILED UPLOAD');

						if (onFail != null){
							onFail(jqXHR, status, errorThrown);
						}

						//print(jqXHR);
				},
	});
}

//TODO: COMMENT
function delete_sticky_by_id(iStickyID, onSuccess, onFail) {
	//set a valid CSRF token
	setupSafeAjax();
	//actually uplaod the stickies
	$.ajax({
				type:"POST",
				url:"ajax/delete_sticky_by_id/",
				data: {
							'id': iStickyID,
							},
				success: function(){
						print('SUCCESSFUL DELETE');
						if (onSuccess != null){
							onSuccess();
						}
				},
				error: function(jqXHR, status, errorThrown) {
						print('FAILED DELETE');

						if (onFail != null){
							onFail(jqXHR, status, errorThrown);
						}
				},
	});
}

//Sends an AJAX-request to the backend to update the group with a given ID
//If such group does not exist, it is created (not neccesarily with the given ID)
//Can pass null to bShared and/or sTitle to not update the value(s).
function set_or_create_group_by_id(iGroupID, sTitle, bShared, onSuccess, onFail){
	//set a valid CSRF token
	setupSafeAjax();
	//actually uplaod the stickies
	$.ajax({
				type:"POST",
				url:"ajax/set_or_create_group_by_id/",
				data: {
							'id': 			iGroupID,
							'title': 		sTitle == null ? undefined : sTitle, //if null was passed, we send undefined instead (as null gets converted to an empty string by python)
							'shared':		bShared == null ? undefined : bShared,
							},
				success: function(){
						print('SUCCESSFUL GROUP UPLOAD');
						if (onSuccess != null){
							onSuccess();
						}
				},
				error: function(jqXHR, status, errorThrown) {
						print('FAILED GROUP UPLOAD');

						if (onFail != null){
							onFail(jqXHR, status, errorThrown);
						}

						//print(jqXHR);
				},
	});
}

//TODO: COMMENT
function delete_group_by_id(iGroupID, onSuccess, onFail) {
	//set a valid CSRF token
	setupSafeAjax();
	//actually uplaod the stickies
	$.ajax({
				type:"POST",
				url:"ajax/delete_group_by_id/",
				data: {
							'id': iGroupID,
							},
				success: function(){
						print('SUCCESSFUL DELETE');
						if (onSuccess != null){
							onSuccess();
						}
				},
				error: function(jqXHR, status, errorThrown) {
						print('FAILED DELETE');

						if (onFail != null){
							onFail(jqXHR, status, errorThrown);
						}
				},
	});
}

//TODO: COMMENT
function get_random_colour(func) {
	$.ajax({
	    url: '/ajax/get_random_colour/',
			data: {},
			type: 'GET',
	    dataType: 'json',
	    success: function (data) {
					//print(data)
					func(data.id,data.name,data.r,data.g,data.b,data.a,data.filename);
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
						print('USER WAS ALREADY LOGGED IN FROM A PREVIOUS SESSION!');

					}
	    }
	});
}



////////////////////////////////////////////////////////////////////////////////
//Event Listeners (fired by the AJAX requests)

//Event Listener. Functions can be 'hooked' into it here:
//Fires a Colour has been retrieved from the DB
/*
$(window).on('ColourDataRetrieved', function (e) {

});*/


////////////////////////////////////////////////////////////////////////////////
//Getting valid CSRF-Tokens for AJAX Requests and setting them up

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
