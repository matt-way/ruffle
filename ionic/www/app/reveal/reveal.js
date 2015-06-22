
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

		$scope.$on('$ionicView.afterEnter', function(){
			// get the ruffle image
			var ruffle = RuffleList.getState().active;
			ImageLoader.loadURL('./img/' + ruffle.filename).then(function(image){
				console.log('image loaded');
				$scope.state.image = image;
				$scope.state.loading = false;
			});
		});
	});