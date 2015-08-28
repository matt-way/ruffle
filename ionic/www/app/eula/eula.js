/* Service for showing and storing EULA agreement info */

angular.module('ruffle.eula', [])
	.service('EULA', function($q, $cordovaDialogs, LocalConfig){

		var defaultEULA = '1. There is zero tolerence for objectionable content.\n2. You agree to the Ruffle terms & conditions.';

		function show(){
			// check if the user has already seen it
			return LocalConfig.loaded.then(function(){
				var localData = LocalConfig.values();

				// make sure they have agreed to an update to date eula
				if(localData.agreed && (!localData.eulaDate || localData.agreed > localData.eulaDate)){
					return true;
				}else{
					return $cordovaDialogs.confirm(localData.eula || defaultEULA, 'Rules', ['Agree', 'View Terms', 'Cancel']).then(function(response){
						if(response === 1){
							// update the local data to store agreed (noop ensures passage through even on error)
							var d = new Date();
							var n = d.getTime();
							return LocalConfig.update({ agreed: n }).finally(angular.noop);
						}else if(response === 2){
							window.open('http://www.ruffle.us/#/terms', '_system');
						}else{
							return $q.reject();
						}
					});
				}
			}, function(err){
				// error loading eula info, so just ignore
				return $q.when(true);
			});
		}

		return {
			show: show
		};
	});