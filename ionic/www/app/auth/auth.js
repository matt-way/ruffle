
// module for dealing with auth/inbox variable for a user

angular.module('ruffle.auth', [])
	.constant('ConstAuth', {
		dbKey: 'auth'
	})
	.service('Auth', function($q, ConstAuth, ConfigDB, Branch, API){

		var auth = {};

		var loading = init();
		var verified = $q.defer();

		// runs on service init
		function init(){
			return ConfigDB.get(ConstAuth.dbKey).then(function(values){
				angular.extend(auth, values);
			}).finally(function(){
				// auth may not exist yet either, and will 404

				// if not verified, but a referrer was provided, attempt to do direct verification
				if(!checkVerified()){
					return Branch.data.then(function(data){
						if(data && data.id){							
							return API.inbox.verifyDeeplink({
								type: data.id
							}).$promise.then(function(result){
								return verify({
									inboxId: result.inboxId,
									token: result.token
								});
							});
						}
					});			
				}		
			});
		}

		// perform a verified check, resolving the verified promise if true (for prereqs)
		function checkVerified(){
			// first check if already verified
			if(auth.inboxId && auth.token){
				verified.resolve();
				return true;
			}
			return false;
		}

		// pass in new auth values, and update the state
		function verify(values){
			return ConfigDB.update(ConstAuth.dbKey, auth, values).then(function(){
				API.setAuth(auth);
				verified.resolve();
			});
		}

		// get a referrer deeplink passed to the app if available
		function getReferrer(){

		}

		return {
			values: function(){ return auth; },
			verify: verify,
			loading: loading,
			checkVerified: checkVerified,
			verified: verified.promise
		};
	});