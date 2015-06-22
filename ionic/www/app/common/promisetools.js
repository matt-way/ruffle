
// extra promise tools

angular.module('ruffle.common.promisetools', [])
	.service('QTools', function($q, $timeout){

		// from: http://stackoverflow.com/questions/18888104/angularjs-q-wait-for-all-even-when-1-rejected
		function allSettled(promises) {
			// Implementation of allSettled function from Kris Kowal's Q:
			// https://github.com/kriskowal/q/wiki/API-Reference#promiseallsettled

			var wrapped = angular.isArray(promises) ? [] : {};

			angular.forEach(promises, function(promise, key) {
				if (!wrapped.hasOwnProperty(key)) {
					wrapped[key] = wrap(promise);
				}
			});

			return $q.all(wrapped);

			function wrap(promise) {
				return $q.when(promise)
					.then(function (value) {
						return { succeeded: true, value: value };
					}, function (reason) {
						return { succeeded: false, reason: reason };
					});
			}
		}

		// return a promise that will resolve n milliseconds
		function timer(timeout){
			var deferred = $q.defer();
			$timeout(function(){
				deferred.resolve();
			}, timeout);
			return deferred.promise;
		}

		// return a promise that will success, when the provided
		// function eventually succeeds. Retrying after a desired timeout
		function timerRetry(action, timeout){
			return $q.when(true).then(action)
				.catch(function(err){
					return timer(timeout).then(function(){
						return timerRetry(action, timeout);
					});
				});
		}

		return {
			allSettled: allSettled,
			timer: timer,
			timerRetry: timerRetry
		};
	});