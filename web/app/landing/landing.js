
angular.module('ruffleWeb.landing', [])
	.controller('LandingCtrl', function($scope){
		
		$scope.selectedDevice = null;
		$scope.setDevice = function(device){
			$scope.selectedDevice = device;
			ga('send', 'event', 'click', device);
		}

		$scope.gaSubscribe = function(device){
			ga('send', 'event', 'subscribe', device);
		}

		$scope.gaOutbound = function(destination){
			ga('send', 'event', 'click', destination);
		}
	});