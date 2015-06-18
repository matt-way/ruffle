
// cordova actionsheet wrapper

angular.module('ruffle.cordova.actionsheet', [])
	.service('$actionsheet', function($cordovaActionSheet, $ionicPlatform){

		function show(options){
			return $ionicPlatform.ready().then(function() {
				return $cordovaActionSheet.show(options)
					.then(function(btnIndex){
						console.log(btnIndex);
					});
			});	
		}
		
		return {
			show: show
		};
	});