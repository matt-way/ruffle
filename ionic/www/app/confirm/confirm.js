
angular.module('ruffle.confirm', [])
	.controller('ConfirmCtrl', function($scope, $state){

		console.log('confirm');

		$scope.back = function(){
			$state.go('list');
		};

		$scope.next = function(){
			$state.go('list');
		};

	});