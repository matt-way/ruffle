
// local db wrapper for ruffle

angular.module('ruffle.db', [])
	.service('DB', function(){

		var db = new PouchDB('ruffle', {
			auto_compaction: true
		});

		// pouchdb item wrapper for auto index prefixing
		function PrefixType(prefix){
			this._prefix = prefix;
		}

		// prefix a string
		PrefixType.prototype.prefix = function(inner){
			return this._prefix + '_' + inner;
		};

		// prefix a set of keys on an object
		PrefixType.prototype.prefixKeys = function(obj, keys){
			var self = this;
			angular.forEach(keys, function(key){
				if(obj[key]){
					obj[key] = self.prefix(obj[key]);
				}
			});
		}

		// remove a prefix (assumes it exists)
		PrefixType.prototype.deprefix = function(inner){
			return inner.substr(this._prefix.length + 1);
		};

		// create a new pouchdb object
		PrefixType.prototype.put = function(obj){
			obj._id = this.prefix(obj._id);
			return db.put(obj);
		};

		// get an item by id
		PrefixType.prototype.get = function(id){
			var self = this;
			return db.get(self.prefix(id)).then(function(doc){
				doc._id = self.deprefix(doc._id);
				return doc;
			});
		};		

		// get a multiple selection of objects
		PrefixType.prototype.allDocs = function(options){
			var self = this;
			// prefix any relevant option values
			var keys = ['startkey', 'endkey'];
			this.prefixKeys(options, keys);

			return db.allDocs(options).then(function(docs){
				for(var i=0; i<docs.length; i++){
					var doc = docs[i];
					doc._id = self.deprefix(doc._id);
				}
				return docs;
			});
		};

		return {
			createDBType: function(prefix){
				return new PrefixType(prefix);
			}
		};
	});