
angular.module('ruffle.pixelator', [])
	.directive('rfPixelator', function($timeout){
		return {
			link: function(scope, elem, attrs){

				var img = new Image();

				var canvas = elem[0];
				var ctx = canvas.getContext('2d');

				var parentWidth = elem.parent()[0].offsetWidth;
				var parentHeight = elem.parent()[0].offsetHeight;

				function pixelate(pixelsX) {

					// calculate the ideal number of pixels high to match the aspect ratio
					var imgPixelsY = (pixelsX * img.height) / img.width;

					// work out the maximum allowed height to use given the canvas height
					var maxPixelsY = (pixelsX * parentHeight) / parentWidth;
					var pixelsY = Math.min(imgPixelsY, maxPixelsY);
					
					// now the height might be smaller than screen height to preserve the aspect ratio
					// so calculate the right height & offset
					var finHeight = (pixelsY / pixelsX) * parentWidth;
					
					// set the correct canvas size to fit the final image
					canvas.width = parentWidth;
					canvas.height = finHeight;

					// turn off image smoothing - this will give the pixelated effect
					// NOTE: must be done after resize
					if(pixelsX < parentWidth){
						ctx.mozImageSmoothingEnabled = false;
						ctx.webkitImageSmoothingEnabled = false;
						ctx.imageSmoothingEnabled = false;	
					}
					
					var maxImgHeight = (parentHeight / parentWidth) * img.width;
					var cropY = Math.max(0, img.height - maxImgHeight);

					// draw the image onto the canvas (crop vertically if aspect ratio doesn't fit properly)
					ctx.drawImage(img, 0, cropY / 2, img.width, img.height - cropY, 0, 0, pixelsX, pixelsY);
					
					// draw the small image back onto the bigger canvas
					// as smoothing is off the result will be pixelated
					ctx.drawImage(canvas, 0, 0, pixelsX, pixelsY, 0, 0, canvas.width, finHeight);

					// set the image to the vetical centre
					var placeOffsetY = Math.max(0, (parentHeight - finHeight) / 2);
					TweenMax.set(canvas, { y: placeOffsetY });
				}

				var minPixels = 4.9;
				var maxPixels = parentWidth;

				// exponent speed
				var bend = 7;

				var distToReveal = 0.7 * parentWidth;

				var startX, newX;
				var curX = 0;

				img.onload = function(){
					pixelate(Math.floor(minPixels));
				};
				img.src = './img/cat.jpg';

				elem.parent().bind('touchstart', function(e){
					startX = e.touches.item(0).clientX;
					console.log('pixel start:', startX);
				});

				function expChange(x, bend){
					return (Math.exp(bend * x) - 1) / (Math.exp(bend) - 1);
				}

				elem.parent().bind('touchmove', function(e){
					var diff = e.touches.item(0).clientX - startX;

					newX = curX + (diff / distToReveal);
					newX = Math.min(1, Math.max(0, newX));

					var curPixels = expChange(newX, bend) * (maxPixels - minPixels) + minPixels;
					pixelate(Math.floor(curPixels));
				});

				elem.parent().bind('touchend', function(e){
					curX = newX;
				});
			}
		};
	});