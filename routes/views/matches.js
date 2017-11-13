var keystone = require('keystone'),
	moment = require('moment'),
	Attendance = keystone.list('Attendance');

var Match = keystone.list('Match');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'matches';
	locals.page.title = 'Matches - MIT Men\'s Rugby Football Club';
	
	view.query('upcomingMatches',
        Match.model.findOne()
			.where('state', 'active')
			.sort('-meetingTime')
	, 'attendances[who]');
	
	view.query('pastMatches',
        Match.model.find()
			.where('state', 'past')
			.sort('-meetingTime')
	, 'attendances[who]');
	
	view.on('render', function(next) {
	
		if (!req.user || !locals.upcomingMatches) return next();
		
		Attendance.model.findOne()
			.where('who', req.user._id)
			.where('match', locals.upcomingMatches)
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
