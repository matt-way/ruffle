
angular.module('ruffleWeb.landing', [])
	.controller('LandingCtrl', function($scope){
		
		$scope.selectedDevice = null;
		$scope.setDevice = function(device){
			$scope.selectedDevice = device;
			ga('send', 'event', 'click', device);	
			console.log('click' + device);
		}

		$scope.gaSubscribe = function(device){
			ga('send', 'event', 'subscribe', device);
			console.log('subscribe' + device);
		}
	});