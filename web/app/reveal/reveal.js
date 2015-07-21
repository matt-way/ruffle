
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
	.controller('RevealCtrl', function($scope, $stateParams, $http, $state, $location, $anchorScroll, API, ImageLoader, deviceDetector){
		
		var api = API.ruffleFromShort;
		var imageLoc = 'https://s3.amazonaws.com/ruffle-app/';

		//reveal state
		$scope.state = {
			imageLoading: true
		};

		// attempt to get the ruffle using the shortid
		$http.get(api + $stateParams.ruffleId).then(function(result){
			var id = result.data.ruffle.fileId;
			ImageLoader.loadURL(imageLoc + id).then(function(image){
				$scope.state.image = image;
				$scope.state.imageLoading = false;
			});	
		}, function(err){
			// problem getting ruffle (likely invalid id)
			$state.go('landing', true);
		});

		//device detection
		$scope.device = deviceDetector;

		//scroll
		$scope.gotoLanding = function() {
			$location.hash('landing');
		    $anchorScroll();
		};
	});