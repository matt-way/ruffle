
angular.module('ruffle.pixelator', [])
	.directive('rfPixelator', function($timeout, $http){
		return {
			scope: {
				image: '=rfPixelator'
			},
			link: function(scope, elem, attrs){

				// setup drawing contexts
				var canvas = elem[0];
				var ctx = canvas.getContext('2d');

				var tempCanvas = document.createElement('canvas');
				var tempCtx = tempCanvas.getContext('2d');

				var parentWidth = elem.parent()[0].offsetWidth;
				var parentHeight = elem.parent()[0].offsetHeight;

				// is the image a GIF
				var isGIF = false;

				// image related vars
				var minPixels = 4.9;
				var maxPixels = parentWidth;

				// is the user touching the screen
				var touching = false;
				// the current amount of pixel res to display
				var curPixels;
				// initial touch locations
				var startX, startY;
				// the amount the user has swiped (0->1)
				var amountSwiped = 0;
				// exponent speed
				var bend = 7;
				// distance to swipe to full reveal
				var distToReveal = 0.5 * parentHeight;
				// ms for bounce back animatino to complete
				var snapbackDuration = 300;
				// the last timestamp grabbed for rendering
				var time;
				// the current image
				var image;
				// the current gif image index
				var index;
				// the next time for a gif frame update
				var nextFrameChange;
				// is the image currently in a rendering loop
				var rendering = false;
				// has the pixel res or image index changed
				var pixelsChanged = false;
				var imageChanged = false;

				// initialise any image related stuff
				function init(){
					// use images array as gif check
					if(scope.image && scope.image.images){
						isGIF = true;
						index = 0;
						image = scope.image.images[index];
					}else{
						image = scope.image;
					}
					curPixels = minPixels;
					// render the initial image
					render(true);
				}
				
				// initialise on load if applicable
				if(scope.image){ init(); }	

				// watch for changes to the image object
				scope.$watch(scope.image, function(newValue){
					// reset the image index if applicable
					if(newValue){
						init(scope.image);	
					}					
				});

				// cleanup
				scope.$on('$destroy', function() {
					curPixels = minPixels;
					touching = false;
				});

				// draw a pixelated (or not) version of an image to the canvas
				// can take a regular Image(), or our custom GIF() type image
				function pixelate(pixelsX, image) {

					// calculate the ideal number of pixels high to match the aspect ratio
					var imgPixelsY = (pixelsX * image.height) / image.width;

					// work out the maximum allowed height to use given the canvas height
					var maxPixelsY = (pixelsX * parentHeight) / parentWidth;
					var pixelsY = Math.min(imgPixelsY, maxPixelsY);
					
					// now the height might be smaller than screen height to preserve the aspect ratio
					// so calculate the right height & offset
					var finHeight = (pixelsY / pixelsX) * parentWidth;
					
					// set the correct canvas size to fit the final image
					canvas.width = parentWidth;
					canvas.height = finHeight;

					var maxImgHeight = (parentHeight / parentWidth) * image.width;
					var cropY = Math.max(0, image.height - maxImgHeight);

					// if we have a gif frame, we need to convert it to an image for cropping
					var preImage = image;
					if(isGIF){
						tempCanvas.width = image.width;
						tempCanvas.height = image.height;
						var iData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
						iData.data.set(image.pixels);
						tempCtx.putImageData(iData, 0, 0);
						preImage = tempCanvas;
					}

					// turn off image smoothing - this will give the pixelated effect
					// NOTE: must be done after resize
					if(pixelsX < parentWidth){
						ctx.mozImageSmoothingEnabled = false;
						ctx.webkitImageSmoothingEnabled = false;
						ctx.imageSmoothingEnabled = false;	
					}

					// draw the pre image onto the canvas (crop vertically if aspect ratio doesn't fit properly)
					ctx.drawImage(preImage, 0, cropY / 2, preImage.width, preImage.height - cropY, 0, 0, pixelsX, pixelsY);
					
					// draw the small image back onto the bigger canvas
					// as smoothing is off the result will be pixelated
					ctx.drawImage(canvas, 0, 0, pixelsX, pixelsY, 0, 0, canvas.width, finHeight);

					// set the image to the vetical centre
					var placeOffsetY = Math.max(0, (parentHeight - finHeight) / 2);
					TweenMax.set(canvas, { y: placeOffsetY });
				}

				// on touch
				elem.parent().bind('touchstart', function(e){
					var touchItem = e.touches.item(0);
					startX = touchItem.clientX;
					startY = touchItem.clientY;

					touching = true;

					updateGIF();

					if(!rendering){
						rendering = true;
						render(true);
					}
				});

				// on finger move
				elem.parent().bind('touchmove', function(e){
					var touchItem = e.touches.item(0);
					var diffX = touchItem.clientX - startX;
					var diffY = touchItem.clientY - startY;

					var totalDiff = Math.sqrt((diffX * diffX) + (diffY * diffY));

					amountSwiped = totalDiff / distToReveal;
					amountSwiped = Math.min(1, Math.max(0, amountSwiped));

					var newPixels = expChange(amountSwiped, bend) * (maxPixels - minPixels) + minPixels;
					pixelsChanged = newPixels !== curPixels;
					curPixels = newPixels;
				});

				// on release
				elem.parent().bind('touchend', function(e){
					touching = false;
				});

				// 0->1 curve calculation
				function expChange(x, bend){
					return (Math.exp(bend * x) - 1) / (Math.exp(bend) - 1);
				}

				// primary render function
				function render(forceDraw){
					// get the time since the last render
					var now = new Date().getTime(),
						dt = now - (time || now);

					if(!touching && curPixels > minPixels){
						// if we should be animating a snap back
						bounceBack(dt);
					}else if(touching && isGIF){
						// update the gif
						updateGIF(now);
					}

					// only render if we have a new image, or the pixels have changed
					if(forceDraw || pixelsChanged || imageChanged){
						pixelate(Math.floor(curPixels), image);	
					}	

					time = now;
					if(touching || curPixels > minPixels){
						ionic.requestAnimationFrame(render);
					}else{
						rendering = false;
					}
				}

				// animation sequence for snapping the pixel res back to min
				function bounceBack(delta){
					amountSwiped -= delta / snapbackDuration;
					curPixels = expChange(amountSwiped, bend) * (maxPixels - minPixels) + minPixels;
					pixelsChanged = true;
				}

				// update the gif frame depending on the time passed
				function updateGIF(now){

					function updateFrameTime(t, delay){
						nextFrameChange = new Date(t + (delay || 100)).getTime();
					}

					if(!now){
						// for initial change setup
						now = new Date().getTime();
						updateFrameTime(now, image.delay);
					}else if(now >= nextFrameChange){
						index++;
						if(index >= scope.image.images.length){
							index = 0;
						}
						image = scope.image.images[index];
						imageChanged = true;
						updateFrameTime(now, image.delay);
					}
				}
			}
		};
	});