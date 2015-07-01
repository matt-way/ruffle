
angular.module('ruffle.cordova.push', [])
	.constant('ConstPush', {
		dbType: 'config',
		dbKey: 'push',
		retryPeriod: 30000 // 30 seconds
	})
	.service('Push', function(Globals, ConstPush, Config, Verify,
		$window, $q, $ionicPlatform){

		var push = {};
		var config = Config.getValues();
		var pushConfig = DB.createDBType(ConstPush.dbType);

		// initialise once config and verification available
		$ionicPlatform.ready().then(function(){
			$q.all([Config.loaded, Auth.verified]).then(init); 
		});
		
		// initialise the service
		function init(){
			// get stored push details if any, and register once complete
			pushConfig.get(ConstPush.dbKey).then(function(values){
				angular.extend(push, values);
			}).finally(register);
		}

		// wrap service registration in a promise
		function serviceRegistration(details){
			var deferred = $q.defer();
			$window.plugins.pushNotification.register(deferred.resolve, deferred.reject, details);
			return deferred.promise;
		}

		// register the client to the push service
		function register(){
			var details;
			if(ionic.Platform.isAndroid()){
				// Android
				details = {
					senderID: config.pushAndroidId,
					ecb: 'angular.element(document.querySelector(\'[ng-app]\')).injector().get(\'Push\').notificationAndroid'
				};
				QTools.timerRetry(function(){
					serviceRegistration(details);
				}, PushConfig.retryPeriod);			
			}else{
				// IOS
				details = {
					badge: 'false',
					sound: 'false',
					alert: 'true',
					ecb: 'angular.element(document.querySelector(\'[ng-app]\')).injector().get(\'Push\').notificationIOS'
				};
				QTools.timerRetry(function(){
					serviceRegistration(details);
				}, PushConfig.retryPeriod).then(function(token){
					handleToken(token);
				});
			}			
		}

		// process a new token 
		function handleToken(token){
			if(token !== push.notificationId){

			}
		}



		.then(function(token){
					if(token !== push.notificationId){

					}
				});



				// handle a token once one is received
				return tokenPromise.promise.then(function(token){
			var details = {
				notificationId: token
			};
			if(ionic.Platform.isAndroid()){
				details.platform = Globals.platforms.android;
			}else{
				details.platform = Globals.platforms.ios;
			}
			// update the local db
			pushConfig.update(push, details, ConstPush.dbKey);
		});



		function updatePush











		// promise to take care of 3rd party push tokens
		var tokenPromise = $q.defer();

		


		

		// platform independent registration function
		function register(){

			var deferred = $q.defer();

			$ionicPlatform.ready().then(function(){
				var details;

				if(ionic.Platform.isAndroid()){
					details = {
						senderID: config.pushAndroidId,
						ecb: 'angular.element(document.querySelector(\'[ng-app]\')).injector().get(\'Push\').notificationAndroid'
					};
					$window.plugins.pushNotification.register(deferred.resolve, deferred.reject, details);
				}else{
					// IOS
					details = {
						ecb: 'angular.element(document.querySelector(\'[ng-app]\')).injector().get(\'Push\').notificationIOS'
					};
					$window.plugins.pushNotification.register(function(token){
						tokenPromise.resolve(token);
						deferred.resolve();
					}, deferred.reject, details);
				}			
			});	

			return deferred.promise;	
		}

		
			});

			return registered;
		}

		function registeredAndroid(id){
			// once we have a registration id 
			// update the inbox details to the server and
			// save to the local db
			var details = {
				notificationId: id,
				platform: 'android'
			};

			API.inbox.updateConfig(details).$promise.then(function(){
				pushConfig.update(details).then(registered.resolve);
			});
		}

		// notification handler (some platforms contain registration info here)
		function notificationAndroid(e){
			switch(e.event){
				case 'registered':
					tokenPromise.resolve(e.regid);
					break;
				case 'message':
					messageAndroid(e);
					break;
				case 'error':
					// What do we want to do with these?
					break;
				default:
					break;
			}
		}

		// TODO: finish ios handling
		function notificationIOS(e){
			if(e.alert){

			}else if(e.sound){

			}else if(e.badge){

			}
		}

		return {
			init: init,
			notificationAndroid: notificationAndroid,
			notificationIOS: notificationIOS
		};




		// initialise the push notification config
		QTools.timerRetry(registerAttempt, ConstPush.configRetryTime);

		function registerAttempt(){

			
		}


		function init(){
			// attempt to register the inbox with the phone for notifications

		}


		this.register = function(){

			var androidConfig = {
				"senderID": "620603725651", //Google Deceloper ID number
			};
			
			$cordovaPush.register(androidConfig).then(function(result) {
				  // SUCCESS NOTIFICATION ONLY
					alert(result); //returns 'OK'
				}, function(err) {
					//error
					alert(err);
				});
		}

		//handle notifications
		$rootScope.$on('$cordovaPush:notificationReceived', function(event, notification){
			//registration received
			if(notification.event == 'registered'){
				// console.log(notification);
				//check if registered, send to API

			//message received	
			} else if (notification.event == 'message'){
				alert('message: ' + notification.message);
				//add to list

			//error received	
			} else if (notification.event == 'error'){
				alert('error');
				//try again?
			}
		});
	})
	.controller('AppCtrl', function($scope, $ionicPlatform, PushService){
		console.log('controller');

		$ionicPlatform.ready().then(function(){
			//Need to register every time the app is launched.
			PushService.register();
		})
		
	});

