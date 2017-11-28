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
	locals.match = {};
    locals.matchReport = {};
    locals.page.title = 'MITRFC | Home';
	
	locals.rsvpStatus = {};

	locals.user = req.user;
	
	// Load the first, NEXT match
	
	view.on('init', function(next) {
        Match.model.findOne()
			.where('state', 'active')
			.sort('-meetingTime')
			.exec(function(err, activeMatch) {
				locals.activeMatch = activeMatch;
				next();
			});
			
	});
	
	
	// Load the first, PAST match
	
	view.on('init', function(next) {
		Match.model.findOne()
			.where('state', 'past')
			.sort('-meetingTime')
			.exec(function(err, pastMatch) {
				locals.pastMatch = pastMatch;
				next();
			});
			
	});

    // Load the latest match report

    view.on('init', function(next) {
        MatchReport.model.findOne()
            .sort('-meetingTime')
            .exec(function(err, matchReport) {
                locals.matchReport = matchReport;
                next();
            });
    });

    // Load the match

    view.on('init', function(next) {

        if (!locals.matchReport) {
            return next();
        }
        Match.model.findOne()
            .where('_id', locals.matchReport.match)
            .exec(function(err, match) {
                locals.matchReport.match = match;
                return next();
        });
    });
	
	// Load an RSVP
	
	view.on('init', function(next) {

		if (!req.user || !locals.activeMatch) return next();

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
	
	// Decide which to render
	
	view.on('render', function(next) {
		
		locals.match = locals.activeMatch || locals.pastMatch;
		if (locals.match) {
			locals.match.populateRelated('attendances[who]', next);
		} else {
			next();
		}
	});
	
	view.render('site/index');
	
}
