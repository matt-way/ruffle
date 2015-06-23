
// cordova camera wrapper

angular.module('ruffle.cordova.camera', [])
	.service('$camera', function($cordovaCamera, $ionicPlatform){

		function getPicture(type){			

			return $ionicPlatform.ready().then(function() {

				// use defaults for ruffle
				var options = {
					sourceType: type ? Camera.PictureSourceType.PHOTOLIBRARY : Camera.PictureSourceType.CAMERA,
					//allowEdit: true,
					mediaType: 0,
					encodingType: Camera.EncodingType.JPEG,
					targetWidth: 500,
					saveToPhotoAlbum: false,
					correctOrientation: true,
					destinationType: Camera.DestinationType.FILE_URI
				};

				return $cordovaCamera.getPicture(options);
			});	
		}
		
		return {
			getPicture: getPicture
		};
	});