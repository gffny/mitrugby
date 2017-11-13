var keystone = require('keystone'),
	moment = require('moment');

var MatchReport = keystone.list('MatchReport');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'matchreports';
	locals.page.title = 'Match Reports - MIT Men\'s Rugby Football Club';
	
	view.query('matchReports',
        MatchReport.model.findOne()
			.sort('-publishedDate')
	, '');

	view.on('render', function(next) {
	
		if (!req.user || !locals.latestMatchReport) return next();
			
	});
	
	view.render('site/matchreports');
	
}
