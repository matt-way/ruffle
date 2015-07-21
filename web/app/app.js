
var dependencies = [
	'mailchimp',
	'ruffleWeb.landing',
	'ruffleWeb.reveal',
	'ruffleWeb.outout',
	'ruffleWeb.privacy',
	'ruffleWeb.media',
	'ui.router',
	'ng.deviceDetector'
];

angular.module('ruffleWeb', dependencies)
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
			.state('media', {
				url: '/media',
				templateUrl: 'app/media/media.html',
				controller: 'MediaCtrl'
			});;

		$urlRouterProvider.otherwise('/');
	})
	.controller('WebCtrl', function($scope){
	
	});
