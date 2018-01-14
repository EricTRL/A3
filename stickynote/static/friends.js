
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
          $('#id_search_friends_result').html('');
          print(data.tUsers);
          data.tUsers.forEach(function(user) {
              //append the element
              $('#id_search_friends_result').append(getFriendHTMLEntry(user[0], user[1], user[2], user[3], user[4]))
              //set on-click listener
              $('#id_add_friend_' + user[0]).on('click',function(e){
                  print('w/e' + user[0])
                  send_friend_request(user[0], null, null);
              });
          });
          //No results
          if (data.tUsers.length <= 0) {
            $('#id_search_friends_result').append("<p>No Users match this search result :c</p>");
          }
      });
  });
});
//end of document.ready
////////////////////////////////////////////////////////////////////////////////


function getFriendHTMLEntry(iID, sUsername, sStatus, sFirstName, sLastName){
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
    sHTML +=
              'disabled>' +
              'Already Friends <span class="glyphicon glyphicon-heart" aria-hidden="true"></span>';
  }else{
    sHTML +=
              '>' +
              'Send Friend Request <span class="glyphicon glyphicon-plus" aria-hidden="true"></span>';
  }
  sHTML +=
            '</button>' +
          '</div>';
  return sHTML;
}


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
		respond_friend_request(iSender, sResponse, null, null);
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
