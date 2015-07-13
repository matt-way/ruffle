
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

		// check if the associated ruffle is a gif, and update the internal bool if true
		Ruffle.prototype.checkGIF = function(){
			var self = this;
			return ImageLoader.isGIF(self.state.fileUrl).then(function(is){
				self.state.isGIF = is;
				self.state.processed = true;
				return is;
			});		
		};

		// attempt to download and store the associated image
		Ruffle.prototype.download = function(){
			var self = this;
			
			// exit early if already downloaded
			if(self.state.downloaded){
				return $q.when();
			}

			this.state.passText = 'loading...';

			var fileURL = cordova.file.dataDirectory + 'ruffles/' + self.state.fileId;
			var uri = encodeURI('https://s3.amazonaws.com/ruffle-app/' + self.state.fileId);

			return FileTools.download(fileURL, uri).then(function(entry){
				// store the url
				self.state.fileUrl = entry.toURL();
				// update the pass as we have successfully downloaded and stored the image
				self.state.downloaded = true;

				// check if the file is a gif
				return self.checkGIF().then(function(){
					return self.save();
				});			
			}, function(err){
				return err;
			}, function(progress){
				if(self.meta.progress < 100){
					self.meta.progress = (progress.loaded / progress.total) * 100;	
				}				
			});
		}

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
		}

		// attempt to reach confirmed state
		Ruffle.prototype.load = function(){
			var self = this;
			return self.download().then(function(){
				// give a time buffer on viewable to make animation smooth
				self.meta.progress = 100;
				self.state.viewable = true;

				// confirm as a side effect (no return)
				return self.confirm();
			}, function(err){
				self.state.passText = 'error loading, touch to retry.';
				self.state.error = true;
			});
		}

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
				FileTools.delete(self.state.fileUrl).catch(function(err){
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
