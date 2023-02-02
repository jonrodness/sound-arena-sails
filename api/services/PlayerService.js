// PlayerService.js - in api/services

var TESTING = true;

var SoundCloudAPI = require('soundcloud-node'),
	local = require('../../config/local'),
	_ = require('lodash'),
	Promise = require('bluebird')

module.exports = {

	initClient: function(req, resolve, reject) {
		return new Promise(function (resolve, reject) {
			// not using provider attribute as in services/passport.js
			// TODO: instead of checking for user, use permissions
			sails.models.passport.findOne(
				{ 
					user: req.user.id 
				},
				function(err, passport) {
					if (err) {
						// TODO: redirect to error
					}
					else {
						if (passport.tokens && passport.tokens.accessToken) {
							accessToken = passport.tokens.accessToken;
						}
						else {
							// TODO: error handle
						}
						var username = _.get(req, 'user.username');
						if (accessToken && username) {
							var credentials = {
								// TODO: Access tokens must be encrypted
							    access_token: accessToken,
							    user_id: username
							};
						}
						else {
							// TODO: error handle
						}
						var soundCloudId = _.get(local, 'credentials.SOUNDCLOUD_CLIENT_ID');
						var soundCloudSecret = _.get(local, 'credentials.SOUNDCLOUD_CLIENT_SECRET');
						if (soundCloudId && soundCloudSecret && credentials) {
							var client = new SoundCloudAPI(
								soundCloudId,
								soundCloudSecret,
								'http://localhost:1337/auth/soundcloud/callback?next=/player',
								credentials);
							req.session.client = client;
							resolve(client);
						}
						else {
							// TODO: add error handling (or in start method) for all else cases
						}
					}
				});
		});
	},

	getPageData: function(req, res) {
		var compileData = function(sNextTrack, aUserTracks) {
			var aUserTrackInfos = [];
			// TODO: use object mapping instead of creating new objects?
			aUserTracks.forEach(function(track) {
				if (track.sharing === "public") {
					var info = {
						userId: req.user.id,
						title: track.title,
						id: track.id,
						trackHost: "soundcloud"
					}
					aUserTrackInfos.push(info);
				}
			});
			req.session.tracks = aUserTrackInfos;

			// To ensure that the user has played the media for the minimum time required, set the session as dirty,
			// store the media's info in the session and start the timer. If the timer ends before the client returns
			// confirmation of user consumption, push the media back to queue
			req.session.hasPlayed = false;
			req.session.currentTrack = sNextTrack;
			// TODO: setup timer, asynchronously add media string to user table for next session
			var oNextTrack = JSON.parse(sNextTrack);
			// TODO: handle if sNextTrack is "null"
			if (oNextTrack && oNextTrack.id) {
				// Pass the oNextTrack ID and a list of the user's tracks as parameters to template
				// TODO: do not include private tracks (or disable them in html)
				return {
					tracks: aUserTrackInfos,
					id: oNextTrack.id
				};
			}
			else {
				// Error handle for no available song in the queue - throw exception?
				throw ("No tracks available")
			}
		};

		var fnGetTrackInfo = function(SCClient) {
			var getAsync = Promise.promisify(SCClient.get);
			return Promise.join(
				QueueService.popTrack(),
				getAsync('/users/{id}/tracks'),
				compileData			
			);
		};

		// TODO: make user feedback more verbose
		var handleExceptions = function(e) {
			return res.serverError(e);
		};

		// TODO: If refresh, should not be able to play next song in queue
			// Always check if there is a track stored in the session. If there is, do not pop from the queue
			// Upon listening for the required time, the song stored in the session may be deleted from the session
			// or a session state should be changed (ie: set checkpoint == true), and a new track can be popped from the queue.
		// Can the client be stored so it does not need to be recreated every time?
		
		// TODO: remove TESTING in production
		if (req.session.hasPlayed || TESTING) {
			return this.initClient(req).then(fnGetTrackInfo);
		}
		// TODO: else notify user they must play their current media (even though next button should be disabled)
	},	


};