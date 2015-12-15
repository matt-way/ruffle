// module for dealing with a UI list of ruffles

angular.module('ruffle.list', [])
	.service('RuffleList', function($q, $timeout, QTools, RuffleDB, RuffleDeletedDB, RuffleLoader, Ruffle, API, Auth, Analytics){

		var state = {
			getQueued: false, // client needs to get ruffles asap
			getting: false, // client is getting new ruffles now
			list: [],
			initialised: initList()
		};

		getNewRuffles(true);
		// check for new ruffles on resume
		document.addEventListener("resume", function(){
			getNewRuffles();
		}, false);

		// initialise the ruffle list from the database
		function initList(){
			return RuffleDB.allDocs({
				limit: 8,
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

		function getNewRuffles(showLoader){
			if(showLoader){
				state.showLoader = true;
			}
			// run a new ruffles check on load or after auth ready
			$q.all([state.initialised, Auth.verified])
				.then(_getNewRuffles)
				.finally(function(){
					state.showLoader = false;
				});
		}

		// grabs any next available ruffles
		function grab(){
			return API.inbox.getRuffles().$promise.then(function(result){
				return processNewRuffles(result.ruffles);
			}).finally(function(){
				if(state.getQueued){
					state.getQueued = false;
					return grab();
				}else{
					state.getting = false;
				}	
			});
		}

		// retrieve and process any new ruffles from the database
		function _getNewRuffles(){
			// if we are currently getting new ruffles, queue up another grab
			if(state.getting){
				state.getQueued = true;
			}else{
				state.getting = true;

				// first grab
				return grab();
			}
		}

		// check if the given ruffle data represents a duplicate
		function isDuplicate(ruffle){
			// check if the ruffle id exists on either the ruffle db or the delete db
			return RuffleDB.get(ruffle._id).then(function(doc){
				return true;
			}, function(err){
				return false;
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
						//GA ruffle receive event
						Analytics.trackEvent('Ruffle', 'Received');

						// create a new ruffle
						var ruffle = new Ruffle(rData);
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

		// attempt to load more ruffles into the list
		function loadMore(){
			return RuffleDB.allDocs({
				limit: 20,
				include_docs: true,
				descending: true,
				startkey: state.list[state.list.length - 1].state._id, // descending from last of the prefix
				endkey: '',
				skip: 1
			}).then(function(items){
				addLocalRuffles(items.rows);
				return items.rows.length > 0;
			});
		}

		// set the currently active ruffle
		function viewRuffle(ruffle){
			state.active = ruffle;
		}

		// if a ruffle didnt load correctly, retry the load process
		function retryRuffle(ruffle){
			ruffle.state.error = false;
			ruffle.state.passText = 'retrying...';
			
			$timeout(function(){
				RuffleLoader.add(ruffle);
			}, 500);			
		}

		// delete a particular ruffle locally
		function deleteRuffle(ruffle){
			return ruffle.delete().then(function(){
				Analytics.trackEvent('Ruffle', 'Deleted');
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
				Analytics.trackEvent('Ruffle', 'Blocked');
				return deleteRuffle(ruffle);
			});
		}

		function getState(){
			return state;
		}

		return {
			getState: function(){ return state; },
			getNewRuffles: getNewRuffles,
			loadMore: loadMore,
			viewRuffle: viewRuffle,
			retryRuffle: retryRuffle,
			deleteRuffle: deleteRuffle,
			blockSender: blockSender
		};
	})
	.controller('ListCtrl', function($scope, $state, $ionicHistory, RuffleList, LocalConfig,
		NewRuffle, Errors, $cordovaDialogs, EULA){

		$scope.state = RuffleList.getState();
		$scope.locals = LocalConfig.values();

		$scope.state.initialised.then(function(){
			$scope.showHelper = true;
		});

		$scope.$on('$ionicView.afterEnter', function(){
			$ionicHistory.clearHistory();
		});

		$scope.selectItem = function(ruffle){
			if(ruffle.state.viewable){
				RuffleList.viewRuffle(ruffle);
				$state.go('reveal', { picId: ruffle.state._id });
			}else if(ruffle.state.error){
				RuffleList.retryRuffle(ruffle);
			}			
		};

		$scope.deleteRuffle = function(item){
			return RuffleList.deleteRuffle(item);
		};

		$scope.blockSender = function(item){
			var msg = 'Are you sure you want to block this sender? This action cannot be undone. You will never receive Ruffles from this person again.';
			return $cordovaDialogs.confirm(msg, 'Block Sender', ['Block', 'Cancel'])
				.then(function(index){
					if(index === 1){
						return RuffleList.blockSender(item);
					}else{
						return $q.when(index === 2);
					}
				});
		};

		// create a new ruffle
		$scope.create = function(){
			// do eula check before sending
			EULA.show().then(function(){
				NewRuffle.create();
			});			
		};

		// inifinite scroll
		$scope.loadMore = function(){
			return RuffleList.loadMore();
		};
	})
	.directive('rfInfiniteScroll', function($parse){
		return {
			link: function(scope, elem, attrs){

				// gap from bottom when infinite scroll should trigger
				var bottomGap = 50;
				// is there potentially still more to load
				var more = true;
				// are we currently running the loader
				var loading = false;
				// the last scroll position (used to prevent multiple calls)
				var lastPos = 0;
				// the scrollable element
				var e = elem[0];
				
				e.addEventListener('scroll', function(){					
					if(!loading && more && e.scrollHeight > e.clientHeight){
						var threshold = e.scrollHeight - e.clientHeight - bottomGap;
						if(e.scrollTop > threshold && lastPos <= threshold){
							var invoker = $parse(attrs.rfInfiniteScroll);
							loading = true;
							invoker(scope).then(function(potentiallyMore){
								more = potentiallyMore;
							}).finally(function(){
								loading = false;
							});
						}
					}
					lastPos = e.scrollTop;
				});
			}
		};
	})
	.filter('views', function(){
	    return function(input){
	        var output = input + ' views';
	        if(input == 1){
	            output = input + ' view';
	        }
	        return output;
	    };
	})
	.filter('mongoIdToDate', function($filter){

		function sameDay(da, db){
			return da.getFullYear() == db.getFullYear() &&
				da.getMonth() == db.getMonth() &&
				da.getDate() == db.getDate();
		}

    	return function(objectId){
			var date = new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
			var now = new Date();

			var time = $filter('date')(date, 'H:mm');

			if(sameDay(date, now)){
				return 'Today, at ' + time;
			}else{
				var dString = $filter('date')(date, 'dd MMM');
				return dString + ', at ' + time;
			}
    	};
	});