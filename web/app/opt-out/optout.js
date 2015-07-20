
angular.module('ruffleWeb.outout', [])
	.controller('OptoutCtrl', function($scope, $state, $stateParams){

		if($stateParams.step == 2){
			$scope.step = 2;
		}else{
			$scope.step = 1;
		}

		$scope.next = function(){
			// $scope.step++;
			$state.go('/2');
		}
	});