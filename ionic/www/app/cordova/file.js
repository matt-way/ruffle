
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

		/*** direct file writing has issues with with file plugin and filenames ***/
		/*

		function prepareFile(filename){
			var deferred = $q.defer();
			$ionicPlatform.ready().then(function(){
				// get the file system
				requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
a
					// get the file entry
					fs.root.getFile(filename, {
						create: true, 
						exclusive: false
					}, function(fileEntry){
						// create the file writer
						fileEntry.createWriter(deferred.resolve, deferred.reject);
					}, deferred.reject);
				}, deferred.reject);
			});
			return deferred.promise;
		}

		// write some data using a file writer
		function writeFile(writer, data){
			var deferred = $q.defer();

			writer.onwriteend = function(e){
				deferred.resolve();
			};

			writer.error = function(err){
				deferred.reject(err);
			};

			writer.write(data);

			return deferred.promise;
		}

		// write some data to a local file
		function write(localFilename, data){
			return prepareFile(localFilename).then(function(writer){
				return writeFile(writer, data);
			});
		}

		// download a file from a url, returning the data
		function download(url){
			var deferred = $q.defer();
			var req = new XMLHttpRequest();
			req.open('GET', url, true);
			req.responseType = 'arraybuffer';
			req.onload = function(e){
				deferred.resolve(this.response);
			};
			req.onprogress = function(e){
				deferred.notify((e.loaded / e.total) * 100);
			};
			req.error = function(err){
				deferred.reject(err);
			};
			req.send();
			return deferred.promise;
		}*/

		function download(localFilename, fileUrl){
			var deferred = $q.defer();

			$ionicPlatform.ready().then(function(){
				var fileTransfer = new FileTransfer();

				fileTransfer.onprogress = function(e){
					deferred.notify(e);
				};

				fileTransfer.download(fileUrl, localFilename, deferred.resolve, deferred.reject);
			});

			return deferred.promise;
		}

		function doDeletion(entry){
			var deferred = $q.defer();
			entry.remove(deferred.resolve, deferred.reject);
			return deferred.promise;
		}

		// get a File object from a local url
		function getFileEntry(localUrl){
			var deferred = $q.defer();
			$ionicPlatform.ready().then(function(){

				var lastSlash = localUrl.lastIndexOf('/');
				var filename = localUrl.substr(lastSlash + 1);
				var dir = localUrl.substr(0, lastSlash + 1);

				window.resolveLocalFileSystemURL(dir, function (fs) {
					fs.getFile(filename, { create: false }, deferred.resolve, deferred.reject);
				}, deferred.reject);
			});
			return deferred.promise;
		}

		// delete a file given a local url
		function deleteFile(url){
			return getFileEntry(url).then(doDeletion);
		}

		return {
			getTrueLocation: getTrueLocation,
			isExtension: isExtension,
			read: read,
			upload: doUpload,
			//write: write,
			download: download,
			delete: deleteFile
		};
	});