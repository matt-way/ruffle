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
		API: 'http://192.168.1.158:3000'
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
	.service('Config', function(DB){

		var configKey = 'master';
		var configDB = DB.createDBType('config');
		var config;
		
		function init(values){
			config = values;
		}

		function updateValues(obj){

			angular.extend(config, obj);
			if(!config._id){
				config._id = configKey;	
			}			
			return configDB.put(config);
		}

		// perform the initial load
		var loaded = configDB.get(configKey).then(init, function(err){
			config = {};
		});

		return {
			values: function(){ return config; },
			update: updateValues,
			loaded: loaded
		};
	})
	// inject and init any services that need to run on start
	.service('Init', function($q, Config, Ads){

		//var loaded = $q.defer();

		// load any required config
		// verified user info
		var loaded = Config.loaded;

		// if not verified, load potential country of origin
		// (with a short response delay in case of error)

		// if verified, initialise the list service

		// precache any necessary images

		//loaded.resolve();

		return {
			done: function(){ return loaded; }
		};
	})
	// inject the init service which will auto load any init config
	.run(function($rootScope, $ionicPlatform, $timeout, $state, Init, Config){

		// perform initialisation, and then select the appropriate initial route
		Init.done().then(function(){
			// go to the correct state based on whether or not the user is verified
			var config = Config.values();
			if(config.inboxId && config.token){
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
					}, 300)					
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
