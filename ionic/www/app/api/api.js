
// ruffle api wrapper

angular.module('ruffle.api', [])
	.service('API', function($resource, DB, Globals, Auth){

		var auth = Auth.values();

		// auth header setup
		var authHeader = {
			Authorization: function(){
				return 'Bearer ' + auth.token;
			}
		};

		var inbox = $resource(Globals.API + '/inbox/:id/:type/:typeId/:action', 
			{
				id: function(){
					return auth.inboxId;
				}, 
				type: '@type', typeId: '@typeId', action: '@action'
			}, {
				requestCode: { method: 'POST', params: { id: 'request' }},
				verifyCode: { method: 'POST', params: { id: 'verify' }},
				getRuffles: { method: 'GET', params: { type: 'ruffles' }, headers: authHeader },
				confirmRuffle: { method: 'POST', params: { type: 'ruffle', action: 'downloaded' }, headers: authHeader },
				blockSender: { method: 'POST', params: { type: 'ruffle', action: 'block-sender' }, headers: authHeader },
				presendRuffle: { method: 'POST', params: { type: 'presend' }, headers: authHeader },
				sendRuffle: { method: 'POST', params: { type: 'send' }, headers: authHeader },
				updateConfig: { method: 'POST', params: { type: 'update-config' }, headers: authHeader }
			});

		var config = $resource(Globals.API + '/config/:type', 
			{ type: '@type' },
			{});

		return {
			inbox: inbox,
			config: config
		};
	})
	.service('AuthResponseInterceptor', function($q, $injector){
		return {
			responseError: function(error){
				if(error.status === 403){
					var state = $injector.get('$state');
					var cur = state.current.name;
					if(cur !== 'verify' && cur !=='verifyPin'){
						state.go('verify', true);
						return $q.reject(error);	
					}
				}
				return error;
			}
		}
	})
	.config(function($httpProvider){
		$httpProvider.interceptors.push('AuthResponseInterceptor');
	});