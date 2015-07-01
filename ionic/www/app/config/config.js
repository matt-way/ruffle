
// config variable service

angular.module('ruffle.config', [])
	.constant('ConstConfig', {
		retryPeriod: 20000
	})
	.service('Config', function(ConstConfig, API){

		var config = {};
		var loading = init();

		function init(){
			return QTools.timerRetry(requestConfig, ConstConfig.retryPeriod);
		}
		
		function requestConfig(){
			return API.config.get().$promise.then(function(values){
				angular.extend(config, values);
			});
		}

		return {
			values: function(){ return config; },
			loaded: loading
		};
	});