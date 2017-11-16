var _ = require('lodash');
var Store = require('store-prototype');
var request = require('superagent');

var AttendanceStore = new Store();

var loaded = false;
var busy = false;
var match = {};
var rsvp = {};
var attendees = [];

var REFRESH_INTERVAL = 5000; // 5 seconds

var refreshTimeout = null;
function cancelRefresh() {
	clearTimeout(refreshTimeout);
}

AttendanceStore.extend({

    getMatch: function() {
        return match;
    },

    getRSVP: function() {
		return rsvp;
	},

	getAttendees: function(callback) {
		return attendees;
	},

	rsvp: function(attending, type, callback) {
		if (busy) return;
		cancelRefresh();
		busy = true;
        AttendanceStore.notifyChange();
		request
			.post('/api/me/match')
			.send({ data: {
                match: MITRugby.currentMatchId,
				attending: attending,
                attendingType: type
			}})
			.end(function(err, res) {
				if (err) {
					console.log('Error with the AJAX request: ', err)
					return;
				}
                AttendanceStore.getMatchData();
			});
	},

	isLoaded: function() {
		return loaded;
	},

	isBusy: function() {
		return busy;
	},

    getMatchData: function(callback) {
        // ensure any scheduled refresh is stopped,
        // in case this was called directly
        cancelRefresh();
        // request the update from the API
        busy = true;
        request
            .get('/api/match/' + MITRugby.currentMatchId) // + currentMatchId)
            .end(function(err, res) {
                if (err) {
                    console.log('Error with the AJAX request: ', err)
                }
                busy = false;
                if (!err && res.body) {
                    loaded = true;
                    match = res.body.match;
                    rsvp = res.body.rsvp;
                    attendees = res.body.attendees;
                    AttendanceStore.notifyChange();
                }
                AttendanceStore.queueMatchRefresh();
                return callback && callback(err, res.body);
            });
    },

    queueMatchRefresh: function() {
        refreshTimeout = setTimeout(AttendanceStore.getMatchData, REFRESH_INTERVAL);
    }

});

AttendanceStore.getMatchData();
module.exports = AttendanceStore;
