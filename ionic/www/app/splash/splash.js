
angular.module('ruffle.splash', [])
	.controller('FirstScreenCtrl', function($scope, $state){

		console.log('fuck you ');

		$scope.next = function(){
			$state.go('verify');
		};
	});