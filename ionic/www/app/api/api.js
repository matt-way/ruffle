
// ruffle api wrapper

angular.module('ruffle.api', [])
	.service('API', function($resource, DB, Globals){

		// get the

		var inbox = $resource(Globals.API + '/inbox/:id/:type/:typeId/:action', 
			{ id: '@id', type: '@type', typeId: '@typeId', action: '@action' },
			{
				requestCode: { method: 'POST', params: { id: 'request' }},
				verifyCode: { method: 'POST', params: { id: 'verify' }},
				getRuffles: { method: 'GET', params: { type: 'ruffles' }},
				confirmRuffle: { method: 'POST', params: { type: 'ruffle', action: 'downloaded' }},
				blockSender: { method: 'POST', params: { type: 'ruffle', action: 'block-sender' }},
				sendRuffle: { method: 'POST', params: { type: 'send' }}
			});

		return {
			Inbox: inbox
		};
	})
	.service('TokenAuthInterceptor', function(){
		return {
			request: function(config){				
				config.headers = config.headers || {};
				// if a token is available, include the auth header
				//if token
				//	config.headers.Authorization = 'Bearer ' + token

				return config;
			}
		};
	})
	.config(function($httpProvider){
		$httpProvider.interceptors.push('TokenAuthInterceptor');
	});