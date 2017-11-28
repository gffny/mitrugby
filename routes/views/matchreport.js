var keystone = require('keystone'),
    moment = require('moment'),
    Match = keystone.list('Match'),
    MatchReport = keystone.list('MatchReport');

exports = module.exports = function(req, res) {

    var view = new keystone.View(req, res),
        locals = res.locals;

    locals.section = 'matches';
    locals.page.title = 'MITRFC | Match Report';

    // LOAD the Match

    view.on('init', function(next) {
        MatchReport.model.findOne()
            .where('key', req.params.matchreport)
            .exec(function(err, matchReport) {

                if (err) {
                    return res.err(err);
                }
                if (!matchReport) {
                    return res.notfound('Match Report not found');
                }

                locals.matchReport = matchReport;
                return next();

            });
    });

    // LOAD the Match

    view.on('init', function(next) {
        Match.model.findOne()
            .where('_id', locals.matchReport.match)
            .exec(function(err, match) {

                if (err) {
                    return res.err(err);
                }
                if (!match) {
                    return next();
                }

                locals.matchReport.match = match;
                return next();
            });
    });


    view.render('site/matchreport');

}
