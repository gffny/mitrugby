var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Attenance Model
 * ===========
 */

var Attendance = new keystone.List('Attendance');

Attendance.add({
	match: { type: Types.Relationship, ref: 'Match', required: true, initial: true, index: true },
	who: { type: Types.Relationship, ref: 'User', required: true, initial: true, index: true },
    attending: { type: Types.Boolean, index: true },
    gettingThere: { type: Types.Select, options: 'Need Lift, Driving (have space), Driving (no space)', noedit: false},
    attending: { type: Types.Boolean, index: true },
	createdAt: { type: Date, noedit: true, collapse: true, default: Date.now },
	changedAt: { type: Date, noedit: true, collapse: true }
});


/**
 * Hooks
 * =====
 */

Attendance.schema.pre('save', function(next) {
	if (!this.isModified('changedAt')) {
		this.changedAt = Date.now();
	}
	next();
});

Attendance.schema.post('save', function() {
	keystone.list('Match').model.findById(this.match, function(err, match) {
		if (match) match.refreshRSVPs();
	});
});

Attendance.schema.post('remove', function() {
	keystone.list('Match').model.findById(this.match, function(err, match) {
		if (match) match.refreshRSVPs();
	});
})


/**
 * Registration
 * ============
 */

Attendance.defaultColumns = 'match, who, createdAt';
Attendance.defaultSort = '-createdAt';
Attendance.register();