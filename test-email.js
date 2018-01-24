// test-email.js
var Email = require('keystone-email');

new Email('test-email.pug', {
    engine: 'jade',
    transport: 'mailgun',
}).send({}, {
    apiKey: 'key-5d319ab3b813948282371eb4cc2261e2',
    domain: 'sandboxa94a443f638540ee8d9e5dfc1625ee3f.mailgun.org',
    to: 'gaffney.ie@gmail.com',
    from: {
        name: 'Gaffney',
        email: 'gaffney.ie@gmail.com',
    },
    subject: 'Your first KeystoneJS email',
}, function (err, result) {
    if (err) {
        console.error('Mailgun test failed with error:\n', err);
    } else {
        console.log('Successfully sent Mailgun test with result:\n', result);
    }
});
