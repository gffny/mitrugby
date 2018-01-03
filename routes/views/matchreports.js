var keystone = require('keystone'),
	moment = require('moment');

var Match = keystone.list('Match');

exports = module.exports = function(req, res) {

    var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'matchReports';
	locals.page.title = 'MITRFC | Match Reports';

    view.query('pastMatches',
        Match.model.find()
            .where('state').ne('draft')
            .where('kickOffTime').lt(moment().startOf('day'))
            .where('reportDetail').ne('')
            .where('reportDetail').ne(null)
            .sort('meetingTime'));

    view.on('render', function(next) {

        var additionalMatches = [];
        //setting past matches
        if (locals.pastMatches) {

            var topMatch = locals.pastMatches.pop();
            var i = 0;
            locals.pastMatches.forEach(function(pastMatch) {
                // only add 5 past matches to the page
                if (i < 5) {
                    additionalMatches.push(pastMatch);
                    i++;
                }
            });
            locals.topMatch = topMatch;
        }
        locals.additionalMatches = additionalMatches;
        return next();
    });

	view.render('site/matchreports');
	
}
