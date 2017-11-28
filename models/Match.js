var _ = require('lodash');
var keystone = require('keystone');
var moment = require('moment');
var Types = keystone.Field.Types;

/**
 * Matches Model
 * =============
 */

var Match = new keystone.List('Match', {
    track: true,
    autokey: { path: 'key', from: 'opponent kickOffTime', unique: true }
});

Match.add({

    opponent: { type: String, required: true, initial: true },
    publishedDate: { type: Types.Date, index: true, format: 'yyyy-MM-dd HH:mm' },
    state: { type: Types.Select, options: 'draft, scheduled, active, past', noedit: true },
    gameLocationType: { type: Types.Select, options: 'Home, Away, Tournament, Other', default: 'Home', noedit: false, initial: true },

    kickOffTime: { type: Types.Datetime, default: Date.now, required: true, initial: true, index: true, width: 'short', note: 'e.g. 2014-07-15 / 6:00' },
    meetingTime: { type: Types.Datetime, default: Date.now, required: true, initial: true, index: true, width: 'short', note: 'e.g. 2014-07-15 / 6:00' },

    homeField: { type: Types.Select, options: 'Briggs Field, Roberts Field', dependsOn: { gameLocationType: 'Home' }, noedit: false, initial: true },
    awayFieldAddress: { type: String, required: false, noedit: false, dependsOn: { gameLocationType: [ 'Away', 'Tournament', 'Other' ] }, initial: true },

    meetingPlaceName: { type: Types.Select, options: 'Kresge Auditorium, Other', required: false, noedit: false, dependsOn: { gameLocationType: [ 'Away', 'Tournament', 'Other' ] }, initial: true },
    meetingPlaceAddress: { type: String, required: false, noedit: false, dependsOn: { meetingPlaceName: 'Other' }, initial: true, default: '48 Massachusetts Ave, Cambridge, MA 02139', note: 'Kresge Auditorium is at 48 Massachusetts Ave, Cambridge, MA 02139' },

    description: { type: Types.Html, wysiwyg: true, initial: true }

});

// Relationships
// ------------------------------

Match.relationship({ ref: 'Attendance', refPath: 'match', path: 'attendances' });
Match.relationship({ ref: 'MatchReport', refPath: 'match', path: 'matches' });


// Virtuals
// ------------------------------

Match.schema.virtual('url').get(function() {
    return '/matches/' + this.id;
});

Match.schema.virtual('remainingRSVPs').get(function() {
    if (!this.maxRSVPs) return -1;
    return Math.max(this.maxRSVPs - (this.totalRSVPs || 0), 0);
});

Match.schema.virtual('rsvpsAvailable').get(function() {
    console.log('there are RSVPs available');
    return true; //(this.remainingRSVPs > 0);
});

// Pre Save
// ------------------------------

Match.schema.pre('save', function(next) {
    var match = this;
    // no published date, it's a draft match
    if (!match.publishedDate) {
        match.state = 'draft';
    }
    // match date plus one day is after today, it's a past match
    else if (moment().isAfter(moment(match.kickOffTime).add('day', 1))) {
        match.state = 'past';
    }
    // publish date is after today, it's an active match
    else if (moment().isAfter(match.publishedDate)) {
        match.state = 'active';
    }
    // publish date is before today, it's a scheduled match
    else if (moment().isBefore(moment(match.publishedDate))) {
        match.state = 'scheduled';
    }
    next();
});

// Methods
// ------------------------------

Match.schema.methods.refreshRSVPs = function(callback) {
    var match = this;
    keystone.list('Attendance').model.count()
        .where('match').in([match.id])
        .where('attending', true)
        .exec(function(err, count) {
            if (err) return callback(err);
            match.totalRSVPs = count;
            match.save(callback);
        });
}

Match.schema.methods.notifyAttendees = function(req, res, next) {
    var match = this;
    keystone.list('User').model.find().where('notifications.matches', true).exec(function(err, attendees) {
        if (err) return next(err);
        if (!attendees.length) {
            next();
        } else {
            attendees.forEach(function(attendee) {
                new keystone.Email('new-match').send({
                    attendee: attendee,
                    match: match,
                    subject: 'New match vs: ' + match.opponent,
                    to: attendee.email,
                    from: {
                        name: 'MIT Rugby',
                        email: 'mitrugby@gmail.com.com'
                    }
                }, next);
            });
        }
    });
}

Match.schema.set('toJSON', {
    transform: function(doc, rtn, options) {
        return _.pick(doc, '_id', 'opponent', 'meetingTime', 'gameLocationType');
    }
});


/**
 * Registration
 * ============
 */

Match.defaultSort = '-meetingTime';
Match.defaultColumns = 'opponent, state|10%, meetingTime|15%, publishedDate|15%';
Match.register();
