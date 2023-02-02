/**
* Consumption.js
*
* @description :: This model represents a set of records for each time a user consumes another user's content
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var Promise = require('bluebird');

module.exports = {

  attributes: {
  	author_id: {
  		type: 'integer',
  		notNull: true,
  		index: true
  	},
  	consumer_id: {
  		type: 'integer',
  		notNull: true
  	},
  	platform: {
  		type: 'string',
  		notNull: true
  	},
  	content_id: {
  		type: 'string',
  		notNull: true
  	},
    title: {
      type: 'string'
    },
    artistPermalink: {
      type: 'string'
    },
    artistAvatarUrl: {
      type: 'string'
    },
    trackPermalink: {
      type: 'string'
    },
    username: {
      type: 'string'
    },
    streamURL: {
      type: 'string'
    }
  },

  getPreviouslyPlayed: function(oOptions) {
    return new Promise(function (resolve, reject) {
      var iSkip = 0;
      // TODO: determine whether a skip number larger than the number of records will cause an exception
      if (!isNaN(oOptions.skip)) {
        iSkip = oOptions.skip;
      }
      Consumption.find({consumer_id: oOptions.id})
      .sort('createdAt DESC')
      .limit(10)
      .skip(iSkip)
      .exec(function (err, aRecords) {
        if (err) {
          reject(err);
        } else {
          resolve(aRecords);          
        }
      });
    });
  }

};