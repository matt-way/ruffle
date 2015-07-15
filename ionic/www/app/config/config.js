
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
			ConfigDB.update(ConstConfig.localKey, local, values);
		} 

		return {
			values: function(){ return local; },
			update: update,
			loaded: loading
		};
	})
	.service('Config', function(ConstConfig, API, QTools){

		var config = {};
		var loading = init();

		function init(){
			return QTools.timerRetry(requestConfig, ConstConfig.retryPeriod);
		}
		
		function requestConfig(){
			return API.config.get().$promise.then(function(values){
				angular.extend(config, values);
			}, function(err){
				console.log(err);
			});
		}

		return {
			values: function(){ return config; },
			loaded: loading
		};
	});