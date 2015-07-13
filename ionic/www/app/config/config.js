
// config variable service

angular.module('ruffle.config', [])
	.constant('ConstConfig', {
		retryPeriod: 20000,
		dbType: 'config'
	})
	.service('ConfigDB', function(ConstConfig, DB){
		return DB.createDBType(ConstConfig.dbType);
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