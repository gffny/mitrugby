var keystone = require('keystone'),
	moment = require('moment');

var MatchReport = keystone.list('MatchReport'),
    Match = keystone.list('Match');

exports = module.exports = function(req, res) {

    var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'matchReports';
	locals.page.title = 'MITRFC | Match Reports';

    view.query('pastMatches',
        Match.model.find()
            .where('state').ne('draft')
            .where('kickOffTime').lt(moment().startOf('day'))
            .where('matchReport').ne(null)
            .sort('-meetingTime'), 'matchreport');

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

        if (locals.topMatch) {
            //finding MatchReport where id is - locals.topMatch.matchReport
            MatchReport.model.findOne()
                .where('_id', locals.topMatch.matchReport)
                .exec(function(err, matchreport) {

                    locals.topMatch.matchReport = matchreport;
                    return next();
                });
        } else {
            // no topMatch
            return next();
        }

    });

	view.render('site/matchreports');
	
}
