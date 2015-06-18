
// local db wrapper for ruffle

angular.module('ruffle.db', [])
	.service('DB', function(){

		var db = new PouchDB('ruffle', {
			auto_compaction: true
		});

		// index prefix type object
		function PrefixType(){

		}

		return {
			createDBType: function(prefix){
				return new PrefixType(prefix);
			}
		};
	});