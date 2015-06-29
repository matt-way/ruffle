
// service for preprocessing images (eg. pre upload)

angular.module('ruffle.images.preprocess', [])
	.service('ImagePreprocess', function($q){

		// hermite downsampler
		function resample_hermite(canvas, W, H, W2, H2){
			var time1 = Date.now();
			W2 = Math.round(W2);
			H2 = Math.round(H2);
			var img = canvas.getContext("2d").getImageData(0, 0, W, H);
			var img2 = canvas.getContext("2d").getImageData(0, 0, W2, H2);
			var data = img.data;
			var data2 = img2.data;
			var ratio_w = W / W2;
			var ratio_h = H / H2;
			var ratio_w_half = Math.ceil(ratio_w/2);
			var ratio_h_half = Math.ceil(ratio_h/2);
			
			for(var j = 0; j < H2; j++){
				for(var i = 0; i < W2; i++){
					var x2 = (i + j*W2) * 4;
					var weight = 0;
					var weights = 0;
					var weights_alpha = 0;
					var gx_r = gx_g = gx_b = gx_a = 0;
					var center_y = (j + 0.5) * ratio_h;
					for(var yy = Math.floor(j * ratio_h); yy < (j + 1) * ratio_h; yy++){
						var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
						var center_x = (i + 0.5) * ratio_w;
						var w0 = dy*dy //pre-calc part of w
						for(var xx = Math.floor(i * ratio_w); xx < (i + 1) * ratio_w; xx++){
							var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
							var w = Math.sqrt(w0 + dx*dx);
							if(w >= -1 && w <= 1){
								//hermite filter
								weight = 2 * w*w*w - 3*w*w + 1;
								if(weight > 0){
									dx = 4*(xx + yy*W);
									//alpha
									gx_a += weight * data[dx + 3];
									weights_alpha += weight;
									//colors
									if(data[dx + 3] < 255)
										weight = weight * data[dx + 3] / 250;
									gx_r += weight * data[dx];
									gx_g += weight * data[dx + 1];
									gx_b += weight * data[dx + 2];
									weights += weight;
									}
								}
							}		
						}
					data2[x2]     = gx_r / weights;
					data2[x2 + 1] = gx_g / weights;
					data2[x2 + 2] = gx_b / weights;
					data2[x2 + 3] = gx_a / weights_alpha;
					}
				}
			console.log("hermite = "+(Math.round(Date.now() - time1)/1000)+" s");
			canvas.getContext("2d").clearRect(0, 0, Math.max(W, W2), Math.max(H, H2));
		    canvas.width = W2;
		    canvas.height = H2;
			canvas.getContext("2d").putImageData(img2, 0, 0);
		}

		// resizes an image from data (assumes unit8array file data)
		function resizeMaxWidth(dataUrl, maxWidth){
			console.log('** starting preprocess');
			var deferred = $q.defer();

			var image = new Image();
			image.crossOrigin = "Anonymous";
			image.onload = function(){
				
				var width = image.width;
				var height = image.height;

				var canvas = document.createElement('canvas');
				var ctx = canvas.getContext('2d');

				canvas.width = width;
				canvas.height = height;

				ctx.drawImage(image, 0, 0);

				if(width > maxWidth){
					var finHeight = height * (maxWidth / width);
					var finWidth = maxWidth;
					resample_hermite(canvas, width, height, finWidth, finHeight);
				}

				var newUrl = canvas.toDataURL('image/jpeg', 0.9);
				console.log('** preprocess complete');
				deferred.resolve(newUrl);
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