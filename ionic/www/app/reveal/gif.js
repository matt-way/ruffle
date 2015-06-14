
function GIF(arrayBuffer){
	// convert to byte array
	var byteData = new Uint8Array(arrayBuffer);
	var parser = new DataParser(byteData);
	// parse the data
	this.raw = parser.parse(getSchema());
	// process into usable images
	this.images = decompress(this.raw.frames, this.raw.gct);

	// slightly modified lzw decompression from https://github.com/shachaf/jsgif
	function lzw(minCodeSize, data) {		
		var pos = 0;

		// read the next size in bits from the data stream
		var readCode = function(size) {
			var code = 0;
			for (var i = 0; i < size; i++) {
				if (data[pos >> 3] & (1 << (pos & 7))) {
					code |= 1 << i;
				}
				pos++;
			}
			return code;
		};

		var clearCode = 1 << minCodeSize;
		var eoiCode = clearCode + 1;
		var codeSize = minCodeSize + 1;

		var output = [];
		var dict = [];
		var clear = function() {
			dict = [];
			codeSize = minCodeSize + 1;
			for (var i = 0; i < clearCode; i++) {
				dict[i] = [i];
			}
			dict[clearCode] = [];
			dict[eoiCode] = null;
		};

		var code, last;

		while (true) {
			last = code;
			code = readCode(codeSize);

			if (code === clearCode) {
				clear();
				continue;
			}
			if (code === eoiCode) { break; }

			if (code < dict.length) {
				if (last !== clearCode) {
					dict.push(dict[last].concat(dict[code][0]));
				}
			} else {
				dict.push(dict[last].concat(dict[last][0]));
			}
			output = output.concat(dict[code]);
			//output.push.apply(output, dict[code]);

			if (dict.length === (1 << codeSize) && codeSize < 12) {
				codeSize++;
			}
		}

		return output;
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

	function getColors(indexes, frame, gct){
		
		var descriptor = frame.image.descriptor;

		var ct = gct;
		if(descriptor.lct.exists){
			ct = frame.image.lct;
		}

		// calculate colors
		var output = new Array(indexes.length * 4);
		for(var i=0; i<indexes.length; i++){
			var color = ct[indexes[i]];
			var pos = i*4;

			output[pos] = color[0];
			output[pos+1] = color[1];
			output[pos+2] = color[2];
			output[pos+3] = 255;
		}

		// add transparency
		if(frame.gce && frame.gce.extras.transparentColorGiven){
			var transIndex = image.gce.transparentColorIndex;
			for(var i=0; i<indexes.length; i++){
				if(indexes[i] === transIndex){
					output[(i * 4) + 3] = 0;
				}
			}
		}

		return output;
	}

	function decompress(frames, gct){
		var images = [];
		for(var i=0; i<frames.length; i++){
			var frame = frames[i];
			if(frame.image){
				// do lzw decompression
				var pixels = lzw(frame.image.data.minCodeSize, frame.image.data.blocks);

				// deal with interlacing if necessary
				if(frame.image.descriptor.lct.interlaced){
					pixels = deinterlace(pixels, frame.image.descriptor.width);
				}

				// convert the pixels to their appropriate colors (including transparency if set)
				pixels = getColors(pixels, frame, gct);

				// setup usable image object
				var image = {
					pixels: pixels
				};

				// add per frame relevant gce information
				if(frame.gce){
					image.delay = frame.gce.delay;
					image.disposalType = frame.gce.extras.disposal;
				}

				images.push(image);
			}
		}
		return images;
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