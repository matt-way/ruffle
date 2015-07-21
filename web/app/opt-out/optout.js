
angular.module('ruffleWeb.optout', ['ruffleWeb.optout.number'])
	.service('OptoutService', function(){

		var state = {};

		return {
			getState: function(){ return state; }
		};
	})
	.controller('OptoutCtrl', function($scope, $state, $stateParams, $http, OptoutService, PhoneNumber, API){

		var api = API.globalBlock;

		$scope.step = $stateParams.step || 1;
		$scope.state = OptoutService.getState();

		var verifyId;

		// user enters phone number for global block request
		$scope.request = function(){
			if($scope.loading){ return; }

			$scope.error = null;

			if(!$scope.number){
				$scope.error = 'A phone number must be entered';
				return;
			}

			// attempt to get the country code from the number
			var country = PhoneNumber.suggestRegion($scope.number);

			// get the user entered phone number and check its validity
			if(country && PhoneNumber.validate($scope.number, country)){
				
				$scope.state.fullNumber = PhoneNumber.format($scope.number, country);

				// request a code
				$scope.loading = true;
				$http.post(api + 'request', {
					phoneNumber: $scope.state.fullNumber,
					countryCode: country.code
				}).then(function(result){
					$scope.loading = false;
					// success
					$scope.state.verifyId = result.data.verifyId;
					$state.go('optout', { step: '2' });
				}, function(err){
					$scope.loading = false;
					$scope.error = 'Error requesting block code from server.';
				});	
			}else{
				$scope.error = 'Invalid phone number entered.';
			}
		};

		// user enters validation code for global block
		$scope.verify = function(){
			if($scope.loading){ return; }

			$scope.error = null;

			if($scope.code && $scope.code.length === 5){
				$http.post(api + 'verify', {
					verifyId: $scope.state.verifyId,
					verifyCode: $scope.code
				}).then(function(){
					$scope.loading = false;
					// success
					$state.go('optout', { step: '3' });
				}, function(err){
					$scope.loading = false;
					$scope.error = 'Error verifying block code. Invalid code or server error.';
				});
			}else{
				$scope.error = 'Invalid code entered';
			}
		};
	});