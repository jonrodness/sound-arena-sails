/**
 * ConsumptionController
 *
 * @description :: Server-side logic for managing consumptions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	// TODO: create client-side request in main.js
	create: function(req, res) {
		// TODO: must prevent multiple stops and starts from adding to consumptions - maybe check here if 
		// req.session.proceedSC is false
		if (!req.session.proceedSC) {
			var oTrackInfo = req.session.currentTrack;
			var sPlatform = oTrackInfo.trackHost;
			var sContentId = oTrackInfo.id;
			var sTitle = oTrackInfo.title;
			var sAuthorId = oTrackInfo.userId;
			var sArtistPermalink = oTrackInfo.artistPermalink;
			var sArtistAvatarUrl = oTrackInfo.artistAvatarUrl;
			var sTrackPermalink = oTrackInfo.trackPermalink;
			var sUsername = oTrackInfo.username;
			var sConsumerId = req.user.id;
			var sStreamURL = oTrackInfo.url_stream;

			var oConsumption = {
				author_id: sAuthorId,
				consumer_id: sConsumerId,
				platform: sPlatform,
				content_id: sContentId,
				title: sTitle,
				artistPermalink: sArtistPermalink,
				artistAvatarUrl: sArtistAvatarUrl,
				trackPermalink: sTrackPermalink,
				username: sUsername,
				streamURL: sStreamURL
			};

			Consumption.create(oConsumption, function(err, oConsumption) {
				if (err) {
					res.serverError();
					// TODO: error handle
				} else {
					// TODO: find the socket Id of the author and send a message to that user that their content was consumed
					req.session.proceedSC = true;
					// TODO: model should only need to be updated upon session ending as it can probably rely on session store for the duration of the session
					User.update( {id: req.user.id}, {
							proceedSC: true
					}).exec(function (err, aUpdatedRecords) {
						if (err) {
							// handle error
							res.serverError(err);
						}
					});
					res.status(201);
					// Send consumption back to user to add to previously played list
					res.json(oConsumption);
					res.send();
				}
			});
			var oData = {
				title: sTitle,
				author: sAuthorId
			};
			User.message(sAuthorId, oData);
		} 
		// need else case?
	}
};

