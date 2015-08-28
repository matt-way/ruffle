// primary ruffle app entry

var dependencies = [
	'ionic',
	'ngResource',
	'ui.router',
	'angular-svg-round-progress',
	'ruffle.common',
	'ruffle.analytics',
	'ruffle.db',
	'ruffle.config',
	'ruffle.auth',
	'ruffle.phone',
	'ruffle.cordova',
	'ruffle.api',
	'ruffle.images',
	'ruffle.verify', 
	'ruffle.ruffle',
	'ruffle.list', 
	'ruffle.reveal',
	'ruffle.create',
	'ruffle.confirm',
	'ruffle.ads',
	'ruffle.eula',
	'ruffle.branch'
];

angular.module('ruffle', dependencies)
	.constant('Globals', {
		API: 'http://api.ruffle.us',
		minConfigVersion: 1,
		platforms: {
			android: 'android',
			ios: 'ios'
		}
	})
	.config(function($stateProvider, $urlRouterProvider, $provide){

		// state definition
		// NOTE: no default route is provided as we don't know
		// which route we want to start from until checking config
		$stateProvider
			.state('list', {
				url: '/list',
				templateUrl: 'app/list/list.html',
				controller: 'ListCtrl',
				onEnter: function(Analytics){
					Analytics.trackView('List');
				}
			})
			.state('reveal', {
				url: '/reveal/:picId',
				templateUrl: 'app/reveal/reveal.html',
				controller: 'RevealCtrl',
				onEnter: function(Analytics){
					Analytics.trackView('Reveal');
				}
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
				},
				onEnter: function(Analytics){
					Analytics.trackView('Verify - Number');
				}
			})
			.state('verifyPin', {
				url: '/verify/pin',
				templateUrl: 'app/verify/verify-pin.html',
				controller: 'VerifyPinCtrl',
				onEnter: function(Analytics){
					Analytics.trackView('Verify - Pin');
				}
			})
			.state('confirm', {
				url: '/confirm',
				templateUrl: 'app/create/confirm.html',
				controller: 'ConfirmCtrl',
				onEnter: function(Analytics){
					Analytics.trackView('Confirm');
				}
			});

		// fix ionics weird $location hash scrolling decorator
		// NOTE: basically ionic (likely a bug) attempt to scroll to hash changes
		// although this occurs to any ui-router .url() call with a blank default.
		// Ionic then checks for definededness, resulting in true to '' params.
		$provide.decorator('$location', function($delegate){
			$delegate.hash = $delegate.__hash;
			return $delegate;
		});
	})	
	// inject and init any services that need to run on start
	.service('Init', function($q, Config, LocalConfig, Auth, Push){

		// add any load enforced prerequisites here
		// NOTE: we don't want to block here for internet based
		// responses, as then the user cannot use the app offline
		var loaded = Auth.loading;

		return {
			done: function(){ return loaded; }
		};
	})
	// inject the init service which will auto load any init config
	.run(function($rootScope, $ionicPlatform, $ionicConfig, $timeout, $state, Init, Auth, Analytics){

		// turn off ios back swipe gesture
		$ionicConfig.views.swipeBackEnabled(false);

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

					// track load event
					Analytics.trackEvent('App', 'Load');
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
