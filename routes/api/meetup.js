var _ = require('lodash');
var async = require('async');
var keystone = require('keystone');
var Meetup = keystone.list('Meetup');
var RSVP = keystone.list('RSVP');

exports = module.exports = function(req, res) {

	var matchId = req.params.id;

	var rtn = {
		match: {},
		attendees: [],
		rsvp: {
			exists: false,
			attending: false
		}
	};

	async.series([

		function(next) {
			keystone.list('Meetup').model.findById(matchId, function(err, match) {
				if (err) {
					console.log('Error finding match: ', err)
				}
				rtn.match = match;
				return next();
			});
		},

		function(next) {
			if (!rtn.match || !req.user) return next();
			keystone.list('RSVP').model.findOne()
				.where('who', req.user.id)
				.where('match', rtn.match.id)
				.exec(function(err, rsvp) {
					if (err) {
						console.log('Error finding current user RSVP', err);
					}
					if (rsvp) {
						rtn.rsvp.exists = true;
						rtn.rsvp.attending = rsvp.attending;
					}
					return next(err);
				});
		},

		function(next) {
			if (!rtn.meetup) return next();
			keystone.list('RSVP').model.find()
				.where('match', rtn.match.id)
				.where('attending', true)
				.populate('who')
				.exec(function(err, results) {
					if (err) {
						console.log('Error loading attendee RSVPs', err);
					}
					if (results) {
						rtn.attendees = _.compact(results.map(function(rsvp) {
							if (!rsvp.who) return;
							return {
								url: rsvp.who.isPublic ? rsvp.who.url : false,
								photo: rsvp.who.photo.exists ? rsvp.who._.photo.thumbnail(80,80) : rsvp.who.avatarUrl || '/images/avatar.png',
								name: rsvp.name
							};
						}));
					}
					return next();
				});
		},

	], function(err) {
		if (err) {
			rtn.err = err;
		}
		res.json(rtn);
	});
}
