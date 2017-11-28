var _ = require('lodash');
var keystone = require('keystone');
var moment = require('moment');
var Types = keystone.Field.Types;

/**
 * Matches MatchReport
 * ===================
 */

var MatchReport = new keystone.List('MatchReport', {
    track: true,
    autokey: { path: 'key', from: 'title', unique: true }
});

MatchReport.add({

    match: { type: Types.Relationship, ref: 'Match', required: true, initial: true, index: true },
    state: { type: Types.Select, options: 'Win, Tied, Lost', initial: true, noedit: false },
    mitScore: { type: Number, required: true, initial: true, default: 0 },
    opponentScore: { type: Number, required: true, initial: true, default: 0 },
    manOfTheMatch: { type: String, intial: true },
    title: { type: String, initial: true },
    description: { type: Types.Html, wysiwyg: true },

    publishedDate: { type: Types.Date, index: true },

});

// Relationships
// ------------------------------
MatchReport.relationship({ ref: 'Match', refPath: 'matchreport', path: 'match' });

// Virtuals
// ------------------------------

MatchReport.schema.virtual('url').get(function() {
    return '/matchreports/' + this.key;
});

MatchReport.schema.set('toJSON', {
    transform: function(doc, rtn, options) {
        return _.pick(doc, '_id', 'match', 'state', 'mitScore', 'opponentScore', 'description', 'manOfTheMatch', 'description');
    }
});


/**
 * Registration
 * ============
 */

MatchReport.defaultSort = '-meetingTime';
MatchReport.defaultColumns = 'opponent, state|10%, meetingTime|15%, publishedDate|15%';
MatchReport.register();
