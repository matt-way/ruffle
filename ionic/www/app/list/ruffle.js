
angular.module('ruffle.list', ['ruffle.slidable'])
	.constant('ConstRuffle', {
		dbType: 'ruffle',
		dbDeletedType: 'deleted_ruffle',
		passes: {
			waiting: 0,
			downloading: 1,
			downloadingComplete: 2,
			processing: 3,
			processingComplete: 4,
			confirming: 5,
			confirmed: 6
		}
	})
	.service('RuffleDB', function(ConstRuffle, DB){
		return DB.createDBType(ConstRuffle.dbType);
	})
	.service('RuffleDeletedDB', function(ConstRuffle, DB){
		return DB.createDBType(ConstRuffle.dbDeletedType);
	})
	.service('Ruffle', function($q, RuffleDB, FileTools, API, ConstRuffle){

		function Ruffle(data){
			// setup any missing defaults
			this.state = {
				viewCount: 0,
				downloaded: false,
				processed: false,
				confirmed: false
				passText: 'waiting'
			};
			angular.extend(this.state, data);

			// setup meta data that can be bound but isn't saved to the db
			this.meta = {
				progress: 0
			};
		}

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
				//return self.save();				
			}, function(err){
				return err;
			}, function(progress){
				self.meta.progress = (progress.loaded / progress.total) * 100;
			});
		}

		Ruffle.prototype.confirm = function(){
			/*return API.inbox.confirmRuffle({
				ruffleId: this.state._id	
			}).$promise;*/
		}

		// attempt to reach confirmed state
		Ruffle.prototype.load = function(){
			var self = this;
			return self.download().then(function(){
				// confirm as a side effect (no return)
				self.confirm();
			}, function(err){
				self.state.error = true;
			});
		}

		Ruffle.prototype.save = function(){
			return RuffleDB.put(this.state);
		};

		return Ruffle;
	})
	// service for helping make a ruffle list load synchronously
	.service('RuffleLoader', function($q){

		var queue = $q.when();

		function add(ruffle){
			queue = queue.then(function(){
				ruffle.load();
			});
		}

		return {
			add: add
		};
	})
	.service('RuffleList', function($q, QTools, RuffleDB, RuffleDeletedDB, RuffleLoader, Ruffle, API, Auth){

		var state = {
			getQueued: false, // client needs to get ruffles asap
			getting: false, // client is getting new ruffles now
			list: [],
			initialised: initList()
		};

		// run a new ruffles check on load or after auth ready
		$q.all([state.initialised, Auth.verified]).then(getNewRuffles);

		// initialise the ruffle list from the database
		function initList(){
			return RuffleDB.allDocs({
				limit: 10,
				include_docs: true,
				descending: true,
				startkey: '\uffff', // descending from last of the prefix
				endkey: ''
			}).then(function(items){
				var rows = [items.rows[1]];
				//console.log(rows);
				//console.log(items.rows);
				//addLocalRuffles(items.rows);
				addLocalRuffles(rows);
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

		// retrieve and process any new ruffles from the database
		function getNewRuffles(){
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
				return RuffleDeletedDB.get(ruffle._id).then(function(doc){
					return true;
				}, function(err){
					return false;
				});
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
						console.log(ruffle);
						return ruffle.save().then(function(){
							RuffleLoader.add(ruffle);
							list.push(ruffle);
						}); 						
					}
				});
			}).finally(function(){
				// add newest ruffles to the top of the list
				state.list = list.reverse().concat(state.list);
			});
		}

		// set the currently active ruffle
		function setActive(ruffle){
			state.active = ruffle;
		}

		function getState(){
			return state;
		}

		return {
			getState: function(){ return state; },
			getNewRuffles: getNewRuffles,
			//paginate: paginate,
			setActive: setActive
		};
	})
	.controller('ListCtrl', function($scope, $state, RuffleList, CreateRuffle,
		API, $http, CreateRuffle, FileTools){

		$scope.state = RuffleList.getState();

		$scope.selectItem = function(item){
			RuffleList.setActive(item);
			//RevealService.setImage(item.image);
			$state.go('reveal', { picId: '12345' });
		};

		// create a new ruffle
		$scope.create = function(){
			CreateRuffle.go().then(function(){
				$state.go('confirm');
			});
		};
	});