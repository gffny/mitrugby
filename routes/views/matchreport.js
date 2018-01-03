var keystone = require('keystone'),
    moment = require('moment');

var Match = keystone.list('Match');

exports = module.exports = function(req, res) {

    var view = new keystone.View(req, res),
        locals = res.locals;

    locals.section = 'matches';
    locals.page.title = 'MITRFC | Match Report';

    // LOAD the Match

    view.query('match',
        Match.model.findOne()
            .where('key', req.params.matchreport));

    view.render('site/matchreport');

}
