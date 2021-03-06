
angular.module('ruffle.ruffle', ['ruffle.slidable'])
	.constant('ConstRuffle', {
		dbType: 'ruffle',
		dbDeletedType: 'deleted_ruffle'
	})
	.service('RuffleDB', function(ConstRuffle, DB){
		return DB.createDBType(ConstRuffle.dbType);
	})
	.service('RuffleDeletedDB', function(ConstRuffle, DB){
		return DB.createDBType(ConstRuffle.dbDeletedType);
	})
	.service('Ruffle', function($q, $timeout, RuffleDB, FileTools, API, ConstRuffle, ImageLoader, Palette){

		function Ruffle(data){
			// setup any missing defaults
			this.state = {
				viewCount: 0,
				downloaded: false,
				processed: false,
				viewable: false,
				confirmed: false,
				passText: 'waiting',
				color: Palette.nextColor()
			};
			angular.extend(this.state, data);

			// setup meta data that can be bound but isn't saved to the db
			this.meta = {
				progress: this.state.downloaded ? 100 : 0
			};
		}

		// check if the downloaded image is valid (not corrupt or broken)
		Ruffle.prototype.validateImage = function(){
			var self = this;
			return ImageLoader.loadURL(self.getFileUrl());
		};

		// check if the associated ruffle is a gif, and update the internal bool if true
		Ruffle.prototype.checkGIF = function(){
			var self = this;
			return ImageLoader.isGIF(self.getFileUrl()).then(function(is){
				self.state.isGIF = is;
				self.state.processed = true;
				return is;
			});		
		};

		Ruffle.prototype.getReference = function(){
			return this.state.reference;
		};

		Ruffle.prototype.getFileUrl = function(){
			return cordova.file.dataDirectory + 'ruffles/' + this.state.fileId;
		};

		// attempt to download and store the associated image
		Ruffle.prototype.download = function(){
			var self = this;
			
			// exit early if already downloaded
			if(self.state.downloaded){
				return $q.when();
			}

			this.state.passText = 'loading...';

			if(self.state.reference){
				// generate random id for gif ruffle
				self.state.fileId = Math.random().toString().slice(2);
			}

			var fileURL = self.getFileUrl();
			var uri;

			if(self.state.reference){
				uri = encodeURI(self.state.reference);
			}else if(self.state.fileId.indexOf('@') === 0){
				uri = encodeURI('https://s3.amazonaws.com/ruffle-server/' + self.state.fileId.substring(1));
				self.state.fromRuffle = true;
			}else{
				uri = encodeURI('https://s3.amazonaws.com/ruffle-app/' + self.state.fileId);
			}

			return FileTools.download(fileURL, uri).then(function(entry){
				// store the url
				//self.state.fileUrl = entry.toURL();

				// even though the file successfully downloaded, we ned to confirm that the image
				// is valid to prevent loading issues
				return self.validateImage().then(function(){
					// update the pass as we have successfully downloaded and stored the image
					self.state.downloaded = true;

					// check if the file is a gif
					return self.checkGIF().then(function(){
						return self.save();
					});
				});
							
			}, function(err){
				return $q.reject(err);
			}, function(progress){
				if(self.meta.progress < 100){
					self.meta.progress = (progress.loaded / progress.total) * 100;	
				}				
			});
		};

		Ruffle.prototype.confirm = function(){
			var self = this;

			// if already confirmed, do nothing
			if(self.state.confirmed){
				return $q.when();
			}

			return API.inbox.confirmRuffle({
				typeId: self.state._id	
			}).$promise.then(function(){
				self.state.confirmed = true;
				return self.save();
			});
		};

		// attempt to reach confirmed state
		Ruffle.prototype.load = function(){
			var self = this;
			return self.download().then(function(){
				// give a time buffer on viewable to make animation smooth
				self.meta.progress = 100;
				self.state.viewable = true;
			}, function(err){
				self.state.passText = 'error loading, touch to retry.';
				self.state.error = true;
			}).finally(function(){
				// confirm as a side effect (no return)
				// NOTE: confirm should occur even with errors, as we are confirming that we
				// have retrieved and saved ruffle meta data, not that a ruffle is viewable
				return self.confirm();
			});
		};

		Ruffle.prototype.increaseViews = function(){
			this.state.viewCount++;
			return this.save();
		};

		Ruffle.prototype.save = function(){
			return RuffleDB.put(this.state);
		};

		Ruffle.prototype.delete = function(){
			var self = this;
			// remove the item from the db
			return RuffleDB.delete(this.state._id, this.state._rev).then(function(){
				// delete the ruffle image (side effect)
				// TODO: maybe there is a better way to handle this for errors
				FileTools.delete(self.getFileUrl()).catch(function(err){
					console.log('error deleting ruffle:', err);
				});
			}, function(err){
				console.log('error removing from db', err);
			});
		};

		return Ruffle;
	})
	// service for helping make a ruffle list load synchronously
	.service('RuffleLoader', function($q){

		var queue = $q.when();

		function add(ruffle){
			queue = queue.finally(function(){
				return ruffle.load();
			});
		}

		return {
			add: add
		};
	});
