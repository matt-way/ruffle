
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
	.service('LocalConfig', function(ConstConfig, ConfigDB){

		var local = {};
		var loading = init();
		
		function init(){
			return ConfigDB.get(ConstConfig.localKey).then(function(values){
				angular.extend(local, values);
			}, angular.noop);
		}

		function update(values){
			return ConfigDB.update(ConstConfig.localKey, local, values);
		} 

		return {
			values: function(){ return local; },
			update: update,
			loaded: loading
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