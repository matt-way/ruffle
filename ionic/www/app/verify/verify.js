
angular.module('ruffle.verify', [])
	.service('Verify', function(Config, API){

	})
	.controller('VerifyCtrl', function($scope, $state, defaultCountry, Config){

		$scope.country = defaultCountry;

		$scope.verify = function(){
			Verify.
		}

		$scope.next = function(){

			Config.update({
				someKey: '12345',
				another: 'this is some text'
			}).then(function(obj){
				console.log(obj);
				$state.go('list');
				$state.go('verifyPin');
			});
		};
	});