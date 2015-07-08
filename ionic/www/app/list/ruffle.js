
angular.module('ruffle.list', ['ruffle.slidable'])
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
	})
	.service('RuffleList', function($q, QTools, RuffleDB, RuffleDeletedDB, RuffleLoader, Ruffle, API, Auth, Analytics){

		var state = {
			getQueued: false, // client needs to get ruffles asap
			getting: false, // client is getting new ruffles now
			list: [],
			initialised: initList()
		};

		getNewRuffles();

		// initialise the ruffle list from the database
		function initList(){
			return RuffleDB.allDocs({
				limit: 10,
				include_docs: true,
				descending: true,
				startkey: '\uffff', // descending from last of the prefix
				endkey: ''
			}).then(function(items){
				addLocalRuffles(items.rows);
			});
		}

		// add local ruffles to bottom of list
		function addLocalRuffles(items){
			// go through each ruffle and preprocess
			var ruffles = [];
			angular.forEach(items, function(item){
				var ruffle = new Ruffle(item.doc);
				RuffleLoader.add(ruffle);
				ruffles.push(ruffle);
			});
			state.list = state.list.concat(ruffles);
		}

		function getNewRuffles(){
			// run a new ruffles check on load or after auth ready
			$q.all([state.initialised, Auth.verified]).then(_getNewRuffles);
		}

		// retrieve and process any new ruffles from the database
		function _getNewRuffles(){
			// if we are currently getting new ruffles, queue up another grab
			if(state.getting){
				state.getQueued = true;
			}else{
				state.getting = true;

				function grab(){
					return API.inbox.getRuffles().$promise.then(function(result){
						return processNewRuffles(result.ruffles);
					}).finally(function(){
						if(state.getQueued){
							state.getQueued = false;
							grab();
						}else{
							state.getting = false;
						}	
					});
				}

				// first grab
				grab();
			}
		}

		// check if the given ruffle data represents a duplicate
		function isDuplicate(ruffle){
			// check if the ruffle id exists on either the ruffle db or the delete db
			return RuffleDB.get(ruffle._id).then(function(doc){
				return true;
			}, function(err){
				return false;
				/*
				return RuffleDeletedDB.get(ruffle._id).then(function(doc){
					return true;
				}, function(err){
					return false;
				});*/
			});
		}

		// process incoming new ruffle set data
		// assumes reverse time order (to avoid sorting)
		function processNewRuffles(ruffles){
			// new list to add
			var list = [];

			// do oldest first so we preserve order, and dont need to do sorting
			return QTools.forEach(ruffles, function(rData){
				return isDuplicate(rData).then(function(isDup){
					if(!isDup){
						// create a new ruffle
						var ruffle = new Ruffle(rData);
						return ruffle.save().then(function(){
							RuffleLoader.add(ruffle);
							list.push(ruffle);
						});

						//GA ruffle receive event
						Analytics.trackEvent('Ruffle', 'Received');
					}
				});
			}).finally(function(){
				// add newest ruffles to the top of the list
				state.list = list.reverse().concat(state.list);
			});
		}

		// set the currently active ruffle
		function viewRuffle(ruffle){
			state.active = ruffle;
		}

		// delete a particular ruffle locally
		function deleteRuffle(ruffle){
			return ruffle.delete().then(function(){
				// remove the deleted item from the list
				for(var i=0; i<state.list.length; i++){
					if(state.list[i].state._id === ruffle.state._id){
						state.list.splice(i, 1);
						break;
					}
				}
			});
		}

		// block a particular ruffle
		function blockSender(ruffle){
			return API.inbox.blockSender({ typeId: ruffle.state._id }).$promise.then(function(){
				return deleteRuffle(ruffle);
			});
		}

		function getState(){
			return state;
		}

		return {
			getState: function(){ return state; },
			getNewRuffles: getNewRuffles,
			//paginate: paginate,
			viewRuffle: viewRuffle,
			deleteRuffle: deleteRuffle,
			blockSender: blockSender
		};
	})
	.controller('ListCtrl', function($scope, $state, RuffleList, CreateRuffle,
		API, $http, CreateRuffle, FileTools){

		$scope.state = RuffleList.getState();

		// launch a get new ruffles check every time the list is shown
		RuffleList.getNewRuffles();

		$scope.state.initialised.then(function(){
			$scope.showHelper = true;
		});

		$scope.selectItem = function(ruffle){
			if(ruffle.state.viewable){
				RuffleList.viewRuffle(ruffle);
				$state.go('reveal', { picId: ruffle.state._id });
			}			
		};

		$scope.deleteRuffle = function(item){
			return RuffleList.deleteRuffle(item);
		};

		$scope.blockSender = function(item){
			return RuffleList.blockSender(item);
		};

		// create a new ruffle
		$scope.create = function(){
			CreateRuffle.go().then(function(){
				$state.go('confirm');
			});
		};
	})
	.filter('views', function(){
	    return function(input){
	        var output = input + ' views';
	        if(input == 1){
	            output = input + ' view';
	        }
	        return output;
	    }
	})
	.filter('mongoIdToDate', function(){
    return function(objectId){
        var date = parseInt(objectId.substring(0, 8), 16) * 1000;
        return date;
    }
});