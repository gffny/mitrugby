var React = require('react');
var ReactDOM = require('react-dom');

/** Attendees */

var AttendingApp = require('../components/AttendingApp.js');
var attendingAppTarget = document.getElementById('react-match-button');
if (attendingAppTarget) {
	ReactDOM.render(<AttendingApp />, attendingAppTarget);
}