var keystone = require('keystone'),
    moment = require('moment'),
    Match = keystone.list('Match'),
    Attendance = keystone.list('Attendance');

exports = module.exports = function(req, res) {

    var view = new keystone.View(req, res),
        locals = res.locals;

    locals.section = 'matches';
    locals.page.title = 'MITRFC | Match Details';

    locals.rsvpStatus = {};

    // LOAD the Match

    view.on('init', function(next) {
        Match.model.findOne()
            .where('key', req.params.match)
            .exec(function(err, match) {

                if (err) {
                    return res.err(err);
                }
                if (!match) {
                    return res.notfound('Post not found');
                }

                locals.match = match;
                locals.match.populateRelated('attendances[who]', next);

            });
    });

    // LOAD an RSVP

    view.on('init', function(next) {

        if (!req.user || !locals.match) {
            return next();
        }

        Attendance.model.findOne()
            .where('who', req.user._id)
            .where('attendance', locals.attendance)
            .exec(function(err, rsvp) {
                locals.rsvpStatus = {
                    rsvped: rsvp ? true : false,
                    attending: rsvp && rsvp.attending ? true : false
                }
                locals.match.populateRelated('matchreport', next);
            });

    });

    view.render('site/match');

}
