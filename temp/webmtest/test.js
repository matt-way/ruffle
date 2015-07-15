
var c, ctx;
var t, tctx;
var v;

function init(){
	c = document.getElementById('can');
	ctx = c.getContext('2d');
	t = document.createElement('canvas');
	tctx = t.getContext('2d');
	v = document.getElementById('vid');
	v.addEventListener("canplaythrough", videoLoaded, false);
}

function videoLoaded(){
	c.width = v.clientWidth;
	c.height = v.clientHeight;
	t.width = c.width;
	t.height = c.height;
	drawFrame();
}

function drawFrame(){
	renderFrame(40);
	requestAnimationFrame(drawFrame);
}

function renderFrame(pixelsX){

	// calculate the ideal number of pixels high to match the aspect ratio
	var pixelsY = (pixelsX * c.height) / c.width;

	// work out the maximum allowed height to use given the canvas height
	//var maxPixelsY = (pixelsX * parentHeight) / parentWidth;
	//var pixelsY = Math.min(imgPixelsY, maxPixelsY);
	
	// now the height might be smaller than screen height to preserve the aspect ratio
	// so calculate the right height & offset
	//var finHeight = (pixelsY / pixelsX) * parentWidth;
	
	// set the correct canvas size to fit the final image
	//canvas.width = parentWidth;
	//canvas.height = finHeight;

	//var maxImgHeight = (parentHeight / parentWidth) * image.width;
	//var cropY = Math.max(0, image.height - maxImgHeight);

	// if we have a gif frame, we need to convert it to an image for cropping
	//var preImage = image;
	//if(isGIF){
		//tempCanvas.width = image.width;
		//tempCanvas.height = image.height;
		//var iData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
		//iData.data.set(image.pixels);
		//tempCtx.putImageData(iData, 0, 0);
		//preImage = tempCanvas;
	//}

	tctx.drawImage(v, 0, 0);

	// turn off image smoothing - this will give the pixelated effect
	// NOTE: must be done after resize
	//if(pixelsX < parentWidth){
		ctx.mozImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;
		ctx.imageSmoothingEnabled = false;	
	//}

	// draw the pre image onto the canvas (crop vertically if aspect ratio doesn't fit properly)
	//ctx.drawImage(preImage, 0, cropY / 2, preImage.width, preImage.height - cropY, 0, 0, pixelsX, pixelsY);
	ctx.drawImage(t, 0, 0, t.width, t.height, 0, 0, pixelsX, pixelsY);
	
	// draw the small image back onto the bigger canvas
	// as smoothing is off the result will be pixelated
	ctx.drawImage(c, 0, 0, pixelsX, pixelsY, 0, 0, c.width, c.height);

	// set the image to the vetical centre
	//var placeOffsetY = Math.max(0, (parentHeight - finHeight) / 2);




	//ctx.drawImage(v, 0, 0);
}