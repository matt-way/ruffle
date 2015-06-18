
angular.module('ruffle.verify', [])
	.controller('VerifyCtrl', function($scope, $state){

		console.log('fuck you ');

		//$scope.country = 'US';

		$scope.next = function(){
			$state.go('list');
		};
	});