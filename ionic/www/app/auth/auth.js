
// module for dealing with auth/inbox variable for a user

angular.module('ruffle.auth', [])
	.constants('ConstAuth', {
		dbType: 'config',
		dbKey: 'auth'
	})
	.service('Auth', function($q, ConstAuth, DB){

		var auth = {};
		var authDB = DB.createDBType(ConstAuth.dbType);

		var loading = init();
		var verified = $q.defer();

		// runs on service init
		function init(){
			return authDB.get(ConstAuth.dbKey).then(function(values){
				angular.extend(auth, values);
				checkVerified();				
			});
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
			return authDB.update(ConstAuth.dbKey, auth, values).then(function(){
				checkVerified();
			});
		}

		return {
			values: function(){ return auth; },
			verify: verify,
			loading: loading,
			verified: verified.promise
		};
	});