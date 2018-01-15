
$(document).ready(function() {
  //////////////////////////////////////////////////////////////////////////////
  //Searching for Friends

  //pressing ENTER should start the search
  $('#search_friend_bar').on("keypress", function(e) {
      if (e.keyCode == 13) {
          //send a button-click event to the button to prevent duplicate code
          $('#id_search_friends_confirm').trigger("click");
      }
  });

  //clicking the button starts the search
  $('#id_search_friends_confirm').on('click', function(e){
      get_users_by_names($('#search_friend_bar').val(),function(data){
          $('#id_search_friends_result').html("");
          print(data.tUsers);
          //No results
          if (data.tUsers.length <= 0) {
            $('#id_search_friends_result').append("<p class='warning'>No Users match this search result <span class='glyphicon glyphicon-exclamation-sign' aria-hidden='true'></span></p>");
          }else{
            //append each result
            data.tUsers.forEach(function(user) {
                //append the element
                $('#id_search_friends_result').append(getFriendHTMLEntry(user[0], user[1], user[2], user[3], user[4]))
            });
            //make the table around it
            $('#id_search_friends_result').html(getFriendTotalHTMLEntry($('#id_search_friends_result').html()));

            //set on-click listeners
            $('.button_add_friend').on('click',function(e){
                const iUser = $(this).attr("id").substring("id_add_friend_".length);
                print("Sending " + iUser + " a friend request");
                const clickedButton = this;
                send_friend_request(iUser, function(e){
                  //disable the button and change the text
                  $(clickedButton).html("Friend Request Sent <span class='glyphicon glyphicon-ok' aria-hidden='true'></span>")
                  $(clickedButton).attr("disabled", true)
                }, null);
            });
          }
      });
  });
});
//end of document.ready
////////////////////////////////////////////////////////////////////////////////
function getFriendTotalHTMLEntry(sData){
  return  '<ul class="list-group"> ' +
          '  <li class="list-group-item"> ' +
          '    <table style="width:100%"> ' +
          '      <tr> ' +
          '        <td>Username</td> ' +
          '        <td>First Name</td> ' +
          '        <td>Last Name</td> ' +
          '        <!--Possibly other fields from the DB. Can easily be added--> ' +
          '        <td>Friend Status</td> ' +
          '      </tr> ' +
          '    </table> ' +
          '  </li> ' + sData +
          '</ul>';
}

function getFriendHTMLEntry(iID, sUsername, sStatus, sFirstName, sLastName){
  return  '  <li class="list-group-item"> ' +
          '    <table style="width:100%" class="wrap-word-newline"> ' +
          '      <tr> ' +
          '        <td>' + sUsername + '</td> ' +
          '        <td>' + sFirstName + '</td> ' +
          '        <td>' + sLastName + '</td> ' +
          '        <!--Possibly other fields from the DB. Can easily be added--> ' +
          '        <td class="friend-status"> ' +
          '          <div class="btn-group" role="group" aria-label="SendRequest"> ' +
                          getFriendStatusButton(iID, sStatus) +
          '            </button> ' +
          '          </div> ' +
          '        </td> ' +
          '      </tr> ' +
          '    </table> ' +
          '  </li> ' +
          '</ul>';
}

function getFriendStatusButton(iID, sStatus){
    if (sStatus == "PENDING"){
      return  '            <button id="id_add_friend_' + iID + '" class="button_add_friend" type="button" disabled> ' +
              '              Pending Friend Request <span class="glyphicon glyphicon-time" aria-hidden="true"></span> ';
    }else if (sStatus=="ACCEPTED"){
      return  '            <button id="id_add_friend_' + iID + '" class="button_add_friend" type="button" disabled> ' +
              '              Already Friends <span class="glyphicon glyphicon-heart" aria-hidden="true"></span> ';
    }else{
      return  '            <button id="id_add_friend_' + iID + '" class="button_add_friend" type="button"> ' +
              '              Send Friend Request <span class="glyphicon glyphicon-plus" aria-hidden="true"></span> ';
    }
}

          /*
  sHTML = '<p>' + sUsername + '|</p>' +
          '<p>' + sFirstName + '|</p>' +
          '<p>' + sLastName + '</p>' +
          '<!--Possibly other fields from the DB. Can easily be added-->' +
          '<div class="btn-group" role="group" aria-label="SendRequest">' +
            '<button id="id_add_friend_' + iID + '" type="button"';
  if (sStatus == "PENDING"){
    sHTML +=
              'disabled>' +
              'Pending Friend Request <span class="glyphicon glyphicon-time" aria-hidden="true"></span>';
  }else if (sStatus == "ACCEPTED"){
    sHTML += //TODO: look at friends table instead of status
              'disabled>' +
              'Already Friends <span class="glyphicon glyphicon-heart" aria-hidden="true"></span>';
  }else{
    sHTML +=
              '>' +
              'Send Friend Request <span class="glyphicon glyphicon-plus" aria-hidden="true"></span>';
  }
  sHTML +=
            '</button>' +
          '</div>';*/


////////////////////////////////////////////////////////////////////////////////
//AJAX

//TODO COMMENT
function get_users_by_names(sName,func) {
	$.ajax({
	    url: '/ajax/get_users_by_names/',
	    data: {'sSearchData': sName},
			type: 'GET',
	    dataType: 'json',
	    success: function (data) {
					func(data)
	    }
	});
}

//COMMENT TODO
function send_friend_request(iReceiver,onSuccess,onFail) {
  //set a valid CSRF token
	setupSafeAjax();
	//actually uplaod the stickies
	$.ajax({
				type:"POST",
				url:"/ajax/send_friend_request/",
				data: {'receiver': iReceiver},
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
				},
	});
}

//COMMENT TODO
function respond_friend_request(iSender, sResponse,onSuccess,onFail) {
  //set a valid CSRF token
	setupSafeAjax();
	//actually uplaod the stickies
	$.ajax({
				type:"POST",
				url:"/ajax/respond_friend_request/",
				data: {
                'sender': iSender,
                'response': sResponse,
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
				},
	});
}

//Respond to a friend request
	$('.button_friend_request_response').on('click',function(e){
		const iSender = $(this).attr("value");
		const sResponse = $(this).attr("name");
		print(iSender);
		print(sResponse);
		respond_friend_request(iSender, sResponse, function(e){
      location.reload();
    }, null);
	});


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


////////////////////////////////////////////////////////////////////////////////
//Misc:

//Easy to disable all console.log's at once
function print(str){
  console.log(str);
}
