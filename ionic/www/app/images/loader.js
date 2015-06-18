
// utilities for loading images into the correct usable types within ruffle

angular.module('ruffle.imageLoader', [])
	.service('ImageLoader', function($q, $http){

		function endsWith(str, suffix) {
		    return str.indexOf(suffix, str.length - suffix.length) !== -1;
		}

		// load and convert an image in a way that ruffle can use it
		// return a promise (with built in progress indicators)
		function loadURL(url){

			// use extensions for simplicity for now
			url = url.toLowerCase();
			if(endsWith(url, '.gif')){
				// GIF
				return $http.get(url, {
					responseType: 'arraybuffer'
				}).then(function(result){
					var gif = new GIF(result.data);					
					return gif.decompressFrames();
				});
			}else{
				// regular image
				var deferred = $q.defer();
				var img = new Image();
				img.onload = function(){
					deferred.resolve(img);
				};
				img.src = url;
				return deferred.promise;
			}
		}

		return {
			loadURL: loadURL
		};
	});