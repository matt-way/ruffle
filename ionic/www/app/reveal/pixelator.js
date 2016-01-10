
angular.module('ruffle.pixelator', [])
	.directive('rfPixelator', function($timeout, $http, $q, $ionicPlatform){
		return {
			scope: {
				image: '=rfPixelator',
				shouldHelp: '=helpIf'
			},
			template: '<canvas class="ruffle-canvas"></canvas><div class="ruffle-loader" ng-show="loading">Loading</div><div class="ruffle-swipe ng-hide" ng-show="!touching && !loading && shouldHelp"><div class="ruffle-swipe-cell"><img class="ruffle-swipe-arrow" src="img/swipe.png"/></div></div>',
			link: function(scope, elem, attrs){

				// drawing contexts
				var canvas = elem.children()[0];
				var ctx = canvas.getContext('2d');
				var tempCanvas = document.createElement('canvas');
				var tempCtx = tempCanvas.getContext('2d');
				var gifCanvas = document.createElement('canvas');
				var gifCtx = gifCanvas.getContext('2d');

				// screen dims
				var parentWidth = elem[0].offsetWidth;
				var parentHeight = elem[0].offsetHeight;
				// image dims
				var displayWidth, displayHeight;
				// canvas dims
				var canvasLeft, canvasTop, canvasWidth, canvasHeight;

				// pixel bounds
				var minPixels = 4.9;
				// the current number of pixels for pixelation
				var curPixels;
				// initial touch locations
				var startX, startY;
				// the amount the user has swiped (0->1)
				var amountSwiped = 0;
				// exponent speed
				var bend = 7;
				// distance to swipe to full reveal
				var distToReveal = 0.65 * parentWidth;
				// ms for bounce back animatino to complete
				var snapbackDuration = 300;
				// the last time grabbed
				var time;
				// has the pixel res or image index changed
				var pixelsChanged = false;
				var imageChanged = false;

				// is the user touching
				scope.touching = false;

				// is gif loading
				scope.loading = true;
				// is the image a GIF
				var isGIF = false;
				// the generates frames of the gif
				var gifFrames;
				// the image data that can be reused for each frame if possible
				var frameImageData;
				// the current gif image index
				var index;
				// the next time for a gif frame update
				var nextFrameChange;

				// the current frame being drawn
				var curFrame;

				// watch for changes to the image object
				scope.$watch('image', function(newValue){
					if(newValue){
						init();
					}
				});
				if(scope.image){ init(); }

				// state for dealing with early backbutton exit
				var wantExit = false;

				function hwBack(){
					if(scope.loading){
						wantExit = true;
					}
				}

				$ionicPlatform.onHardwareBackButton(hwBack);

				// cleanup
				scope.$on('$destroy', function() {
					//console.log('destroying pixelator image ref');
					//delete scope.image;
					$ionicPlatform.offHardwareBackButton(hwBack);
				});

				// called when the image object has loaded
				function init(){

					var loader;
					if(scope.image instanceof GIF){
						displayWidth = scope.image.raw.lsd.width;
						displayHeight = scope.image.raw.lsd.height;
						isGIF = true;
						loader = loadGIF();
					}else{
						displayWidth = scope.image.width;
						displayHeight = scope.image.height;
						curFrame = scope.image;
						loader = $q.when(true);
					}
					
					// preload
					loader.then(function(){
						scope.loading = false;

						// calculate display dimensions
						calculateDims();

						// var init
						curPixels = minPixels;

						// do the initial render
						render(true);
					});
				}

				function loadFrame(p, index){
					var total = scope.image.raw.frames.length;
					if(wantExit){
						p.reject(false);
					}else if(index >= total){
						p.resolve(true);
					}else{
						var frame = scope.image.raw.frames[index];
						if(frame.image){
							var decompressed = scope.image.decompressFrame(index, true);
							gifFrames.push(decompressed);

							// update the loader
							var lineWidth = 4;
							var top = (parentHeight / 2) + 40.5;
							ctx.beginPath();
							ctx.moveTo(0, top);
							ctx.lineTo(((index + 1) / total) * parentWidth, top);
							ctx.lineWidth = lineWidth;
							ctx.strokeStyle = '#7DE5B3';
							ctx.stroke();	
						}						
						
						ionic.requestAnimationFrame(function(){
							loadFrame(p, index + 1);
						});
					}
				}

				// load GIF image frames (returns a promise)
				function loadGIF(){
					// setup the gif canvas
					gifCanvas.width = scope.image.raw.lsd.width;
					gifCanvas.height = scope.image.raw.lsd.height;
					
					gifFrames = [];

					// setup the canvas for loading
					canvas.width = parentWidth;
					canvas.height = parentHeight;

					// load the gif frames, while updating a loader
					var deferred = $q.defer();
					loadFrame(deferred, 0);

					return deferred.promise.then(function(){
						return updateGIF();	
					});
				}

				// calculate the dims of the canvas to make the image show correctly
				// including any offsets
				function calculateDims(){

					// set the logical canvas dims
					canvasHeight = (parentWidth / displayWidth) * displayHeight;
					canvasWidth = parentWidth;

					// shrink image if necessary to show entire height
					if(canvasHeight > parentHeight){
						canvasWidth *= parentHeight / canvasHeight;
						canvasHeight = parentHeight;
					}					
					
					canvasLeft = (parentWidth - canvasWidth) / 2;
					canvasTop = (parentHeight - canvasHeight) / 2;					

					canvas.width = displayWidth;
					canvas.height = displayHeight;
					canvas.style.width = canvasWidth + 'px';
					canvas.style.height = canvasHeight + 'px';

					if(canvasLeft !== 0 || canvasTop !== 0){
						TweenMax.set(canvas, { x: canvasLeft, y: canvasTop });
					}
				}

				// draw a pixelated image or imagedata
				function pixelateImage(image, pixelsX){
					
					var pixelsY = Math.ceil((pixelsX / displayWidth) * displayHeight);

					// turn off smoothing in all cases, except when the image is 100% clear
					if(pixelsX < displayWidth){
						ctx.mozImageSmoothingEnabled = false;
						ctx.webkitImageSmoothingEnabled = false;
						ctx.imageSmoothingEnabled = false;
					}

					ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, pixelsX, pixelsY);
					ctx.drawImage(canvas, 0, 0, pixelsX, pixelsY, 0, 0, displayWidth, displayHeight);
				}	

				// on touch
				elem.parent().bind('touchstart', function(e){
					var touchItem = e.touches.item(0);
					startX = touchItem.clientX;
					startY = touchItem.clientY;	
									
					scope.$apply(function(){
						scope.touching = true;
					});						

					render(true);
				});

				// on finger move
				elem.parent().bind('touchmove', function(e){
					var touchItem = e.touches.item(0);
					var diffX = touchItem.clientX - startX;
					var diffY = touchItem.clientY - startY;

					var totalDiff = Math.sqrt((diffX * diffX) + (diffY * diffY));

					amountSwiped = totalDiff / distToReveal;
					amountSwiped = Math.min(1, Math.max(0, amountSwiped));

					var newPixels = expChange(amountSwiped, bend) * (displayWidth - minPixels) + minPixels;
					pixelsChanged = newPixels !== curPixels;
					curPixels = newPixels;
				});

				// on release
				elem.parent().bind('touchend touchcancel', function(e){
					scope.$apply(function(){
						scope.touching = false;
					});
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

					if(!scope.touching && amountSwiped > 0){
						// if we should be animating a snap back
						bounceBack(dt);
					}else if(scope.touching && isGIF){
						// update the gif
						updateGIF(now);
					}

					// only render if we have a new image, or the pixels have changed
					if(forceDraw || pixelsChanged || imageChanged){
						pixelateImage(curFrame, Math.floor(curPixels));
					}	

					time = now;
					if(scope.touching || amountSwiped > 0){
						ionic.requestAnimationFrame(render);
					}else{
						rendering = false;
					}
				}

				// animation sequence for snapping the pixel res back to min
				function bounceBack(delta){
					amountSwiped -= delta / snapbackDuration;
					amountSwiped = Math.max(0, amountSwiped);
					curPixels = expChange(amountSwiped, bend) * (displayWidth - minPixels) + minPixels;
					pixelsChanged = true;
				}

				// update the frame data used to draw the gif
				function updateFrameGIF(index){
					var frame = gifFrames[index];
					var dims = frame.dims;

					if(!frameImageData || dims.width !== frameImageData.width || dims.height !== frameImageData.height){
						tempCanvas.width = dims.width;
						tempCanvas.height = dims.height;
						frameImageData = tempCtx.createImageData(dims.width, dims.height);
					}

					// set the patch data as an override
					frameImageData.data.set(frame.patch);

					// draw the patch back over the canvas
					tempCtx.putImageData(frameImageData, 0, 0);

					// update the actual gif image
					gifCtx.drawImage(tempCanvas, dims.left, dims.top);

					// set the new curframe
					curFrame = gifCanvas;
				}

				// update the gif frame depending on the time passed
				function updateGIF(now){

					function updateFrameTime(t, delay){
						nextFrameChange = new Date(t + delay).getTime();
					}

					if(!now){
						// for initial change setup
						now = new Date().getTime();
						index = 0;						
						updateFrameGIF(index);
						imageChanged = true;
						updateFrameTime(now, gifFrames[index].delay || 100);
					}else if(now >= nextFrameChange){
						index++;
						if(index >= gifFrames.length){
							index = 0;
						}
						updateFrameGIF(index);
						imageChanged = true;
						updateFrameTime(now, gifFrames[index].delay || 100);
					}
				}
			}
		};
	});