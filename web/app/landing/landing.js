
angular.module('ruffleWeb.landing', [])
	.controller('LandingCtrl', function($scope){
		
		$scope.platform = false;
		$scope.setPlatform = function(platform){
			$scope.platform = platform;
		}
	});