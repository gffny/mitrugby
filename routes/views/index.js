var keystone = require('keystone'),
	moment = require('moment')

var Match = keystone.list('Match'),
    Post = keystone.list('Post'),
    MatchReport = keystone.list('MatchReport'),
	Attendance = keystone.list('Attendance');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'home';
    locals.page.title = 'MITRFC | Home';

	locals.rsvpStatus = {};
	locals.match = {};

	locals.user = req.user;

    // Load the latest match report
    view.query('latestMatchReport',

        Match.model.findOne()
            .where('state').ne('draft')
            .where('matchReport').ne(null)
            .sort('-meetingTime'), 'matchreport');

    view.query('pastMatch',

        Match.model.findOne()
            .where('state').ne('draft')
            .where('kickOffTime').lt(moment().startOf('day'))
            .sort('-meetingTime'), 'matchreport');

    view.query('activeMatch',

        Match.model.findOne()
            .where('state').ne('draft')
            .where('kickOffTime').lt(moment().startOf('day'))
            .sort('-meetingTime'), 'attendances[who]');

    // Load an RSVP
	view.on('init', function(next) {

		if (!req.user) {
		    return next();
        }

        Attendance.model.findOne()
			.where('who', req.user._id)
			.where('match', locals.activeMatch)
			.exec(function(err, rsvp) {
				locals.rsvpStatus = {
					rsvped: rsvp ? true : false,
					attending: rsvp && rsvp.attending ? true : false
				}
				return next();
			});
	});

    view.on('render', function(next) {

        locals.match = locals.activeMatch ? locals.activeMatch : locals.pastMatch;

        return next();
    });


    view.render('site/index');

}
