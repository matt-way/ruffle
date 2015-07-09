
function GIF(arrayBuffer){
	// convert to byte array
	var byteData = new Uint8Array(arrayBuffer);
	var parser = new DataParser(byteData);
	// parse the data
	this.raw = parser.parse(getSchema());

	// set a flag to make sure the gif contains at least one image
	this.raw.hasImages = false;
	for(var f=0; f<this.raw.frames.length; f++){
		if(this.raw.frames[f].image){
			this.raw.hasImages = true;
			break;
		}
	}
	
	// private function for storing the file parsing GIF schema
	function getSchema(){

		// a set of 0x00 terminated subblocks
		var subBlocks = {
			label: 'blocks',
			parser: function(stream){
				var out = [];
				var terminator = 0x00;		
				for(var size=stream.readByte(); size!==terminator; size=stream.readByte()){
					out = out.concat(stream.readBytes(size));
				}
				return out;
			}
		};

		// global control extension
		var gce = {
			label: 'gce',
			requires: function(stream){
				// just peek at the top two bytes, and if true do this
				var codes = stream.peekBytes(2);
				return codes[0] === 0x21 && codes[1] === 0xF9;
			},
			parts: [
				{ label: 'codes', parser: Parsers.readBytes(2), skip: true },
				{ label: 'byteSize', parser: Parsers.readByte() },
				{ label: 'extras', bits: {
					future: { index: 0, length: 3 },
					disposal: { index: 3, length: 3 },
					userInput: { index: 6 },
					transparentColorGiven: { index: 7 }
				}},
				{ label: 'delay', parser: Parsers.readUnsigned(true) },
				{ label: 'transparentColorIndex', parser: Parsers.readByte() },
				{ label: 'terminator', parser: Parsers.readByte(), skip: true }
			]
		};

		// image pipeline block
		var image = {
			label: 'image',
			requires: function(stream){
				// peek at the next byte
				var code = stream.peekByte();
				return code === 0x2C;
			},
			parts: [
				{ label: 'code', parser: Parsers.readByte(), skip: true },
				{
					label: 'descriptor', // image descriptor
					parts: [
						{ label: 'left', parser: Parsers.readUnsigned(true) },
						{ label: 'top', parser: Parsers.readUnsigned(true) },
						{ label: 'width', parser: Parsers.readUnsigned(true) },
						{ label: 'height', parser: Parsers.readUnsigned(true) },
						{ label: 'lct', bits: {
							exists: { index: 0 },
							interlaced: { index: 1 },
							sort: { index: 2 },
							future: { index: 3, length: 2 },
							size: { index: 5, length: 3 }
						}}
					]
				},{
					label: 'lct', // optional local color table
					requires: function(stream, obj, parent){
						return parent.descriptor.lct.exists;
					},
					parser: Parsers.readArray(3, function(stream, obj, parent){
						return Math.pow(2, parent.descriptor.lct.size + 1);
					})
				},{
					label: 'data', // the image data blocks
					parts: [
						{ label: 'minCodeSize', parser: Parsers.readByte() },
						subBlocks
					]
				}
			]
		};

		// plain text block
		var text = {
			label: 'text',
			requires: function(stream){
				// just peek at the top two bytes, and if true do this
				var codes = stream.peekBytes(2);
				return codes[0] === 0x21 && codes[1] === 0x01;
			},
			parts: [
				{ label: 'codes', parser: Parsers.readBytes(2), skip: true },
				{ label: 'blockSize', parser: Parsers.readByte() },
				{ 
					label: 'preData', 
					parser: function(stream, obj, parent){
						return stream.readBytes(parent.text.blockSize);
					}
				},
				subBlocks
			]
		};

		// application block
		var application = {
			label: 'application',
			requires: function(stream, obj, parent){
				// make sure this frame doesn't already have a gce, text, comment, or image
				// as that means this block should be attached to the next frame
				//if(parent.gce || parent.text || parent.image || parent.comment){ return false; }

				// peek at the top two bytes
				var codes = stream.peekBytes(2);
				return codes[0] === 0x21 && codes[1] === 0xFF;
			},
			parts: [
				{ label: 'codes', parser: Parsers.readBytes(2), skip: true },
				{ label: 'blockSize', parser: Parsers.readByte() },
				{ 
					label: 'id', 
					parser: function(stream, obj, parent){
						return stream.readString(parent.blockSize);
					}
				},
				subBlocks
			]
		};

		// comment block
		var comment = {
			label: 'comment',
			requires: function(stream, obj, parent){
				// make sure this frame doesn't already have a gce, text, comment, or image
				// as that means this block should be attached to the next frame
				//if(parent.gce || parent.text || parent.image || parent.comment){ return false; }

				// peek at the top two bytes
				var codes = stream.peekBytes(2);
				return codes[0] === 0x21 && codes[1] === 0xFE;
			},
			parts: [
				{ label: 'codes', parser: Parsers.readBytes(2), skip: true },
				subBlocks
			]
		};

		// frames of ext and image data
		var frames = {
			label: 'frames',
			parts: [
				gce,
				application,
				comment,
				image,
				text
			],
			loop: function(stream){
				var nextCode = stream.peekByte();
				// rather than check for a terminator, we should check for the existence
				// of an ext or image block to avoid infinite loops
				//var terminator = 0x3B;
				//return nextCode !== terminator;
				return nextCode === 0x21 || nextCode === 0x2C;
			}
		}

		// main GIF schema
		var schemaGIF = [
			{
				label: 'header', // gif header
				parts: [
					{ label: 'signature', parser: Parsers.readString(3) },
					{ label: 'version', parser: Parsers.readString(3) }
				]
			},{
				label: 'lsd', // local screen descriptor
				parts: [
					{ label: 'width', parser: Parsers.readUnsigned(true) },
					{ label: 'height', parser: Parsers.readUnsigned(true) },
					{ label: 'gct', bits: {
						exists: { index: 0 },
						resolution: { index: 1, length: 3 },
						sort: { index: 4 },
						size: { index: 5, length: 3 }
					}},
					{ label: 'backgroundColorIndex', parser: Parsers.readByte() },
					{ label: 'pixelAspectRatio', parser: Parsers.readByte() }
				]
			},{
				label: 'gct', // global color table
				requires: function(stream, obj){
					return obj.lsd.gct.exists;
				},
				parser: Parsers.readArray(3, function(stream, obj){
					return Math.pow(2, obj.lsd.gct.size + 1);
				})
			},
			frames // content frames
		];

		return schemaGIF;
	}
}

