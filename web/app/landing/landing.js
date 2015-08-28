
angular.module('ruffleWeb.landing', [])
	.controller('LandingCtrl', function($scope, deviceDetector, $stateParams){
		
		$scope.desktop = deviceDetector.isDesktop();
		if(deviceDetector.isDesktop()){
			$scope.androidUrl = 'https://play.google.com/store/apps/details?id=com.ruffle.app';
		}else{
			$scope.androidUrl = 'https://bnc.lt/a/key_live_pdjPBe2mNe2g37By9ynDadlgFDoelgNV';
			if($stateParams.ruffleId){
				$scope.androidUrl += '?id=' + $stateParams.ruffleId;
			}
		}

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