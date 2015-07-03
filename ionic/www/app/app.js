// primary ruffle app entry

var dependencies = [
	'ionic',
	'ngResource',
	'ui.router',
	'angular-svg-round-progress',
	'ruffle.common',
	'ruffle.db',
	'ruffle.config',
	'ruffle.auth',
	'ruffle.phone',
	'ruffle.cordova',
	'ruffle.api',
	'ruffle.images',
	'ruffle.splash',
	'ruffle.verify', 
	'ruffle.list', 
	'ruffle.reveal',
	'ruffle.create',
	'ruffle.confirm',
	'ruffle.ads'
];

angular.module('ruffle', dependencies)
	.constant('Globals', {
		API: 'http://192.168.1.59:3000',
		minConfigVersion: 1,
		platforms: {
			android: 'android',
			ios: 'ios'
		}
	})
	.config(function($stateProvider, $urlRouterProvider){

		// state definition
		// NOTE: no default route is provided as we don't know
		// which route we want to start from until checking config
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
				controller: 'VerifyCtrl',
				resolve: {
					defaultCountry: function($q, Geo){
						// ensure promise resolves
						var deferred = $q.defer();
						Geo.approxCountry().then(function(country){
							deferred.resolve(country);
						}, function(err){
							deferred.resolve(null);
						});
						return deferred.promise;
					}
				}
			})
			.state('verifyPin', {
				url: '/verify/pin',
				templateUrl: 'app/verify/verify-pin.html',
				controller: 'VerifyPinCtrl'
			})
			.state('confirm', {
				url: '/confirm',
				templateUrl: 'app/create/confirm.html',
				controller: 'ConfirmCtrl'
			});
	})	
	// inject and init any services that need to run on start
	.service('Init', function($q, Config, Auth, Push){

		// add any load enforced prerequisites here
		// NOTE: we don't want to block here for internet based
		// responses, as then the user cannot use the app offline
		var loaded = Auth.loading;

		return {
			done: function(){ return loaded; }
		};
	})
	// inject the init service which will auto load any init config
	.run(function($rootScope, $ionicPlatform, $timeout, $state, Init, Auth){

		// perform initialisation, and then select the appropriate initial route
		Init.done().finally(function(){
			// go to the correct state based on whether or not the user is verified
			if(Auth.checkVerified()){
				$state.go('list');
			}else{
				$state.go('verify');
			}	
		});		
		
		// wait for the inital route to load
		$rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
			if(fromState.name === ''){ 
				$ionicPlatform.ready().then(function(){
					// delay the splashscreen hiding to give the view a brief moment to complete rendering
					$timeout(function(){
						navigator.splashscreen.hide();	
					}, 300);			
				});
			}
		});

		/*
		// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
		// for form inputs)
		if(window.cordova && window.cordova.plugins.Keyboard) {
		  cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		if(window.StatusBar) {
		  StatusBar.styleDefault();
		}
		*/
	})
	.controller('AppCtrl', function($scope){
		// parent controller under $rootScope
	});
