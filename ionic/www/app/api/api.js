
// ruffle api wrapper

angular.module('ruffle.api', [])
	.service('API', function($resource, DB, Globals, Config){

		// auth header setup
		var authHeader = {
			Authorization: function(){
				var config = Config.values();
				return 'Bearer ' + config.token;
			}
		};

		var inbox = $resource(Globals.API + '/inbox/:id/:type/:typeId/:action', 
			{
				id: function(){
					var config = Config.values();
					return config.inboxId;
				}, 
				type: '@type', typeId: '@typeId', action: '@action'
			}, {
				requestCode: { method: 'POST', params: { id: 'request' }},
				verifyCode: { method: 'POST', params: { id: 'verify' }},
				getRuffles: { method: 'GET', params: { type: 'ruffles' }, headers: authHeader },
				confirmRuffle: { method: 'POST', params: { type: 'ruffle', action: 'downloaded' }, headers: authHeader },
				blockSender: { method: 'POST', params: { type: 'ruffle', action: 'block-sender' }, headers: authHeader },
				presendRuffle: { method: 'POST', params: { type: 'presend' }, headers: authHeader },
				sendRuffle: { method: 'POST', params: { type: 'send' }, headers: authHeader }
			});

		var config = $resource(Globals.API + '/config/:type', 
			{ type: '@type' },
			{
				ads: { method: 'GET', params: { type: 'ads' }}
			});

		return {
			inbox: inbox,
			config: config
		};
	});