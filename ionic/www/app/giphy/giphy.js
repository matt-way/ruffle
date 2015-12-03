angular.module('ruffle.giphy', [])
.controller('GiphySearchCtrl', ['$rootScope', '$scope', 'gifs', function($rootScope, $scope, gifs){
	$scope.list = [];
	$scope.search = { query: false };

	//keep list updated
	$rootScope.$on('gifs-update', function(){
		gifs.getList(function(l){
			$scope.list = l;
		})
	})

	$scope.search = function(){
		var query = encodeURIComponent($scope.search.query);
		gifs.search(query);
	}

	$scope.searchMore = function(){
		var offset = $scope.list.length;
		var query = encodeURIComponent($scope.search.query);
		console.log(offset);

		gifs.searchMore(query, { offset: offset });	
	}

	$scope.selectGif = function(gif){
		console.log('hi');
	}
}])
.service('gifs', ['$rootScope', 'GIPHY', function($rootScope, GIPHY){
	var list = [];

	//load trending gifs
	GIPHY.trending(function(new_gifs){
		list = new_gifs.data;
		$rootScope.$broadcast('gifs-update');
	});

	this.getList = function(callback){
		callback(list);
	}

	this.search = function(query, options){
		var params = { q: query };

		GIPHY.search(params, function(new_gifs){
			console.log(new_gifs);
			list = new_gifs.data;
			$rootScope.$broadcast('gifs-update');
		})
	}

	this.searchMore = function(query, options){
		var params = {};
		if(options){
			params = options;
			options.q = query;
		}else{
			params = { q: query };
		}

		GIPHY.search(params, function(new_gifs){
			list = list.concat(new_gifs.data);
			$rootScope.$broadcast('gifs-update');
		})
	}


}])
.service('GIPHY', ['$http', function($http){
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
}])
.directive('bricks', function() {

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
	}

	return {
		scope: {
			gifs: '='
		},
		templateUrl: 'app/giphy/bricks.html',
		link: link
	};
});