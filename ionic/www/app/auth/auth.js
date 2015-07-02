
// module for dealing with auth/inbox variable for a user

angular.module('ruffle.auth', [])
	.constant('ConstAuth', {
		dbKey: 'auth'
	})
	.service('Auth', function($q, ConstAuth, ConfigDB){

		var auth = {};

		var loading = init();
		var verified = $q.defer();

		// runs on service init
		function init(){
			return ConfigDB.get(ConstAuth.dbKey).then(function(values){
				angular.extend(auth, values);
				checkVerified();				
			}, angular.noop);
		}

		// perform a verified check, resolving the verified promise if true (for prereqs)
		function checkVerified(){
			if(auth.inboxId && auth.token){
				verified.resolve();
				return true;
			}
			return false;
		}

		// pass in new auth values, and update the state
		function verify(values){
			return ConfigDB.update(ConstAuth.dbKey, auth, values).then(function(){
				checkVerified();
			});
		}

		return {
			values: function(){ return auth; },
			verify: verify,
			loading: loading,
			checkVerified: checkVerified,
			verified: verified.promise
		};
	});