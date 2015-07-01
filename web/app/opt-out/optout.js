
angular.module('ruffleWeb.outout', [])
	.controller('OptoutCtrl', function($scope){
		$scope.step = 1;

		$scope.next = function(){
			$scope.step++;
		}
	});