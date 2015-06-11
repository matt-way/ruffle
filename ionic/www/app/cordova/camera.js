
// cordova camera wrapper

angular.module('ruffle.cordova.camera', [])
	.service('$camera', function($cordovaCamera, $ionicPlatform){

		function getPicture(_options){

			// setup defaults with override
			var options = angular.extend({
				sourceType: Camera.PictureSourceType.CAMERA,
				allowEdit: true,
				encodingType: Camera.EncodingType.JPEG
			}, _options);			

			return $ionicPlatform.ready().then(function() {
				return $cordovaCamera.getPicture(options);
			});	
		}
		
		return {
			getPicture: getPicture
		};
	});