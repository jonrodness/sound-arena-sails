/**
 * PlayerController
 *
 * @description :: Server-side logic for managing players
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var	Promise = require('bluebird');
var local = require('../../config/local');

module.exports = {

	// TODO: REMOVE FOR DEVELOPMENT ONLY
	test: function(req, res) {
		var sAuthorId = req.user.id;
		User.message(sAuthorId, '.tmp/public/images/song.mp3');
		res.status(200);
		res.send();
	},

	get: function(req, res) {
		if (!(req.session.proceedSC === undefined)) {
			res.view('player');
		} else {
		    User.findOne(req.user.id).then(function (oUser) {
					req.session.proceedSC = oUser.proceedSC;
					req.session.permalink = oUser.permalink;
					res.view('player');    		
		    	}).catch(function(err) {
		    		// TODO: handle exception
		    	});
		}
	},

	/* AJAX requests */
	
	loadPreviouslyPlayed: function(req, res) {
		var fnHandleError = function(sError) {
			console.log(sError);
			return res.serverError(sError);
		}; // TODO: written here twice, may need to re-evaluate error handling

		var iSkip = parseInt(req.allParams().s);
		var oOptions = {
			id: req.user.id,
			skip: iSkip
		};
		Consumption.getPreviouslyPlayed(oOptions).then(function(aPreviouslyPlayed) {
			res.json({
				previouslyPlayed: aPreviouslyPlayed
			});
		}).catch(fnHandleError);
	},	

	// TODO: add policy/permission so only authenticated users can use this action
	loadPageData: function(req, res) {
		var fnHandleData = function(oNextTrack, aUserTrackInfos) {
			if (oNextTrack) {
				// To ensure that the user has played the media for the minimum time required, set the session as dirty,
				// store the media's info in the session and start the timer. If the timer ends before the client returns
				// confirmation of user consumption, push the media back to queue
				req.session.proceedSC = false;

				req.session.currentTrack = oNextTrack;
				// TODO: setup timer, asynchronously add media string to user table for next session

				// TODO: this should only be done upon logging in and disconnecting, not every time a user confirms a play
				User.update( {id: req.user.id}, {
						proceedSC: false,
						soundcloudCurrentTrack: oNextTrack
				}).exec(function (err, aUpdatedRecords) {
					if (err) {
						// handle error
						res.serverError(err);
						console.log('User not updted');
					}
					console.log('User ' + req.user.id + ' updated with proceedSC: ' + aUpdatedRecords[0].proceedSC);
				});
			} else {
				// TODO: handle no available tracks!
			}

			if (aUserTrackInfos) {
				req.session.tracks = aUserTrackInfos;
			}

			sStreamURL = oNextTrack && oNextTrack.streamURL + "?client_id=" + local.credentials.SOUNDCLOUD_CLIENT_ID;

			res.json({
				userTracks: aUserTrackInfos,
				playTrackId: oNextTrack && oNextTrack.id,
				streamURL: sStreamURL
			});
		};

		var fnHandleError = function(sError) {
			console.log(sError);
			return res.serverError(sError);
		}; // TODO: not used

		var iSelectedTrackId = parseInt(req.allParams().st);
		
		if (iSelectedTrackId) {
			var aUserTracks = req.session.tracks;
			QueueService.pushTrack(aUserTracks, iSelectedTrackId);							
		}

		var fnGetData = function(fnGetTrack) {
			Promise.join(
				fnGetTrack,
				PlatformService.getUserTrackInfos(req),
				fnHandleData // TODO: need error handling
			).catch(fnHandleError);
		};

		var	fnGetTrack;
		if (req.session.proceedSC) {
			fnGetTrack = QueueService.getNextTrack();
		} else {
			fnGetTrack = req.session.currentTrack;
		}

		if (fnGetTrack) {
			fnGetData(fnGetTrack);
		} else {
			User.findOne(req.user.id).then(function (oUser) {
				fnGetTrack = oUser.soundcloudCurrentTrack 
					|| QueueService.getNextTrack();
				fnGetData(fnGetTrack);
		    }).catch(function(err) {
		    	// TODO: handle exception
		    });
		}
	}

};

