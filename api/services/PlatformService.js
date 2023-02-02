// PlatformService.js - in api/services

var TESTING = true;

var SoundCloudAPI = require('soundcloud-node'),
	local = require('../../config/local'),
	_ = require('lodash'),
	Promise = require('bluebird')

module.exports = {

	_initClient: function(req, resolve, reject) {
		return new Promise(function (resolve, reject) {
			var fnCreateClient = function(err, passport) {
				if (err) {
					reject(err);
				}
				else {
					var accessToken = passport.tokens && passport.tokens.accessToken;
					var permalink = _.get(req, 'session.permalink');
					var credentials = {
						// TODO: Access tokens must be encrypted
					    access_token: accessToken,
					    user_id: permalink
					};
					var soundCloudId = _.get(local, 'credentials.SOUNDCLOUD_CLIENT_ID');
					var soundCloudSecret = _.get(local, 'credentials.SOUNDCLOUD_CLIENT_SECRET');
					var client = new SoundCloudAPI(soundCloudId,
						soundCloudSecret,
						'http://localhost:1337/auth/soundcloud/callback?next=/player',
						credentials);
					req.session.client = client;
					resolve(client);
				}
			};

			// not using provider attribute as in services/passport.js
			// TODO: instead of checking for user, use permissions
			Passport.findOne({user: req.user.id}, fnCreateClient);
		});
	},

	getUserTrackInfos: function(req) {
		var fnGetTrackInfos = function(aUserTracks) {
			var fnGetPublicTracks = function(track) {
				return track.sharing === "public";
			};

			var fnCreateUserTracksInfo = function(track) {
				var sAvatarUrl = track.user && track.user.avatar_url;
				if (sAvatarUrl) {
					// for soundcloud avatar images					
					sAvatarUrl = sAvatarUrl.replace("large.jpg", "small.jpg");
				}
				return {
					userId: req.user.id,
					// TODO: use artistPermalink, artistAvatarUrl, & username for previously played list, but need to add 
					// artist and track tables to properly store data
					artistPermalink: track.user && track.user.permalink_url,
					// TODO/WARNING: the artistAvatarUrl may be cross-site?? then again - are all client soundcloud api calls?
					artistAvatarUrl: sAvatarUrl,
					username: track.user && track.user.username,					
					title: track.title,
					trackPermalink: track.permalink_url,
					id: track.id,
					streamURL: track.stream_url,
					trackHost: "soundcloud"
				}
			};
					
			aUserTracks = aUserTracks.filter(fnGetPublicTracks).map(fnCreateUserTracksInfo);
			return aUserTracks;
		};

		var fnGetTracks = function(SCClient) {
			var getAsync = Promise.promisify(SCClient.get);
			return getAsync('/users/{id}/tracks');
		};

		var fnHandleError = function(sError) {
			console.log(sError);
			return res.serverError(sError);
		}; // TODO: not used

		// TODO: If refresh, should not be able to play next song in queue
			// Always check if there is a track stored in the session. If there is, do not pop from the queue
			// Upon listening for the required time, the song stored in the session may be deleted from the session
			// or a session state should be changed (ie: set checkpoint == true), and a new track can be popped from the queue.
		// Can the client be stored so it does not need to be recreated every time?
		
		// TODO: remove TESTING in production
		if (req.session.proceedSC || TESTING) {
			return this._initClient(req).then(fnGetTracks).then(fnGetTrackInfos);
		}
		// TODO: else notify user they must play their current media (even though next button should be disabled)
	},	

};