
// cordova camera wrapper

angular.module('ruffle.cordova.camera', [])
	.service('$camera', function($cordovaCamera, $ionicPlatform){

		function getPicture(type){			

			return $ionicPlatform.ready().then(function() {

				var options;
				if(type === 1){
					// get a picture from the library
					options = {
						sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
						destinationType: Camera.DestinationType.DATA_URL,
						targetWidth: 1080,
						targetHeight: 1080,
						cropToSize: false,
						quality: 50,
						correctOrientation: true,
						saveToPhotoAlbum: false,
						allowEdit: false
					};
				}else{
					// take a photo
					options = {
						sourceType: Camera.PictureSourceType.CAMERA,
						mediaType: 0,
						cropToSize: false,
						//allowEdit: true,
						encodingType: Camera.EncodingType.JPEG,
						targetWidth: 1080,
						targetHeight: 1080,
						quality: 50,
						saveToPhotoAlbum: false,
						correctOrientation: true,
						destinationType: Camera.DestinationType.DATA_URL
					};
				}

				return $cordovaCamera.getPicture(options);
			});	
		}
		
		return {
			getPicture: getPicture
		};
	});