var keystone = require('keystone');

exports = module.exports = function(req, res) {

	var view = new keystone.View(req, res),
		locals = res.locals;

	locals.section = 'about';
	locals.page.title = 'MITRFC | About';

	locals.organisers = [
		{ name: 'John Fetchel', image: '/images/organisers/sharkie_400_round.png', twitter: 'twalve', title: 'President, MIT Rugby', profile: '/member/sharkie' },
		{ name: 'Zach Boswell', image: '/images/organisers/jedwatson_400_round.png', twitter: 'jedwatson', title: 'Vice President', profile: '/member/jed-watson' }
		]

	view.render('site/about');

}
