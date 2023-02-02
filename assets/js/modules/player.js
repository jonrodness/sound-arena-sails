/* Player */
var HOST = 'http://localhost:1337/';
var MIN_TIME = 5;

$nextButton = $('#next-button');
$nextButton.on('click', function() {
	var trackId = $('#trackList').find(':selected').val();
	loadPageData(trackId);
});



//TODO: remove - just for development
$('#test-button').click(function() {
	var uri = HOST + 'test';
	io.socket.get(uri, {}, function(resData, jwres) {
			console.log("responded");		
		if (jwres.statusCode === 200) {
			console.log("responded with 200");		
		}
	});
});




var widget;
var iPlayProgress = 0;
var iMinimumTime = MIN_TIME;

setUserTracks = function(userTracks) {
	var $trackList = $('#trackList');
	$trackList.empty();
	$.each(userTracks, function(i, track) {
		var $trackOption = $('<option value=' + track.id + '>' + track.title + ' </option>');
		if(track.sharing === 'private') {
			$trackOption.prop('disabled');
		}
		$trackList.append($trackOption);
	});
	// TODO (low): if disabled tracks are displayed, must make sure they are not selected by default
	$trackList.prop('selectedIndex', 0);
	
}

sendConfirmation = function() {
	var uri = HOST + 'consumption/create/';
	io.socket.get(uri, {}, function(resData, jwres) {
		if (jwres.statusCode === 201) {
			$nextButton.prop('disabled', false);
			$nextButton.removeClass('disabled');
			addNewPreviouslyPlayed(resData);
			// TODO: add song to previously played
		}
	});
};

bindEvents = function(widget) {
	var iPlayTimer;
	var iMinimumTime = MIN_TIME;
	widget.bind(SC.Widget.Events.PLAY, function(oData) {
		console.log("Track played");
		iPlayTimer = setInterval(function() {
			// TODO: what if song is under 1 second?
			iPlayProgress++;
			console.log(iPlayProgress + " " + iPlayTimer);
			if (iPlayProgress >= MIN_TIME) {
				clearInterval(iPlayTimer);
				iPlayTimer = null;		
				sendConfirmation();
			}
		}, 1000);
	});

	widget.bind(SC.Widget.Events.FINISH, function(oData) {
		clearInterval(iPlayTimer);
		console.log("Track finished");
	});

	widget.bind(SC.Widget.Events.PAUSE, function(oData) {
		clearInterval(iPlayTimer);
		console.log("Track paused");
	});

	widget.bind(SC.Widget.Events.READY, function(oData) {
		clearInterval(iPlayTimer);
		iPlayProgress = 0;
	});
};

unbindEvents = function(widget) {
	widget.unbind(SC.Widget.Events.PLAY);
	widget.unbind(SC.Widget.Events.FINISH);
	widget.unbind(SC.Widget.Events.PAUSE);
	widget.unbind(SC.Widget.Events.READY);
};

setupPlayer = function(trackId) {
	$nextButton.prop('disabled', true);
	$nextButton.addClass('disabled');
	iPlayProgress = 0;
	var url = 'http://api.soundcloud.com/tracks/' + trackId;
	if (widget) {
		// Load a new track into the widget
		widget.load(url);
	} else {
		// Initialize the widget with a new track
		var iframe = document.querySelector('.iframe');
		iframe.src = 'https://w.soundcloud.com/player/?url=' + url;
		widget = SC.Widget(iframe);
	}

	unbindEvents(widget);
	bindEvents(widget);		
};

getPreviouslyPlayedString = function(oPreviouslyPlayed) {
	return "<li> <img class='avatar' src=" + oPreviouslyPlayed.artistAvatarUrl 
		+ "> <div class='trackInfo'> <a href=" + oPreviouslyPlayed.trackPermalink + " target='_blank'><span class='title'>"
		+ oPreviouslyPlayed.title
		+ "</span> <a href=" + oPreviouslyPlayed.artistPermalink + " target='_blank'><span class='author'>" 
		+ oPreviouslyPlayed.username
		+ "</span> </div> </li>";
};

setupPreviouslyPlayed = function(aPreviouslyPlayed) {
	var $previouslyPlayedContainer = $("#previously-played-container");
	if (aPreviouslyPlayed.length > 0) {
		$previouslyPlayedList = $("<ul id='prev-played-list'></ul>");
		$previouslyPlayedContainer.html($previouslyPlayedList);
		$.each(aPreviouslyPlayed, function(iIndex, oPreviouslyPlayed) {
			var sPreviouslyPlayed = getPreviouslyPlayedString(oPreviouslyPlayed);
			$previouslyPlayedList.append(sPreviouslyPlayed);
		});
	} else {
		$previouslyPlayedContainer.html("<p>Press play to start listening and add your track!</p>");
	}
};

addNewPreviouslyPlayed = function(oPreviouslyPlayed) {
	$previouslyPlayedList = $("#prev-played-list");
	if ($previouslyPlayedList.length === 0) {
		$previouslyPlayedList = $("<ul id='prev-played-list'></ul>");
		$("#previously-played-container").html($previouslyPlayedList);		
	}
	var sPreviouslyPlayed = getPreviouslyPlayedString(oPreviouslyPlayed);
	$("#prev-played-list").prepend(sPreviouslyPlayed);

	var fnFadeInElement = function($element) {
		$element.addClass("animated fadeIn").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
			$element.removeClass("animated fadeIn");
		});
	}
	
	fnFadeInElement($("#prev-played-list li:first"));


	// $("#prev-played-list li:first").addClass("animated fadeIn").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {

	// });
	// TODO: change color of newly added track
};

/*****************************************************************************
* Sends an ajax request whose reponse includes the user's tracks for selection
*
* @param 
*	sTrackId (String) the id of the track the user has selected to 
* 	add to the global queue
*
* @returns null
******************************************************************************/
startStream = function(sStreamURL) {
	$("#audio-player").attr("src", sStreamURL);
};


loadPageData = function(sTrackId) {
	var xhttp = new XMLHttpRequest();
	var uri = HOST + 'loadPageData/?st=' + sTrackId;
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			var response = JSON.parse(xhttp.response);
			setUserTracks(response.userTracks);
			setupPlayer(response.playTrackId);
			startStream(response.streamURL); // remove - for development only
		}
	};
	xhttp.open('GET', uri, true);
	xhttp.send();
};

loadPreviouslyPlayed = function(iSkip) {
	var xhttp = new XMLHttpRequest();
	var uri = HOST + 'loadPreviouslyPlayed/?s=' + iSkip;
	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			var response = JSON.parse(xhttp.response);
			setupPreviouslyPlayed(response.previouslyPlayed);			
		}
	}
	xhttp.open('GET', uri, true);
	xhttp.send();	
};

$(window).load(function() {
	loadPageData(null);
	loadPreviouslyPlayed(0);
	// TODO: add socket callback here? io.socket.on('<model identity', function (event) {});
});