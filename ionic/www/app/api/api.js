// ruffle api wrapper

angular.module('ruffle.api', [])
	.service('API', function($resource, DB, Globals){

		var auth = {};

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
				verifyDeeplink: { method: 'GET', params: { id: 'verify-deep' }},
				getRuffles: { method: 'GET', params: { type: 'ruffles' }, headers: authHeader },
				confirmRuffle: { method: 'POST', params: { type: 'ruffle', action: 'downloaded' }, headers: authHeader },
				blockSender: { method: 'POST', params: { type: 'ruffle', action: 'block-sender' }, headers: authHeader },
				presendRuffle: { method: 'POST', params: { type: 'presend' }, headers: authHeader },
				sendRuffle: { method: 'POST', params: { type: 'send' }, headers: authHeader },
				replyRuffle: { method: 'POST', params: { type: 'reply' }, headers: authHeader },
				updateConfig: { method: 'POST', params: { type: 'update-config' }, headers: authHeader },
				sendReferenceRuffle: { method: 'POST', params: { type: 'send-reference' }, headers: authHeader },
				replyReferenceRuffle: { method: 'POST', params: { type: 'reply-reference' }, headers: authHeader }
			});

		var config = $resource(Globals.API + '/config/:type', 
			{ type: '@type' },
			{});

		return {
			inbox: inbox,
			config: config,
			setAuth: function(a){ auth = a; }
		};
	})
	.service('AuthResponseInterceptor', function($q, $injector, Globals){
		return {
			responseError: function(error){
				if(error.status === 403 && error.config.url.startsWith(Globals.API)){
					var state = $injector.get('$state');
					var cur = state.current.name;
					if(cur !== 'verify' && cur !=='verifyPin'){
						state.go('verify', true);
						return $q.reject(error);	
					}
				}
				return $q.reject(error);
			}
		};
	})
	.config(function($httpProvider){
		$httpProvider.interceptors.push('AuthResponseInterceptor');
	});