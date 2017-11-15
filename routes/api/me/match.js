/**
 * Created by jdgaffney on 11/14/17.
 */
var keystone = require('keystone'),
    Attendance = keystone.list('Attendance');

exports = module.exports = function(req, res) {

    console.log("User ID is", req.user._id);
    console.log("The match is", req.body.data.match)

    Attendance.model.findOne()
        .where('who', req.user._id)
        .where('match', req.body.data.match)
        .exec(function(err, rsvp) {

            if (req.body.statusOnly) {
                console.log("==========statusOnly=============")

                return res.apiResponse({
                    success: true,
                    rsvped: rsvp ? true : false,
                    attending: rsvp && rsvp.attending ? true : false
                });

            } else {

                if (rsvp) {
                    console.log("==========rsvp=============");
                    console.log("req.body.attending", req.body);
                    rsvp.set({
                        attending: req.body.data.attending
                    }).save(function(err) {
                        if (err) return res.apiResponse({ success: false, err: err });
                        return res.apiResponse({ success: true, attending: req.body.data.attending });
                    });

                } else {
                    console.log("==========saving to rsvp model=============");
                    console.log("req.body.data", req.body.data);
                    new Attendance.model({
                        match: req.body.data.match,
                        who: req.user,
                        attending: req.body.data.attending
                    }).save(function(err) {
                        if (err) return res.apiResponse({ success: false, err: err });
                        return res.apiResponse({ success: true });
                    });

                }

            }

        });

}