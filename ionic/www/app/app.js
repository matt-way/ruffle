// primary ruffle app entry

var dependencies = [
	'ionic',
	'ngResource',
	'ui.router',
	'ruffle.common',
	'ruffle.db',
	'ruffle.phone',
	'ruffle.cordova',
	'ruffle.api',
	'ruffle.imageLoader',
	'ruffle.splash',
	'ruffle.verify', 
	'ruffle.list', 
	'ruffle.reveal',
	'ruffle.create',
	'ruffle.confirm'
];

angular.module('ruffle', dependencies)
	.constant('Globals', {
		API: 'http://localhost:3000'
	})
	.config(function($stateProvider, $urlRouterProvider){

		$stateProvider
			.state('list', {
				url: '/list',
				templateUrl: 'app/list/list.html',
				controller: 'ListCtrl'
			})
			.state('reveal', {
				url: '/reveal/:picId',
				templateUrl: 'app/reveal/reveal.html',
				controller: 'RevealCtrl'
			})
			.state('splash', {
				url: '/splash',
				templateUrl: 'app/splash/splash.html',
				controller: 'FirstScreenCtrl'
			})
			.state('verify', {
				url: '/verify',
				templateUrl: 'app/verify/verify.html',
				controller: 'VerifyCtrl'
			})
			.state('confirm', {
				url: '/confirm',
				templateUrl: 'app/create/confirm.html',
				controller: 'ConfirmCtrl'
			});

		$urlRouterProvider.otherwise('/splash');
	})
/*
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
	alert('ready!');
	// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
	// for form inputs)
	if(window.cordova && window.cordova.plugins.Keyboard) {
	  cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
	}
	if(window.StatusBar) {
	  StatusBar.styleDefault();
	}
  });
})
*/
.controller('AppCtrl', function($scope){

});
