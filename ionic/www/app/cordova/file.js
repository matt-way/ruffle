
// upload files

angular.module('ruffle.cordova.file', [])
	.service('FileTools', function($ionicPlatform, $q, $http){

		// convert a content:// android url into a file path
		function getTrueLocationAndroid(contentUrl){
			var deferred = $q.defer();
			$ionicPlatform.ready().then(function(){
				FilePath.resolveNativePath(contentUrl, deferred.resolve, deferred.reject);
			});
			return deferred.promise;
		}

		function getTrueLocation(contentUrl){
			return $ionicPlatform.ready().then(function(){
				if(ionic.Platform.isAndroid()){
					return getTrueLocationAndroid(contentUrl);
				}
				return contentUrl;
			});
		}

		// returns the tail end of b, after removing any overlap with a
		function removeOverlap(a, b){
			while(!b.startsWith(a) && a.length > 0){
				a = a.substr(1);
			}
			if(a.length > 0){
				return b.substr(a.length);
			}
			return b;
		}

		// fix a local url given a filesystem
		// TODO: make sure this works for iOS and different tests on android
		function fixLocation(fs, url){
			// remove any root folder overlap (android)
			return removeOverlap(fs.root.nativeURL, url);
		}

		// get a File object from a local url
		function getFile(localUrl){
			var deferred = $q.defer();
			$ionicPlatform.ready().then(function(){
				// get the file system
				requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
					// manipulate the file location to work correctly with the file system
					var loc = fixLocation(fs, localUrl);
					// get the file entry
					fs.root.getFile(loc, null, function(fileEntry){
						// get the actual file
						fileEntry.file(deferred.resolve, deferred.reject);
					}, deferred.reject);
				}, deferred.reject);
			});
			return deferred.promise;
		}

		// read a file object into memory (data url) for use
		function readFile(file){
			var deferred = $q.defer();
			var reader = new FileReader();
			reader.onloadend = function(e){
				// convert typed array to byte array
			    //deferred.resolve(new Uint8Array(e.target.result));
			    deferred.resolve(e.target.result);
			};
			reader.error = function(err){
				deferred.reject(err);
			};
			//reader.readAsArrayBuffer(file);
			reader.readAsDataURL(file);
			return deferred.promise;
		}

		function read(source){
			return getFile(source).then(readFile);
		}

		// https://gist.github.com/borismus/1032746
		var BASE64_MARKER = ';base64,';		 
		function dataUriToBytes(dataURI) {
			var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
			var base64 = dataURI.substring(base64Index);
			var raw = window.atob(base64);
			var rawLength = raw.length;
			var array = new Uint8Array(new ArrayBuffer(rawLength));

			for(i = 0; i < rawLength; i++) {
				array[i] = raw.charCodeAt(i);
			}
			return array;
		}

		function doUpload(data, url){
			var deferred = $q.defer();
		    var xhr = new XMLHttpRequest();
		    xhr.open("PUT", url);
		    xhr.setRequestHeader('x-amz-acl', 'public-read');
		    xhr.setRequestHeader('Content-Type', 'image/jpeg');
		    xhr.onload = function() {
		    	deferred.resolve();
		    };
		    xhr.onerror = function(err) {
		    	deferred.reject(err)
		    };
		    // convert the data uri to byte data for S3
		    xhr.send(dataUriToBytes(data));
		    return deferred.promise;
		}

		// http://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript
		function getExtension(loc){
			return loc.substr(loc.lastIndexOf('.') + 1);
		}

		// check if a location has a given extension
		function isExtension(location, ext){
			return getExtension(location) === ext;
		}

		return {
			getTrueLocation: getTrueLocation,
			isExtension: isExtension,
			read: read,
			upload: doUpload
		};
	});