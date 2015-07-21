
// utilities for loading images into the correct usable types within ruffle

angular.module('ruffle.loader', [])
	.service('ImageLoader', function($q, $http){

		function endsWith(str, suffix) {
		    return str.indexOf(suffix, str.length - suffix.length) !== -1;
		}

		function isGIF(src) {
			var deferred = $q.defer();
		    var request = new XMLHttpRequest();
		    request.open('GET', src, true);
		    request.responseType = 'arraybuffer';
		    request.onload = function(){
		    	// check the first 4 bytes for gif signature
		        var arr = new Uint8Array(request.response);
		        var is = !(arr[0] !== 0x47 || arr[1] !== 0x49 || 
		            	   arr[2] !== 0x46 || arr[3] !== 0x38);
		       	deferred.resolve(is);
		    };
		    request.error = function(err){
		    	deferred.reject(err);
		    };
		    request.send();
		    return deferred.promise;
		}

		// load and convert an image in a way that ruffle can use it
		// return a promise (with built in progress indicators)
		function loadURL(url, isGif){
			if(isGif){
				// GIF
				return $http.get(url, {
					responseType: 'arraybuffer'
				}).then(function(result){
					var gif = new GIF(result.data);					
					return gif;
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
			loadURL: loadURL,
			isGIF: isGIF
		};
	});