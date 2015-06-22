
// utility for parsing data streams into useful objects using a schema

// utility function for grabbing pieces from a data stream
// accepts Uint8Array
function ByteStream(data){
	this.data = data;
	this.pos = 0;
}

// read the next byte off the stream
ByteStream.prototype.readByte = function(){
	return this.data[this.pos++];
};

ByteStream.prototype.peekByte = function(){
	return this.data[this.pos];
};

// read an array of bytes
ByteStream.prototype.readBytes = function(n){
	var bytes = new Array(n);
	for(var i=0; i<n; i++){
		bytes[i] = this.readByte();
	}
	return bytes;
};

ByteStream.prototype.peekBytes = function(n){
	var bytes = new Array(n);
	for(var i=0; i<n; i++){
		bytes[i] = this.data[this.pos + i];
	}
	return bytes;
};

// read a string from a byte set
ByteStream.prototype.readString = function(len){
	var str = '';
	for(var i=0; i<len; i++){
		str += String.fromCharCode(this.readByte());
	}
	return str;
};

// read a single byte and return an array of bit booleans
ByteStream.prototype.readBitArray = function(){
	var arr = [];
	var bite = this.readByte();
	for (var i = 7; i >= 0; i--) {
		arr.push(!!(bite & (1 << i)));
	}
	return arr;
};

ByteStream.prototype.readUnsigned = function(littleEndian){
	var a = this.readBytes(2);
	if(littleEndian){
		return (a[1] << 8) + a[0];	
	}else{
		return (a[0] << 8) + a[1];
	}	
};


function DataParser(data){
	this.stream = new ByteStream(data);
	// the final parsed object from the data
	this.output = {};
}

DataParser.prototype.parse = function(schema){
	// the top level schema is just the top level parts array
	this.parseParts(this.output, schema);	
	return this.output;
};

// parse a set of hierarchy parts providing the parent object, and the subschema
DataParser.prototype.parseParts = function(obj, schema){
	for(var i=0; i<schema.length; i++){
		var part = schema[i];
		this.parsePart(obj, part); 
	}
};

DataParser.prototype.parsePart = function(obj, part){
	var name = part.label;

	// make sure the part meets any parse requirements
	if(part.requires && ! part.requires(this.stream, this.output, obj)){
		return;
	}
	
	if(part.loop){
		// create a parse loop over the parts
		var items = [];
		while(part.loop(this.stream)){
			var item = {};
			this.parseParts(item, part.parts);
			items.push(item);
		}
		obj[name] = items;
	}else if(part.parts){
		// process any child parts
		var value = {};
		this.parseParts(value, part.parts);
		obj[name] = value;
	}else if(part.parser){
		// parse the value using a parser
		var value = part.parser(this.stream, this.output, obj);
		if(!part.skip){
			obj[name] = value;
		}
	}else if(part.bits){
		// convert the next byte to a set of bit fields
		obj[name] = this.parseBits(part.bits);
	}
};

// combine bits to calculate value
function bitsToNum(bitArray){
	return bitArray.reduce(function(s, n) { return s * 2 + n; }, 0);
}

// parse a byte as a bit set (flags and values)
DataParser.prototype.parseBits = function(details){
	var out = {};
	var bits = this.stream.readBitArray();
	for(key in details){
		var item = details[key];
		if(item.length){
			// convert the bit set to value
			out[key] = bitsToNum(bits.slice(item.index, item.index + item.length));
		}else{
			out[key] = bits[item.index];
		}
	}
	return out;
};

// common parsers
var Parsers = {
	// read a byte
	readByte: function(){
		return function(stream){
			return stream.readByte();
		}
	},
	// read an array of bytes
	readBytes: function(length){
		return function(stream){
			return stream.readBytes(length);
		}
	},
	// read a string from bytes
	readString: function(length){
		return function(stream){
			return stream.readString(length);
		}
	},
	// read an unsigned int (with endian)
	readUnsigned: function(littleEndian){
		return function(stream){
			return stream.readUnsigned(littleEndian);
		}
	},
	// read an array of byte sets
	readArray: function(size, countFunc){
		return function(stream, obj, parent){
			var count = countFunc(stream, obj, parent);
			var arr = new Array(count);
			for(var i=0; i<count; i++){
				arr[i] = stream.readBytes(size);
			}
			return arr;
		}
	}
}