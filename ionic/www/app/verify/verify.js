
angular.module('ruffle.verify', [])
	.service('GeoApproximate')
	.controller('VerifyCtrl', function($scope, $state, defaultCountry){

		$scope.country = defaultCountry;

		$scope.next = function(){
			$state.go('verifyPin');
		};
	});