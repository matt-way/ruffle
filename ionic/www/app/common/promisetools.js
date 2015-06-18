
// extra promise tools

angular.module('ruffle.common.promisetools', [])
	.service('QTools', function($q, $timeout){

		// return a promise that will resolve n milliseconds
		function timerPromise(timeout){
			var deferred = $q.defer();
			$timeout(function(){
				deferred.resolve();
			}, timeout);
			return deferred.promise;
		}

		// return a promise that will success, when the provided
		// function eventually succeeds. Retrying after a desired timeout
		function timerRetry(action, timeout){
			$q.when(true).then(action)
				.catch(function(err){
					return timerPromise(timeout).then(function(){
						return timerRetry(action, timeout);
					});
				});
		}

		return {
			timerPromise: timerPromise,
			timerRetry: timerRetry
		};
	});