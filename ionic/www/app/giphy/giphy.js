angular.module('ruffle.giphy', [])

// preview controller
.controller('GiphyPreviewCtrl', function($scope, $state, $stateParams, $timeout, $ionicHistory, gifs, CreationRuffle, NewRuffle){
	
	$scope.$on('$ionicView.afterEnter', function(){
		// timeout to ensure animation has occurred
		$timeout(function(){
			$scope.gif = gifs.findGifInList($stateParams.id);
		}, 200);		
	});	

	$scope.selectGif = function(){
		// set the image info on the creation ruffle
		CreationRuffle.setImageReference($scope.gif.images.original.url);
		NewRuffle.selectContact().then(function(){
			$state.go('confirm');
		});		
	}

	$scope.back = function(){
		$ionicHistory.goBack();
	};
})

// search controller
.controller('GiphySearchCtrl', function($scope, $state, $stateParams, $ionicHistory, gifs, CreationRuffle, NewRuffle){
	
	$scope.search = { query: false };
	
	//keep list updated
	$scope.state = gifs.getState();

	// run trending on load
	gifs.loadTrending();
	
	$scope.search = function(){
		cordova.plugins.Keyboard.close();
		var query = encodeURIComponent($scope.search.query);
		gifs.search(query);
	};

	$scope.searchMore = function(){
		var offset = $scope.state.list.length;
		var query = encodeURIComponent($scope.search.query);
		gifs.searchMore(query, { offset: offset });	
	};

	$scope.selectGif = function(gif){
		// set the image info on the creation ruffle
		CreationRuffle.setImageReference(gif.images.original.url);
		if($stateParams.type === 'preview'){
			$state.go('giphyPreview', { id: gif.id });
		}else{
			$state.go('confirm');	
		}
	};

	$scope.retry = function(){
		if($scope.state.searchResults){
			$scope.search();
		}else{
			gifs.loadTrending();
		}
	};

	$scope.back = function(){
		$ionicHistory.goBack();
	};
})

// gifs service manages list of gifs
.service('gifs', function(GIPHYAPI){
	var state = {
		list: [],
		loading: false,
		error: null
	};

	// cached trending list
	var trending = [];

	this.getState = function(){
		return state;
	};

	this.loadTrending = function(){
		state.error = null;
		state.list = trending;
		state.searchResults = false;
		//load trending gifs
		GIPHYAPI.trending().then(function(new_gifs){
			trending = new_gifs.data;
			state.list = trending;
		}).catch(function(err){
			state.error = 'Unable to load trending GIFs';
		});	
	}	

	this.search = function(query, options){
		state.error = null;
		state.searchResults = true;
		var params = { q: query };
		state.list = [];

		GIPHYAPI.search(params).then(function(new_gifs){
			state.list = new_gifs.data;
		}).catch(function(err){
			state.error = 'Unable to load GIFs';
		});
	};

	this.findGifInList = function(id){
		for(var i=0; i<state.list.length; i++){
			if(state.list[i].id === id){
				return state.list[i];
			}
		}
		return null;
	};

	this.searchMore = function(query, options){
		var params = {};
		state.more = true;
		if(options){
			params = options;
			options.q = query;
		}else{
			params = { q: query };
		}

		GIPHYAPI.search(params).then(function(new_gifs){
			state.list = state.list.concat(new_gifs.data);
		}).finally(function(){
			state.more = false;
		});
	};
})

// service calls Giphy API
.service('GIPHYAPI', function($http, Config){
	
	var config = Config.values();

	// call the giphy api
	function giphyCall(type, params){
		var url = 'http://api.giphy.com/v1/gifs/';
		if(type){ url += type; }

		var opt = { params: params || {} };
		opt.params.api_key = config.giphy;

		return $http.get(url, opt).then(function(response){
			return response.data;
		});
	}

	// Search gifs by word or phrase

	// q - search query term or phrase
	// limit - (optional) number of results to return, maximum 100. Default 25.
	// offset - (optional) results offset, defaults to 0.
	// rating - limit results to those rated (y,g, pg, pg-13 or r).
	// fmt - (optional) return results in html or json format (useful for viewing responses as GIFs to debug/test)
	this.search = function(params){
		return giphyCall('search', params);
	}

	// Return trending gifs

	// limit (optional) limits the number of results returned. By default returns 25 results.
	// rating - limit results to those rated (y,g, pg, pg-13 or r).
	// fmt - (optional) return results in html or json format (useful for viewing responses as GIFs to debug/test)
	this.trending = function(){
		return giphyCall('trending');
	};

	// return a specific gif
	this.gif = function(id){
		return giphyCall(id);
	};

	// Takes an array of ids and returns gifs
	this.gifs = function(ids){
		return giphyCall('', {
			ids: ids.join()
		});
	};
})
.directive('bricks', function($state){

	return {
		scope: {
			gifs: '=bricks',
			selectGif: '&select',
		},
		templateUrl: 'app/giphy/bricks.html',
		link: function(scope, elem, attrs){

			// for checking existence of appropriate gif keys
			function deeptest(obj, key){
				key = key.split('.');
				while(obj && key.length){
					obj = obj[key.shift()];
				}
				return obj;
			}

			// get the shortest column
			function getShortest(){
				var minCol = scope.columns[0];
				for(var c=1; c<scope.columns.length; c++){
					if(scope.columns[c].height < minCol.height){
						minCol = scope.columns[c];
					}
				}
				return minCol;
			}

			var cols = parseInt(attrs.columns);

			scope.$watch('gifs', function(gifs){
				// reset the columns
				scope.columns = [];
				for(var c=0; c<cols; c++){
					scope.columns.push({
						height: 0,
						gifs: []
					});
				}
				
				// add the gifs to the correct columns
				angular.forEach(gifs, function(gif){
					if(deeptest(gif, 'images.fixed_width_downsampled.url')){
						var col = getShortest();
						col.height += parseInt(gif.images.fixed_width_downsampled.height);
						col.gifs.push(gif);
					}
				});
			});

			scope.select = function(gif){
				scope.selectGif({ gif: gif });
			};
		}
	};
});