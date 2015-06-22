
angular.module('ruffle.verify.pin', [])
	.controller('VerifyPinCtrl', function($scope, $state){

		console.log('hello');

		$scope.next = function(){
			$state.go('list');
		};
	});