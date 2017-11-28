var keystone = require('keystone'),
	moment = require('moment');

var MatchReport = keystone.list('MatchReport');

exports = module.exports = function(req, res) {

    var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'matchReports';
	locals.page.title = 'MITRFC | Match Reports';

    view.query('previousMatchReport',
        MatchReport.model.findOne()
            .where('state', 'active')
            .sort('-publishedDate'));
	
	view.query('matchReports',
        MatchReport.model.findOne()
			.sort('-publishedDate'));

	view.on('render', function(next) {

        if (!req.user || !locals.latestMatchReport) return next();

	});
	
	view.render('site/matchreports');
	
}
