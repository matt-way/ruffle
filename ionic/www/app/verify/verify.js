
angular.module('ruffle.verify', [])
	.controller('VerifyCtrl', function($scope, $state){

		console.log('fuck you ');

		$scope.next = function(){
			$state.go('verifyPin');
		};
	});