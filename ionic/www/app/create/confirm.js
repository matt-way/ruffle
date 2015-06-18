
angular.module('ruffle.confirm', [])
	.controller('ConfirmCtrl', function($scope, $state, CreateRuffle){

		$scope.state = CreateRuffle.getState();

		$scope.back = function(){
			$state.go('list');
		};

		$scope.next = function(){
			$state.go('list');
		};

	});