
angular.module('ruffle', ['ruffle.list', 'ruffle.reveal', 'ionic', 'ui.router', 'ruffle.cordova'])
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
			});

		$urlRouterProvider.otherwise('/list');
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
