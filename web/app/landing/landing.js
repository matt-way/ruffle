
angular.module('ruffleWeb.landing', [])
	.controller('LandingCtrl', function($scope, $stateParams){
		
		$scope.gaOutbound = function(destination){
			ga('send', 'event', 'click', destination);
		}
	});