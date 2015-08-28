
var dependencies = [
	'mailchimp',
	'ruffleWeb.landing',
	'ruffleWeb.reveal',
	'ruffleWeb.optout',
	'ruffleWeb.privacy',
	'ruffleWeb.terms',
	'ruffleWeb.media',
	'ui.router',
	'ng.deviceDetector'
];

angular.module('ruffleWeb', dependencies)
	.constant('API', {
		globalBlock: 'https://api.ruffle.us/inbox/global-block/',
		ruffleFromShort: 'https://api.ruffle.us/ruffle/'
	})
	.config(function($stateProvider, $urlRouterProvider, $locationProvider){

		//$locationProvider.html5Mode(true);

		$stateProvider
			.state('landing', {
				url: '/',
				templateUrl: 'app/landing/landing.html',
				controller: 'LandingCtrl'
			})
			.state('ruffle', {
				url: '/r/:ruffleId',
				templateUrl: 'app/reveal/reveal.html',
				controller: 'RevealCtrl'
			})
			.state('optout', {
				url: '/optout/:step',
				templateUrl: 'app/opt-out/optout.html',
				controller: 'OptoutCtrl'
			})
			.state('privacy', {
				url: '/privacy',
				templateUrl: 'app/privacy/privacy.html',
				controller: 'PrivacyCtrl'
			})
			.state('terms', {
				url: '/terms',
				templateUrl: 'app/terms/terms.html',
				controller: 'TermsCtrl'
			})
			.state('media', {
				url: '/media',
				templateUrl: 'app/media/media.html',
				controller: 'MediaCtrl'
			});;

		$urlRouterProvider.otherwise('/');
	})
	.controller('WebCtrl', function($scope){
	
	});
