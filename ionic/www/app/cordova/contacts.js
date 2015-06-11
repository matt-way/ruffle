
// cordova camera wrapper

angular.module('ruffle.cordova.contacts', [])
	.service('$contacts', function($cordovaContacts, $ionicPlatform){

		function pick(){
			return $ionicPlatform.ready().then(function() {
				return $cordovaContacts.pickContact();
			});	
		}
		
		return {
			pick: pick
		};
	});