
angular.module('ruffleWeb.reveal', ['ruffle.loader', 'ruffle.pixelator'])
	.service('RevealService', function(){

		var state = {};

		return {
			getState: function() { return state; },
			setImage: function(image){
				state.image = image;
			}
		};
	})
	.controller('RevealCtrl', function($scope, ImageLoader){

		$scope.state = {
			loading: true,
			touching: false
		};
		
		ImageLoader.loadURL('./img/cat.jpg').then(function(image){
			$scope.state.image = image;
			$scope.state.loading = false;
		});
	});