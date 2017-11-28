var keystone = require('keystone'),
    moment = require('moment'),
    MatchReport = keystone.list('MatchReport');

exports = module.exports = function(req, res) {

    var view = new keystone.View(req, res),
        locals = res.locals;

    locals.section = 'matches';
    locals.page.title = ' MITRFC | Match Report';

    // LOAD the Match

    view.on('init', function(next) {
        MatchReport.model.findOne()
            .where('key', req.params.matchreport)
            .exec(function(err, matchReport) {

                if (err) return res.err(err);
                if (!matchReport) return res.notfound('Match Report not found');

                locals.matchReport = matchReport;
            });
    });

    view.render('site/matchreport');

}
