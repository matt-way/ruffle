
var dependencies = [
	'ruffleWeb.landing',
	'ruffleWeb.optout',
	'ruffleWeb.privacy',
	'ruffleWeb.terms',
	'ruffleWeb.media',
	'ui.router'
];

angular.module('ruffleWeb', dependencies)
	.constant('API', {
		globalBlock: 'https://api.ruffle.us/inbox/global-block/'
	})
	.config(function($stateProvider, $urlRouterProvider, $locationProvider){

		//$locationProvider.html5Mode(true);

		$stateProvider
			.state('landing', {
				url: '/',
				templateUrl: 'app/landing/landing.html',
				controller: 'LandingCtrl'
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
