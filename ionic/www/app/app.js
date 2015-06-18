
angular.module('ruffle', ['ruffle.list', 'ruffle.reveal','ruffle.splash','ruffle.verify','ruffle.verify.pin', 'ruffle.confirm', 'ionic', 'ui.router', 'ruffle.cordova'])
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
			.state('verifyPin', {
				url: '/verify/pin',
				templateUrl: 'app/verify/verify-pin.html',
				controller: 'VerifyPinCtrl'
			})
			.state('confirm', {
				url: '/confirm',
				templateUrl: 'app/confirm/confirm.html',
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
