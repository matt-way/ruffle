
angular.module('ruffle.reveal', ['ruffle.pixelator'])
	.service('RevealService', function(){

		var state = {};

		return {
			getState: function() { return state; },
			setImage: function(image){
				state.image = image;
			}
		};
	})
	.controller('RevealCtrl', function($scope, RuffleList, ImageLoader){

		$scope.state = { loading: true };

		$scope.ruffle = RuffleList.getState().active;

		$scope.$on('$ionicView.afterEnter', function(){
			ImageLoader.loadURL($scope.ruffle.state.fileUrl, $scope.ruffle.state.isGIF).then(function(image){
				$scope.ruffle.increaseViews();
				$scope.state.image = image;
				$scope.state.loading = false;
			});
		});
	});