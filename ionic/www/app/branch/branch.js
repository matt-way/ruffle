/* API consumer for branch service (deep linking app installs) */

angular.module('ruffle.branch', [])
	.service('Branch', function($q, $ionicPlatform){

		var loading = init();

		function init(){
			return $ionicPlatform.ready().then(function(){
				var deferred = $q.defer();
				branch.init('key_live_pdjPBe2mNe2g37By9ynDadlgFDoelgNV', function(err, data) {
			    	if(err){
			    		deferred.reject(err);
			    	}else{
			    		if(data){ data = JSON.parse(data.data); }
			    		deferred.resolve(data);
			    	}
				});
				return deferred.promise;
			});
		}
		
		return {
			data: loading
		};
	});