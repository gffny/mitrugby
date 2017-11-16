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
    autokey: { path: 'key', from: 'opponent', unique: true }
});

Match.add({
    opponent: { type: String, required: true, initial: true },
    publishedDate: { type: Types.Date, index: true },

    state: { type: Types.Select, options: 'draft, scheduled, active, past', noedit: true },

    kickOffTime: { type: Types.Datetime, required: true, initial: true, index: true, width: 'short', note: 'e.g. 2014-07-15 / 6:00:00 pm' },
    meetingTime: { type: Types.Datetime, required: true, initial: true, index: true, width: 'short', note: 'e.g. 2014-07-15 / 6:00:00 pm' },

    location: { type: Types.Select, options: 'Home Game @ Roberts, Home Game @ Briggs, Away Game', noedit: false, initial: true},
    fieldAddress: { type: String, required: false, noedit: false, default: '250 Vassar St, Cambridge, MA 02139', note: 'Briggs is 250 Vassar St, Cambridge, MA 02139 and Roberts is 170 Vassar St, Cambridge, MA 02139' },

    description: { type: Types.Html, wysiwyg: true }

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
    else if (moment().isAfter(moment(match.startDate).add('day', 1))) {
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
        return _.pick(doc, '_id', 'opponent', 'meetingTime', 'location', 'map', 'description', 'totalRSVPs');
    }
});


/**
 * Registration
 * ============
 */

Match.defaultSort = '-meetingTime';
Match.defaultColumns = 'opponent, state|10%, meetingTime|15%, publishedDate|15%';
Match.register();
