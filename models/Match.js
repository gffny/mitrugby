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
    autokey: { path: 'key', from: 'keygenfunc', unique: true }
});

Match.add({

    name: { type: String, required: false, initial: false, noedit: true },
    opponent: { type: String, required: true, initial: true },
    publishedDate: { type: Types.Date, index: true, format: 'yyyy-MM-dd HH:mm' },
    state: { type: String, noedit: true },
    gameLocationType: { type: Types.Select, options: 'Home, Away, Tournament, Other', default: 'Home', noedit: false, initial: true },

    kickOffTime: { type: Types.Datetime, default: Date.now, required: true, initial: true, index: true, width: 'short', note: 'e.g. 2014-07-15 / 6:00' },
    meetingTime: { type: Types.Datetime, default: Date.now, required: true, initial: true, index: true, width: 'short', note: 'e.g. 2014-07-15 / 6:00' },

    homeField: { type: Types.Select, options: 'Briggs Field, Roberts Field', dependsOn: { gameLocationType: 'Home' }, noedit: false, initial: true, required: true },
    awayFieldAddress: { type: String, required: true, noedit: false, dependsOn: { gameLocationType: [ 'Away', 'Tournament', 'Other' ] }, initial: true },

    meetingPlaceName: { type: Types.Select, options: 'Kresge Auditorium, Other', required: true, noedit: false, dependsOn: { gameLocationType: [ 'Away', 'Tournament', 'Other' ] }, initial: true },
    meetingPlaceAddress: { type: String, required: true, noedit: false, dependsOn: { meetingPlaceName: 'Other' }, initial: true, default: '48 Massachusetts Ave, Cambridge, MA 02139', note: 'Kresge Auditorium is at 48 Massachusetts Ave, Cambridge, MA 02139' },

    description: { type: Types.Html, wysiwyg: true, initial: true },

    // Denormalising Match Report into Match model since it's a 1:1 relationship
    result: { type: Types.Select, options: 'Win, Tied, Lost', initial: false, noedit: false },
    mitScore: { type: Number, required: false, initial: false, default: 0 },
    opponentScore: { type: Number, required: false, initial: false, default: 0 },
    manOfTheMatch: { type: String, initial: false },
    reportTitle: { type: String, initial: false },
    reportDetail: { type: Types.Html, wysiwyg: true },

});

// Relationships
// ------------------------------

Match.relationship({ ref: 'Attendance', refPath: 'match', path: 'attendances' });

// Virtuals
// ------------------------------

Match.schema.virtual('url').get(function() {
    return '/matches/' + this.id;
});

// added a function called keygenfunc to override the key to use a formatted date rather than a datetime
Match.schema.virtual('keygenfunc').get(function() {
    return 'vs '+ this.opponent + ' on ' + moment(this.kickOffTime).format('YY-MM-DD');
});

Match.schema.virtual('remainingRSVPs').get(function() {
    if (!this.maxRSVPs) return -1;
    return Math.max(this.maxRSVPs - (this.totalRSVPs || 0), 0);
});

Match.schema.virtual('rsvpsAvailable').get(function() {
    console.log('there are RSVPs available');
    return true; //(this.remainingRSVPs > 0);
});

Match.schema.virtual('isPast').get(function() {
    return moment().isAfter(moment(this.kickOffTime).add(1, 'day'))
});

Match.schema.virtual('hasReport').get(function() {
    return reportDetail;
});

// Pre Save
// ------------------------------

Match.schema.pre('save', function(next) {
    var match = this;
    match.name = moment(this.kickOffTime).format('YYYY-MMM-DD') + ' vs '+ this.opponent;
    // no published date, it's a draft match
    if (!match.publishedDate) {
        match.state = 'draft';
    }
    // otherwise it's active; logic in the template will dictate if something is shown
    else {
        match.state = 'active';
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
        return _.pick(doc, '_id', 'opponent', 'meetingTime', 'gameLocationType', 'isPast');
    }
});

/**
 * Registration
 * ============
 */

Match.defaultSort = '-meetingTime';
Match.defaultColumns = 'id, name, opponent, state|10%, meetingTime|15%, publishedDate|15%';
Match.register();
