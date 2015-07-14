
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
	.controller('RevealCtrl', function($scope, ImageLoader, deviceDetector){
		//reveal
		$scope.state = {
			loading: true,
			touching: false
		};
		
		ImageLoader.loadURL('./img/cat.jpg').then(function(image){
			$scope.state.image = image;
			$scope.state.loading = false;
		});

		//mailing list signup
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

		//device detection
		$scope.device = deviceDetector;
	});