
var dependencies = [
	'mailchimp',
	'ruffleWeb.landing',
	// 'ruffleWeb.reveal',
	'ui.router',
	'ng.deviceDetector'
];

angular.module('ruffleWeb', dependencies)
	.config(function($stateProvider, $urlRouterProvider){

		$stateProvider
			.state('landing', {
				url: '/',
				templateUrl: 'app/landing/landing.html',
				controller: 'LandingCtrl'
			})
			// .state('ruffle', {
			// 	url: '/r/:ruffleId',
			// 	templateUrl: 'app/reveal/reveal.html',
			// 	controller: 'RevealCtrl'
			// })
			;

		$urlRouterProvider.otherwise('/');

	})
.controller('WebCtrl', function($scope){
	
});
