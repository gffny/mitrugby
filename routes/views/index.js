var keystone = require('keystone'),
	moment = require('moment')

var Match = keystone.list('Match'),
    Post = keystone.list('Post'),
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
            .where('reportDetail').ne('')
            .sort('-meetingTime'));

    view.query('pastMatch',

        Match.model.findOne()
            .where('state').ne('draft')
            .where('kickOffTime').lt(moment().endOf('day'))
            .sort('-meetingTime'));

    view.query('activeMatch',

        Match.model.findOne()
            .where('state').ne('draft')
            .where('kickOffTime').gt(moment().startOf('day')), 'attendances[who]');

    // Load an RSVP
	view.on('init', function(next) {

		if (!req.user) {
		    return next();
        }

        var reports = Match.model.find()
            .where('state').ne('draft')
            .sort('-meetingTime');

        for (var i = 0; i < reports.length; i++) {
            console.log("have a match report "+report.reportDetail);
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
