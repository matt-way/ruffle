
// config variable service

angular.module('ruffle.config', [])
	.constant('ConstConfig', {
		retryPeriod: 20000,
		dbType: 'config',
		localKey: 'local'
	})
	.service('ConfigDB', function(ConstConfig, DB){
		return DB.createDBType(ConstConfig.dbType);
	})
	.service('LocalConfig', function($q, ConstConfig, ConfigDB, API, Globals, Auth){

		var local = {};
		var loading = Auth.loading.finally(init);
		
		function init(){
			// add a verify completed hook (for non verified installs) to update the client version
			Auth.verified.then(function(){
				updateVersion();
			});
			
			return ConfigDB.get(ConstConfig.localKey).then(function(values){
				angular.extend(local, values);

				updateVersion();
			}, angular.noop);
		}

		function updateVersion(){
			// if the local version doesn't match the app version it needs to be updated
			if(local.VERSION !== Globals.VERSION && API.hasInbox()){

				var details = {
					clientVersion: Globals.VERSION
				};

				// update in the db if inbox available
				return API.inbox.updateConfig(details).$promise.then(function(){
					return update({ VERSION: Globals.VERSION });
				});
			}

			return $q.when(true);
		}

		function update(values){
			return ConfigDB.update(ConstConfig.localKey, local, values);
		} 

		return {
			values: function(){ return local; },
			update: update,
			loaded: loading,
			updateVersion: updateVersion
		};
	})
	.service('Config', function(ConstConfig, API, QTools, LocalConfig){

		var config = {};
		var loading = init();

		function init(){
			return QTools.timerRetry(requestConfig, ConstConfig.retryPeriod);
		}
		
		function requestConfig(){
			return API.config.get().$promise.then(function(values){
				// HACK TODO: newer $resource or pouchDB attempts to include the
				// $resolved and $promise attachments to the $resource result.
				// We currently need to call toJSON() to strip the extras
				// THIS DOES NOT ACTUALLY RETURN JSON, but rather a js object
				var con = values.toJSON();

				angular.extend(config, con);
				// update the local config to store the last grabbed config variables for most up to date version
				LocalConfig.update(config);
			}, function(err){
				console.log(err);
			});
		}

		return {
			values: function(){ return config; },
			loaded: loading
		};
	});