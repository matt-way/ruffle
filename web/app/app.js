
var dependencies = [
	'mailchimp',
	'ruffleWeb.landing',
	'ruffleWeb.reveal',
	'ruffleWeb.outout',
	'ui.router',
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
				url: '/optout',
				templateUrl: 'app/opt-out/optout.html',
				controller: 'OptoutCtrl'
			});

		$urlRouterProvider.otherwise('/');
	})
	.controller('WebCtrl', function($scope){
	
	});
