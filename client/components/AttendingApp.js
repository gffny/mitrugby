var React = require('react');
var request = require('superagent');
var AttendanceStore = require('../stores/AttendanceStore');

var AttendingApp = React.createClass({

	getInitialState: function() {
		return {
            user: MITRugby.user,
            isBusy: false,
			isReady: AttendanceStore.isLoaded(),
            match: AttendanceStore.getMatch(),
            rsvp: AttendanceStore.getRSVP(),
            attendees: AttendanceStore.getAttendees()
        };
	},

	componentDidMount: function() {
        AttendanceStore.addChangeListener(this.updateStateFromStore);
	},

	componentWillUnmount: function() {
        AttendanceStore.removeChangeListener(this.updateStateFromStore);
	},

	updateStateFromStore: function() {
		this.setState({
			isReady: AttendanceStore.isLoaded(),
			attendees: AttendanceStore.getAttendees(),
            rsvp: AttendanceStore.getRSVP(),
            match: AttendanceStore.getMatch(),
		});
	},

    toggleRSVP: function(attending, type) {
        AttendanceStore.rsvp(attending, type);
    },

    renderLoading: function() {
        return (
            <div className="hero-button">
                <div className="alert alert-success mb-0 text-center">loading...</div>
            </div>
        );
    },

    renderBusy: function() {
        return (
            <div className="hero-button">
                <div className="alert alert-success mb-0 text-center">hold on...</div>
            </div>
        );
    },

    renderRSVPButton: function() {
	    if(this.state.match.gameLocationType == 'Home') {
            return (
                <div className="hero-button" onClick={this.toggleRSVP.bind(this, true, 'attending')}>
                    <a className="btn btn-primary btn-lg btn-block">
                        RSVP Now
                    </a>
                </div>
            );
        } else {
            return (
                <div className="hero-button" onClick={this.toggleRSVP.bind(this, true, 'attending-need-lift')}>
                    <a className="btn btn-primary btn-lg btn-block">
                        RSVP Now
                    </a>
                </div>
            );
        }
    },

    renderRSVPToggle: function() {
        if(this.state.match.gameLocationType == 'Home') {
            var attending = this.state.rsvp.attending && this.state.rsvp.attendingType == 'attending' ? ' btn-success btn-default active' : null;
            var notAttending = this.state.rsvp.attending ? null : ' btn-danger btn-default active';
            return (
                <div>
                    <div className="hero-button">
                        <div id="next-match" data-id={this.state.match._id} className="form-row match-toggle">
                            <div className="col-attending-btn">
                                <button type="button" onClick={this.toggleRSVP.bind(this, true, 'attending')}
                                        className={"btn btn-lg btn-block btn-default js-rsvp-attending " + attending}>
                                    <span>Attending</span>
                                </button>
                            </div>
                            <div className="col-attending-btn">
                                <button type="button" onClick={this.toggleRSVP.bind(this, false, '')}
                                        className={"btn btn-lg btn-block btn-default btn-decline js-rsvp-decline " + notAttending}>
                                    Not Attending
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            var attendingOfferLift = this.state.rsvp.attending && this.state.rsvp.attendingType == 'attending-offer-lift' ? ' btn-success btn-default active' : null;
            var attendingNeedLift = this.state.rsvp.attending && this.state.rsvp.attendingType == 'attending-need-lift' ? ' btn-success btn-default active' : null;
            var attendingOwnWay = this.state.rsvp.attending && this.state.rsvp.attendingType == 'attending-own-way' ? ' btn-success btn-default active' : null;
            var notAttending = this.state.rsvp.attending ? null : ' btn-danger btn-default active';
            return (
                <div>
                    <div className="hero-button">
                        <div id="next-match" data-id={this.state.match._id} className="form-row match-toggle">
                            <div className="col-attending-btn">
                                <button type="button" onClick={this.toggleRSVP.bind(this, true, 'attending-offer-lift')}
                                        className={"btn btn-lg btn-block btn-default js-rsvp-attending-offer-lift " + attendingOfferLift}>
                                    <span>Attending</span><span className="btn-sub">(Offering Lift)</span>
                                </button>
                            </div>
                            <div className="col-attending-btn">
                                <button type="button" onClick={this.toggleRSVP.bind(this, true, 'attending-need-lift')}
                                        className={"btn btn-lg btn-block btn-default js-rsvp-attending-need-lift " + attendingNeedLift}>
                                    <span>Attending</span><span className="btn-sub">(Need Lift)</span>
                                </button>
                            </div>
                            <div className="col-attending-btn">
                                <button type="button" onClick={this.toggleRSVP.bind(this, true, 'attending-own-way')}
                                        className={"btn btn-lg btn-block btn-default js-rsvp-attending-own-way " + attendingOwnWay}>
                                    <span>Attending</span><span className="btn-sub">Making My Own Way</span>
                                </button>
                            </div>
                            <div className="col-attending-btn">
                                <button type="button" onClick={this.toggleRSVP.bind(this, false, '')}
                                        className={"btn btn-lg btn-block btn-default btn-decline js-rsvp-decline " + notAttending}>
                                    Not Attending
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    },

    // MAKESHIFT WAY TO EXPOSE JQUERY AUTH LOGIC TO REACT
    signinModalTrigger: function (e) {
        e.preventDefault;
        window.signinModalTrigger(e);
    },

    renderRSVPSignin: function() {
        return (
            <div className="hero-button">
                <a className="btn btn-primary btn-lg btn-block js-auth-trigger" onClick={this.signinModalTrigger}>RSVP Now</a>
            </div>
        );
    },

    renderNoMoreTickets: function() {
        return (
            <div className="hero-button">
                <div className="alert alert-success mb-0 text-center">No more tickets...</div>
            </div>
        );
    },

    render: function() {

        if (!this.state.isReady) {
            return this.renderLoading();
        }
        if (this.state.isBusy) {
            return this.renderBusy();
        }

        var hasUser = !!this.state.user;
        var isRsvpOpen = true;
        var hasRsvped = this.state.rsvp.exists;
        var isAttending = this.state.rsvp.attending;

        if (!isRsvpOpen) {
            return hasUser && isAttending ? this.renderRSVPToggle() : this.renderNoMoreTickets();
        } else if (hasUser) {
            return hasRsvped ? this.renderRSVPToggle() : this.renderRSVPButton();
        } else {
            return this.renderRSVPSignin();
        }
    }

});

module.exports = AttendingApp;
