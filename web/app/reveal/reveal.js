
angular.module('ruffleWeb.reveal', ['ruffle.pixelator'])
	.service('RevealService', function(){

		var state = {};

		return {
			getState: function() { return state; },
			setImage: function(image){
				state.image = image;
			}
		};
	})
	.controller('RevealCtrl', function($scope, RevealService){
		// $scope.state = RevealService.getState();

		console.log('hi');

		var img = new Image();
		img.onload = function(){
			$scope.state = { image: img };
			$scope.$apply();
		};
		img.src = './img/cat.jpg';

		// RevealService.setImage($scope.items[0].image);
		
	});