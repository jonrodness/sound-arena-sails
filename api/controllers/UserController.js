// api/controllers/UserController.js

var _ = require('lodash');
var _super = require('sails-auth/api/controllers/UserController');

_.merge(exports, _super);
_.merge(exports, {

  // Extend with custom logic here by adding additional fields, methods, etc.

  subscribe: function(req, res) {
  	if(!req.isSocket) {
  		return res.badRequest('Can only subscribe using client socket');
  	}
  	var aIds = [req.user && req.user.id];
  	User.subscribe(req, aIds);
  	res.ok();
  }

});
