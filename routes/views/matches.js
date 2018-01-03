var keystone = require('keystone'),
	moment = require('moment');

var Match = keystone.list('Match');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'matches';
	locals.page.title = 'MITRFC | Matches';
    locals.topMatch = {};

    view.query('pastMatches',

        Match.model.find()
            .where('state').ne('draft')
            .where('kickOffTime').lt(moment().endOf('day'))
            .sort('-meetingTime'));

    view.query('upcomingMatch',

        Match.model.findOne()
            .where('state').ne('draft')
            .where('kickOffTime').gt(moment().startOf('day')), 'attendances[who]');

 	view.on('render', function(next) {

	    locals.topMatch = locals.upcomingMatch;

	    var additionalMatches = [];

	    var i = 0;

        if (locals.pastMatches) {
            if (!locals.topMatch) {
                locals.topMatch = locals.pastMatches.pop();
                i = 1;
            }
            locals.pastMatches.forEach(function(pastMatch) {
                if (i < 6) {
                    additionalMatches.push(pastMatch);
                    i++;
                }
            });
        }
        locals.additionalMatches = additionalMatches;
        return next();
	});
	
	view.render('site/matches');
	
}
