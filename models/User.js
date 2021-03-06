var async = require('async');
var crypto = require('crypto');
var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Users Model
 * ===========
 */

var User = new keystone.List('User', {
	track: true,
	autokey: { path: 'key', from: 'name', unique: true }
});

var deps = {
	facebook: { 'services.facebook.isConfigured': true },
	google: { 'services.google.isConfigured': true },
	twitter: { 'services.twitter.isConfigured': true }
}

User.add({
	name: { type: Types.Name, required: true, index: true },
	email: { type: Types.Email, initial: true, index: true },
	password: { type: Types.Password, initial: true },
	resetPasswordKey: { type: String, hidden: true }
}, 'Position', {
    primaryPosition: { type: Types.Select, options: 'Loose-Head Prop, Hooker, Tight-Head Prop, Second-Row, Blind-Side Flanker, Open-Side Flanker, Number 8, Scrum-Half, Out-Half, Inside-Centre, Outside-Centre, Wing, Fullback', ref: 'Organisation' },
    alsoPlaysLooseHeadProp: { type: Boolean, default: false },
    alsoPlaysHooker: { type: Boolean, default: false },
    alsoPlaysTightHeadProp: { type: Boolean, default: false },
    alsoPlaysSecondRow: { type: Boolean, default: false },
    alsoPlaysBlindSideFlanker: { type: Boolean, default: false },
    alsoPlaysOpenSideFlanker: { type: Boolean, default: false },
    alsoPlaysNumberEight: { type: Boolean, default: false },
    alsoPlaysScrumHalf: { type: Boolean, default: false },
    alsoPlaysOutHalf: { type: Boolean, default: false },
    alsoPlaysInsideCentre: { type: Boolean, default: false },
    alsoPlaysOutsideCentre: { type: Boolean, default: false },
    alsoPlaysWing: { type: Boolean, default: false },
    alsoPlaysFullBack: { type: Boolean, default: false },
}, 'Profile', {
    isPublic: { type: Boolean, default: true },
    userType: { type: Types.Select, options: 'CURRENT/ACTIVE PLAYER, ALUMNI, COACH, FRIEND, OTHER', default: true },
    photo: { type: Types.CloudinaryImage },
	twitter: { type: String, width: 'short' },
	bio: { type: Types.Markdown },
	gravatar: { type: String, noedit: true }
}, 'Notifications', {
	notifications: {
		posts: { type: Boolean },
		matches: { type: Boolean, default: true }
	}
}, 'Permissions', {
	isAdmin: { type: Boolean, label: 'Can Admin MIT Rugby' },
	isVerified: { type: Boolean, label: 'Has a verified email address' }
}, 'Services', {
	services: {
		facebook: {
			isConfigured: { type: Boolean, label: 'Facebook has been authenticated' },

			profileId: { type: String, label: 'Profile ID', dependsOn: deps.facebook },

			username: { type: String, label: 'Username', dependsOn: deps.facebook },
			avatar: { type: String, label: 'Image', dependsOn: deps.facebook },

			accessToken: { type: String, label: 'Access Token', dependsOn: deps.facebook },
			refreshToken: { type: String, label: 'Refresh Token', dependsOn: deps.facebook }
		},
		google: {
			isConfigured: { type: Boolean, label: 'Google has been authenticated' },

			profileId: { type: String, label: 'Profile ID', dependsOn: deps.google },

			username: { type: String, label: 'Username', dependsOn: deps.google },
			avatar: { type: String, label: 'Image', dependsOn: deps.google },

			accessToken: { type: String, label: 'Access Token', dependsOn: deps.google },
			refreshToken: { type: String, label: 'Refresh Token', dependsOn: deps.google }
		},
		twitter: {
			isConfigured: { type: Boolean, label: 'Twitter has been authenticated' },

			profileId: { type: String, label: 'Profile ID', dependsOn: deps.twitter },

			username: { type: String, label: 'Username', dependsOn: deps.twitter },
			avatar: { type: String, label: 'Image', dependsOn: deps.twitter },

			accessToken: { type: String, label: 'Access Token', dependsOn: deps.twitter },
			refreshToken: { type: String, label: 'Refresh Token', dependsOn: deps.twitter }
		}
	}
}, 'Meta', {
	lastRSVP: { type: Date, noedit: true }
});


/**
	Pre-save
	=============
*/

User.schema.pre('save', function(next) {
	var member = this;
	async.parallel([
		function(done) {
			if (!member.email) {
			    return done();
            }
			member.gravatar = crypto.createHash('md5').update(member.email.toLowerCase().trim()).digest('hex');

			return done();
		}
	], next);
});


/**
	Relationships
	=============
*/

User.relationship({ ref: 'Attendance', refPath: 'who', path: 'rsvps' });


/**
 * Virtuals
 * ========
 */

// Link to member
User.schema.virtual('url').get(function() {
	return '/member/' + this.key;
});

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function() {
	return this.isAdmin;
});

// Pull out avatar image
User.schema.virtual('avatarUrl').get(function() {
	if (this.photo.exists) return this._.photo.thumbnail(120,120);
	if (this.services.facebook.isConfigured && this.services.facebook.avatar) return this.services.facebook.avatar;
	if (this.services.google.isConfigured && this.services.google.avatar) return this.services.google.avatar;
	if (this.services.twitter.isConfigured && this.services.twitter.avatar) return this.services.twitter.avatar;
	if (this.gravatar) return 'https://www.gravatar.com/avatar/' + this.gravatar + '?d=https%3A%2F%2Fsydjs.com%2Fimages%2Favatar.png&r=pg';
});

// Usernames
User.schema.virtual('twitterUsername').get(function() {
	return (this.services.twitter && this.services.twitter.isConfigured) ? this.services.twitter.username : '';
});


/**
 * Methods
 * =======
*/

User.schema.methods.resetPassword = function(callback) {
	var user = this;
	user.resetPasswordKey = keystone.utils.randomString([16,24]);
	user.save(function(err) {
		if (err) return callback(err);
		new keystone.Email('forgotten-password').send({
			user: user,
			link: '/reset-password/' + user.resetPasswordKey,
			subject: 'Reset your MIT Rugby Password',
			to: user.email,
			from: {
				name: 'MIT Rugby',
				email: 'admin@rugby.mit.edu'
			}
		}, callback);
	});
}


/**
 * Registration
 * ============
*/

User.defaultColumns = 'name, email, twitter, isAdmin';
User.register();
