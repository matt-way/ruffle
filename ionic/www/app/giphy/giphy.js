angular.module('ruffle.giphy', [])

// preview controller
.controller('GiphyPreviewCtrl', function($scope, $state, $stateParams, $ionicHistory, gifs, CreationRuffle, NewRuffle){
	
	gifs.findGifInList($stateParams.id, function(gif){
		$scope.gif = gif;
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
	
	$scope.search = function(){
		var query = encodeURIComponent($scope.search.query);
		gifs.search(query);
	};

	$scope.searchMore = function(){
		var offset = $scope.list.length;
		var query = encodeURIComponent($scope.search.query);
		console.log(offset);

		gifs.searchMore(query, { offset: offset });	
	};

	$scope.selectGif = function(gif){
		// set the image info on the creation ruffle
		CreationRuffle.setImageReference(gif.images.original.url);
		if($stateParams.type === 'preview'){
			$state.go('giphyPreview', { id: gif.id });
		}else{
			NewRuffle.selectContact().then(function(){
				$state.go('confirm');
			});	
		}
	};

	$scope.back = function(){
		$ionicHistory.goBack();
	};
})

// gifs service manages list of gifs
.service('gifs', function(GIPHYAPI){
	var state = {
		list: []
	};

	this.getState = function(){
		return state;
	};

	//load trending gifs
	GIPHYAPI.trending(function(new_gifs){
		state.list = new_gifs.data;
	});

	this.search = function(query, options){
		var params = { q: query };

		GIPHYAPI.search(params, function(new_gifs){
			list = new_gifs.data;
		});
	};

	this.findGifInList = function(id, callback){
		state.list.forEach(function(gif){
			if(gif.id === id){
				callback(gif);
			}
		});
	};

	this.searchMore = function(query, options){
		var params = {};
		if(options){
			params = options;
			options.q = query;
		}else{
			params = { q: query };
		}

		GIPHYAPI.search(params, function(new_gifs){
			state.list = state.list.concat(new_gifs.data);
		})
	};
})

// service calls Giphy API
.service('GIPHYAPI', function($http){
	var betaKey = 'dc6zaTOxFJmzC';

	// Search gifs by word or phrase

	// q - search query term or phrase
	// limit - (optional) number of results to return, maximum 100. Default 25.
	// offset - (optional) results offset, defaults to 0.
	// rating - limit results to those rated (y,g, pg, pg-13 or r).
	// fmt - (optional) return results in html or json format (useful for viewing responses as GIFs to debug/test)
	this.search = function(params, callback){
		var url = 'http://api.giphy.com/v1/gifs/search';
		var opt = { params: params };
		opt.params.api_key = betaKey;

		$http.get(url, opt)
		.then(function(response){
			callback(response.data);
		});
	}

	// Return trending gifs

	// limit (optional) limits the number of results returned. By default returns 25 results.
	// rating - limit results to those rated (y,g, pg, pg-13 or r).
	// fmt - (optional) return results in html or json format (useful for viewing responses as GIFs to debug/test)
	this.trending = function(callback){
		var url = 'http://api.giphy.com/v1/gifs/trending';
		var opt = { params: { api_key: betaKey } };

		$http.get(url, opt)
		.then(function(response){
			callback(response.data);
			trending_page = response.data.pagination;
		});
	}

	// return a gif
	this.gif = function(id, callback){
		var url = 'http://api.giphy.com/v1/gifs/' + id;
		var opt = { params: { api_key: betaKey } };

		$http.get(url, opt)
		.then(function(response){
			callback(response.data);
		});
	}

	// Takes an array ff ids and returns gifs
	this.gifs = function(ids, callback){
		var url = 'http://api.giphy.com/v1/gifs';
		var opt = { params: { api_key: betaKey } };
		opt.params.ids = ids.join();

		$http.get(url, opt)
		.then(function(response){
			callback(response.data);
		});
	}
})
.directive('bricks', function($state) {

	function link(scope, element, attrs){
		var gifs = [];
		var cols = 2;
		var collection = [];
		
		// watch for gifs
		scope.$watch('gifs', function(g){
			//create empty cols
			for(i = 0; i < cols; i++){
				collection[i] = {
					height: 0,
					gifs: []
				};
			}

			gifs = g;

			for(j = 0; j < gifs.length + 1; j++){
				if(j < gifs.length){
					//loop through gifs, push each to shortest col
					// collection[j%cols].push(gifs[j]);

					//find the shortest collumn
					var a = collection[0].height;
					var b = collection[1].height;
					if(b < a){
						//go right
						collection[1].gifs.push(gifs[j]);
						collection[1].height += parseInt(gifs[j].images.fixed_width_downsampled.height);
					}else{
						//go left
						collection[0].gifs.push(gifs[j]);
						collection[0].height += parseInt(gifs[j].images.fixed_width_downsampled.height);
					}
				}else{
					//after loop update scope
					scope.collection = collection;
				}
			}
		});

		scope.select = function(gif){
			scope.selectGif({ gif: gif });
		};
	}

	return {
		scope: {
			gifs: '=',
			selectGif: '&select',
		},
		templateUrl: 'app/giphy/bricks.html',
		link: link
	};
});