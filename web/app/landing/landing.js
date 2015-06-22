
angular.module('ruffleWeb.landing', ['ng.deviceDetector'])
	.controller('LandingCtrl', function($scope, deviceDetector){
		
		$scope.selectedDevice = null;
		$scope.setDevice = function(device){
			$scope.selectedDevice = device;
		}
		//device detector
		if(deviceDetector.device == 'android' || deviceDetector.device == 'iphone'){
			$scope.selectedDevice = deviceDetector.device;
		}
	});