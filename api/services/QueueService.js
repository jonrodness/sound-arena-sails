// PlayerService.js - in api/services

var Promise = require('bluebird'),
	redis = require('redis');

Promise.promisifyAll(require('redis'));
var redisClient = redis.createClient();

redisClient.on("error", function(err){
	console.log(err);
});

module.exports = {

	pushTrack: function(aUserTracks, iSelectedTrackId) {
		var fnIsValidTrack = function(track) {
			return track.id === iSelectedTrackId;
		};

		// selected track is null the first time the player is loaded
		var aMatchingTracks = aUserTracks && aUserTracks.filter(fnIsValidTrack);
		
		if (aMatchingTracks && aMatchingTracks.length === 1) {
			redisClient.rpush('audioQueue', JSON.stringify(aMatchingTracks[0]));
		} else {
			// TODO: error handling if no valid track - use flash message in AJAX response
		}
	},

	/**
	 *	Pops the next track from the queue
	 *
	 *	@returns {Object} 
	 */
	getNextTrack: function() {
		var fnParseTrack = function(sTrack) {
			return JSON.parse(sTrack);			
		};

		return redisClient.lpopAsync('audioQueue').then(fnParseTrack);
	}

};
