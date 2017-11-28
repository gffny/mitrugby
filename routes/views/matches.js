var keystone = require('keystone'),
	moment = require('moment');

var Match = keystone.list('Match'),
    Attendance = keystone.list('Attendance'),
    MatchReport = keystone.list('MatchReport');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'matches';
	locals.page.title = 'MITRFC | Matches';

	view.query('upcomingMatch',
        Match.model.findOne()
			.where('state', 'active')
			.sort('-meetingTime')
	, 'attendances[who], matchReports[who]');
	
	view.query('pastMatches',
        Match.model.find()
			.where('state', 'past')
			.sort('-meetingTime')
    , 'attendances[who], matchReports[who]');
	
	view.on('render', function(next) {
	
		if (!req.user || !locals.upcomingMatch) return next();
		
		Attendance.model.findOne()
			.where('who', req.user._id)
			.where('match', locals.upcomingMatch)
			.exec(function(err, rsvp) {
				locals.rsvpStatus = {
					rsvped: rsvp ? true : false,
					attending: rsvp && rsvp.attending ? true : false
				}
				return next();
			});
	});
	
	view.render('site/matches');
	
}