// return 
GIF.prototype.decompressFrame = function(index, lastImage){

	// make sure a valid frame is requested
	if(index >= this.raw.frames.length){ return null; }

	var frame = this.raw.frames[index];
	if(frame.image){
		// get the number of pixels
		var totalPixels = frame.image.descriptor.width * frame.image.descriptor.height;

		// do lzw decompression
		var pixels = lzw(frame.image.data.minCodeSize, frame.image.data.blocks, totalPixels);

		// deal with interlacing if necessary
		if(frame.image.descriptor.lct.interlaced){
			pixels = deinterlace(pixels, frame.image.descriptor.width);
		}

		// convert the pixels to their appropriate colors (including transparency if set)
		pixels = getColors(pixels, frame, lastImage, this.raw.lsd, this.raw.gct);

		// setup usable image object
		var image = {
			pixels: pixels,
			width: this.raw.lsd.width,
			height: this.raw.lsd.height
		};

		// add per frame relevant gce information
		if(frame.gce){
			image.delay = frame.gce.delay * 10; // convert to ms
			image.disposalType = frame.gce.extras.disposal;
		}

		return image;		
	}

	// frame does not contains image
	return null;	


	/**
	 * javascript port of java LZW decompression
	 * Original java author url: https://gist.github.com/devunwired/4479231
	 */	
	function lzw(minCodeSize, data, pixelCount) {
 		
 		var MAX_STACK_SIZE = 4096;
		var nullCode = -1;

		var npix = pixelCount;
		var available, clear, code_mask, code_size, end_of_information, in_code, old_code, bits, code, count, i, datum, data_size, first, top, bi, pi;
 
 		var dstPixels = new Array(pixelCount);
		var prefix = new Array(MAX_STACK_SIZE);
		var suffix = new Array(MAX_STACK_SIZE);
		var pixelStack = new Array(MAX_STACK_SIZE + 1);
 
		// Initialize GIF data stream decoder.
		data_size = minCodeSize;
		clear = 1 << data_size;
		end_of_information = clear + 1;
		available = clear + 2;
		old_code = nullCode;
		code_size = data_size + 1;
		code_mask = (1 << code_size) - 1;
		for (code = 0; code < clear; code++) {
			prefix[code] = 0;
			suffix[code] = code;
		}
 
		// Decode GIF pixel stream.
		datum = bits = count = first = top = pi = bi = 0;
		for (i = 0; i < npix; ) {
			if (top == 0) {
				if (bits < code_size) {
					
					// get the next byte			
					datum += data[bi] << bits;

					bits += 8;
					bi++;
					count--;
					continue;
				}
				// Get the next code.
				code = datum & code_mask;
				datum >>= code_size;
				bits -= code_size;
				// Interpret the code
				if ((code > available) || (code == end_of_information)) {
					break;
				}
				if (code == clear) {
					// Reset decoder.
					code_size = data_size + 1;
					code_mask = (1 << code_size) - 1;
					available = clear + 2;
					old_code = nullCode;
					continue;
				}
				if (old_code == nullCode) {
					pixelStack[top++] = suffix[code];
					old_code = code;
					first = code;
					continue;
				}
				in_code = code;
				if (code == available) {
					pixelStack[top++] = first;
					code = old_code;
				}
				while (code > clear) {
					pixelStack[top++] = suffix[code];
					code = prefix[code];
				}
				
				first = suffix[code] & 0xff;

				// Add a new string to the string table,
				if (available >= MAX_STACK_SIZE) {
					break;
				}
				
				pixelStack[top++] = first;
				prefix[available] = old_code;
				suffix[available] = first;
				available++;
				if (((available & code_mask) == 0) && (available < MAX_STACK_SIZE)) {
					code_size++;
					code_mask += available;
				}
				old_code = in_code;
			}
			// Pop a pixel off the pixel stack.
			top--;
			dstPixels[pi++] = pixelStack[top];
			i++;
		}
 
		for (i = pi; i < npix; i++) {
			dstPixels[i] = 0; // clear missing pixels
		}

		return dstPixels;
	}

	// deinterlace function from https://github.com/shachaf/jsgif
	function deinterlace(pixels, width) {
		
		var newPixels = new Array(pixels.length);
		var rows = pixels.length / width;
		var cpRow = function(toRow, fromRow) {
			var fromPixels = pixels.slice(fromRow * width, (fromRow + 1) * width);
			newPixels.splice.apply(newPixels, [toRow * width, width].concat(fromPixels));
		};

		// See appendix E.
		var offsets = [0,4,2,1];
		var steps   = [8,8,4,2];

		var fromRow = 0;
		for (var pass = 0; pass < 4; pass++) {
			for (var toRow = offsets[pass]; toRow < rows; toRow += steps[pass]) {
				cpRow(toRow, fromRow)
				fromRow++;
			}
		}

		return newPixels;
	}

	// convert index values into an actual uint color array
	function getColors(indexes, frame, lastImage, lsd, gct){
		
		var descriptor = frame.image.descriptor;

		var ct = gct;
		if(descriptor.lct.exists){
			ct = frame.image.lct;
		}

		// calculate colors
		// NOTE: for ease of output we convert any smaller frames to full size images
		// make a copy of the last image pixel data to avoid transparency
		var output;
		if(lastImage){
			output = new Uint8ClampedArray(lastImage.pixels);
		}else{
			output = new Uint8ClampedArray(lsd.width * lsd.height * 4);
		}

		var transIndex = null;
		if(frame.gce && frame.gce.extras.transparentColorGiven && lastImage){
			transIndex = frame.gce.transparentColorIndex;
		}
		
		// go through each local pixel and draw it to the correct image pixel
		for(var y=0; y<descriptor.height; y++){
			for(var x=0; x<descriptor.width; x++){
				var localPos = (y*descriptor.width + x);
				var pos = (((descriptor.top + y) * lsd.width) + (descriptor.left + x)) * 4;

				var colIndex = indexes[localPos];
				var color = ct[colIndex];
				if(transIndex == null || transIndex !== colIndex){
					output[pos] = color[0];
					output[pos + 1] = color[1];
					output[pos + 2] = color[2];
					output[pos + 3] = 255;	
				}				
			}	
		}

		return output;
	}
}

// returns all frames decompressed
GIF.prototype.decompressFrames = function(){
	var frames = [];
	var image;
	for(var i=0; i<this.raw.frames.length; i++){
		var frame = this.raw.frames[i];
		if(frame.image){
			image = this.decompressFrame(i, image);
			frames.push(image);
		}
	}
	return frames;
};