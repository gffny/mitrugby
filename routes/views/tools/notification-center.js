var keystone = require('keystone'),
    async = require('async'),
    moment = require('moment');

var User = keystone.list('User'),
    Match = keystone.list('Match');

exports = module.exports = function (req, res) {

    var view = new keystone.View(req, res),
        locals = res.locals;

    locals.section = 'tools';
    //locals.nextMatch = false;

    console.log('====== ALERT =====');
    console.log('====== Trying to get to the notification centre =====');
    // Keep it secret, keep it safe

    if (!req.user || req.user && !req.user.isAdmin) {
        console.warn('===== ALERT =====');
        console.warn('===== A non-admin attempted to access the Notification Center =====');
        return res.redirect('/');
    }

    // Get all subscribers

    view.query('subscribers', User.model.find().where('notifications.matches').eq(true));
    //view.query('nextMatch', Match.model.findOne().where('state').ne('draft').where('kickOffTime').gt(moment().startOf('day')));

    // Get the next meetup

    view.on('init', function (next) {
        console.log('getting next match');
        Match.model.findOne()
            .where('state').ne('draft')
            .where('kickOffTime').gt(moment().startOf('day'))
            .exec(function (err, match) {
                if (err) {
                    return handleError(err);
                }
                if (match) {
                    // Prints "Space Ghost is a talk show host."
                    console.log('Match is against: %s', match.opposition);
                    locals.nextMatch = match;
                    next();
                } else {
                    console.log('No match');
                    next();
                }
            });
    });

    // Notify next meetup attendees
    view.on('post', { action: 'notify.attendee' }, function (next) {
        console.log('notify attendees');
        Match.model.findOne()
            .where('state').ne('draft')
            .where('kickOffTime').gt(moment().startOf('day'))
            .exec(function (err, match) {
                if (err) {
                    return handleError(err);
                }
                if (match) {
                    // Prints "Space Ghost is a talk show host."
                    console.log('Match is against: %s', match.opposition);
                    match.notifyAttendees(req, res, function (err) {
                        if (err) {
                            req.flash('error', 'There was an error sending the notifications, please check the logs for more info.');
                            console.error("===== Failed to send meetup notification emails =====");
                            console.error(err);
                        } else {
                            req.flash('success', 'Notification sent to ' + keystone.utils.plural('All Attendees'));//locals.nextMatch.rsvps.length, '* attendee'));
                        }
                        next();
                    });
                } else {
                    console.log('No match');
                    req.flash('error', 'There was no match to send notifications about, please check the logs for more info.');
                    next();
                }
            });
        // if (!locals.nextMatch) {
        //     console.log('no next match');
        //     req.flash('warning', 'There isn\'t a "next" match at the moment');
        //     return next();
        // } else {
        //     //console.log(JSON.stringify(locals.nextMatch[0]));
        //     console.log('notifying match recipients: '+locals.nextMatch[0].opponent);
        //     locals.nextMatch.notifyAttendees(req, res, function (err) {
        //         if (err) {
        //             req.flash('error', 'There was an error sending the notifications, please check the logs for more info.');
        //             console.error("===== Failed to send meetup notification emails =====");
        //             console.error(err);
        //         } else {
        //             req.flash('success', 'Notification sent to ' + keystone.utils.plural(locals.nextMatch.rsvps.length, '* attendee'));
        //         }
        //         next();
        //     });
        // }
    });


    // Notify all SydJS subscribers

    view.on('post', {action: 'notify.subscriber'}, function (next) {
        if (!locals.subscribers) {
            req.flash('warning', 'There aren\'t any subscribers at the moment');
            return next();
        } else {
            async.each(locals.subscribers, function (subscriber, doneSubscriber) {
                new keystone.Email('member-notification').send({
                    subscriber: subscriber,
                    subject: req.body.subscriber_email_subject || 'Notification from MIT Rugby',
                    content: req.body.subscriber_email_content,
                    link_label: req.body.subscriber_email_link_label,
                    link_url: req.body.subscriber_email_link_url,
                    to: subscriber.email,
                    from: {
                        name: 'MIT Rugby',
                        email: 'admin@rugby.mit.edu'
                    }
                }, doneSubscriber);
            }, function (err) {
                if (err) {
                    req.flash('error', 'There was an error sending the emails, please check the logs for more info.');
                    console.error("===== Failed to send subscriber emails =====");
                    console.error(err);
                } else {
                    req.flash('success', 'Email sent to ' + keystone.utils.plural(locals.subscribers.length, '* subscriber'));
                }
                next();
            });
        }
    });


    // Populate the RSVPs for counting

    view.on('render', function (next) {
        if (locals.nextMatch) {
            //locals.nextMeetup.populateRelated('rsvps', next);
            next();
        } else {
            next();
        }

    });

    view.render('tools/notification-center');

}
