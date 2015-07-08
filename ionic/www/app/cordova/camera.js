
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
						saveToPhotoAlbum: false,
						correctOrientation: true,
						allowEdit: false
					};
				}else{
					// take a photo
					options = {
						sourceType: Camera.PictureSourceType.CAMERA,
						mediaType: 0,
						//allowEdit: true,
						encodingType: Camera.EncodingType.JPEG,
						targetWidth: 500,
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