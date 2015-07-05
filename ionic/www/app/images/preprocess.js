
// service for preprocessing images (eg. pre upload)

angular.module('ruffle.images.preprocess', [])
	.service('ImagePreprocess', function($q){

		function getContext (canvas){
			var context = canvas.getContext('2d');

			context.imageSmoothingEnabled = true;
			context.mozImageSmoothingEnabled = true;
			context.oImageSmoothingEnabled = true;
			context.webkitImageSmoothingEnabled = true;

			return context;
		}

		// resize by stepping down
		function resizeStep(img, width, height, quality){
			quality = quality || 1.0;

			var resultD = $q.defer();
			var canvas  = document.createElement('canvas');
			var context = getContext(canvas);
			var type = 'image/jpeg';

			var cW = img.naturalWidth;
			var cH = img.naturalHeight;

			var dst = new Image();
			var tmp = null;

			function stepDown () {
				cW = Math.max(cW / 2, width) | 0;
				cH = Math.max(cH / 2, height) | 0;

				canvas.width  = cW;
				canvas.height = cH;

				context.drawImage(tmp || img, 0, 0, cW, cH);

				var url = canvas.toDataURL(type, quality);
				
				if(cW <= width || cH <= height){
					return resultD.resolve(url);
				}

				dst.src = url;

				if (!tmp) {
					tmp = new Image();
					tmp.onload = stepDown;
				}

				tmp.src = dst.src;
			}

			if(cW <= width || cH <= height || cW / 2 < width || cH / 2 < height){
				canvas.width  = width;
				canvas.height = height;
				context.drawImage(img, 0, 0, width, height);				
				resultD.resolve(canvas.toDataURL(type, quality));
			} else {
				stepDown();
			}

			return resultD.promise;
		}

		// resizes an image from data (assumes unit8array file data)
		function resizeMaxWidth(dataUrl, maxWidth){
			var deferred = $q.defer();

			var image = new Image();
			image.crossOrigin = "Anonymous";
			image.onload = function(){
				
				var width = image.width;
				var height = image.height;

				if(width > maxWidth){
					height = height * (maxWidth / width);
					width = maxWidth;
				}

				resizeStep(image, width, height, 0.9).then(function(newUrl){
					deferred.resolve(newUrl);
				});
			};

			image.onerror = function(err){
				deferred.reject(err);
			};

			image.src = dataUrl;			
			return deferred.promise;
		}

		return {
			resizeMaxWidth: resizeMaxWidth
		};
	});