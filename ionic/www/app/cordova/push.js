
angular.module('ruffle.cordova.push', [])
	.constant('ConstPush', {
		dbKey: 'push',
		retryPeriod: 30000 // 30 seconds
	})
	.service('Push', function(Globals, ConfigDB, ConstPush, Config, Auth, Verify,
		$window, $q, $ionicPlatform, QTools, API){

		var push = {};
		var config = Config.values();

		// initialise once config and verification available
		$ionicPlatform.ready().then(function(){
			$q.all([Config.loaded, Auth.verified]).then(init); 
		});
		
		// initialise the service
		function init(){
			// get stored push details if any, and register once complete
			var test = ConfigDB.get(ConstPush.dbKey).then(function(values){
				angular.extend(push, values);
			}, angular.noop).finally(register);
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
				}, ConstPush.retryPeriod);			
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
			// if the token is different we need to update the system
			if(token && token !== push.notificationId){
				var details = {
					notificationId: token
				};

				if(ionic.Platform.isAndroid()){
					details.platform = Globals.platforms.android;
				}else{
					details.platform = Globals.platforms.ios;
				}

				// update in the db
				API.inbox.updateConfig(details).$promise.then(function(){
					ConfigDB.update(push, details, ConstPush.dbKey);
				});				
			}
		}

		// notification handler (some platforms contain registration info here)
		function notificationAndroid(e){
			switch(e.event){
				case 'registered':
					handleToken(e.regid);
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

		// handle android messages
		function messageAndroid(e){
			if(e.foreground){
				// app foreground message
				RuffleList.getNewRuffles();
			}else if(e.coldStart){
				// cold start message
				// do nothing as ruffles will be grabbed on load
			}else{
				// background message
				RuffleList.getNewRuffles();
			}
		}

		return {
			notificationAndroid: notificationAndroid,
			notificationIOS: notificationIOS
		};
	});
