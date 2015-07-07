
angular.module('ruffle.verify', [])
	.service('Verify', function($q, Auth, API, PhoneNumber){

		var requestData;

		function requestCode(number, country){
			if(country && PhoneNumber.validate(number, country)){
				requestData = {
					phoneNumber: number,
					countryCode: country.code
				};
				return API.inbox.requestCode(requestData).$promise.then(function(result){
					requestData.verifyId = result.verifyId;
				});
			}else{
				return $q.reject('invalid');
			}
		}

		// attempt to confirm code
		function confirmCode(code){
			return API.inbox.verifyCode({
				verifyId: requestData.verifyId,
				verifyCode: code
			}).$promise.then(function(result){
				// if successful, update the config with the inbox and token
				return Auth.verify({
					inboxId: result.inboxId,
					token: result.token
				});
			});
		}

		return {
			requestCode: requestCode,
			confirmCode: confirmCode,
			getState: function() { return requestData; }
		};
	})
	.controller('VerifyCtrl', function($scope, $state, $ionicViewSwitcher, defaultCountry, Verify, PhoneNumber){

		$scope.state = {
			telephone: '',
			checking: false,
			numberError: null,
			numberCorrect: false,
			numberIncorrect: false,
			country: defaultCountry
		};
		
		$scope.checkNumber = function(){
			$scope.state.numberCorrect = PhoneNumber.validate($scope.state.telephone, $scope.state.country);
			$scope.state.numberIncorrect = !$scope.state.numberCorrect;
		};

		$scope.verify = function(){
			$scope.state.numberError = null;
			$scope.state.checking = true;
			Verify.requestCode($scope.state.telephone, $scope.state.country)
				.then(function(){
					//GA verify phone number success event
					window.analytics.trackEvent('Verification', 'Phone Number', 'Success');
					console.log('verify phone success');

					$ionicViewSwitcher.nextDirection('forward');
					$state.go('verifyPin');
				}, function(err){
					if(err === 'invalid'){
						$scope.state.numberError = 'Invalid phone number';

						//GA verify phone number invalid event
						window.analytics.trackEvent('Verification', 'Phone Number', 'Invalid');
						console.log('verify phone invalid');

					}else{
						$scope.state.numberError = 'Server error, please try again';

						//GA verify phone number fail event
						window.analytics.trackEvent('Verification', 'Phone Number', 'Fail');
						console.log('verify phone fail');
					}
				}).finally(function(){
					$scope.state.checking = false;
				});
		};

		$scope.next = function(){

			
		};
	})
.controller('VerifyPinCtrl', function($scope, $state, $ionicViewSwitcher, Verify){

	$scope.state = {
		req: Verify.getState()
	};

	$scope.confirm = function(){
		if(!$scope.state.code || $scope.state.code.length !== 5){
			$scope.state.codeError = 'Invalid code';

			//GA verify invalid code event
			window.analytics.trackEvent('Verification', 'Code', 'Invalid');
			console.log('verify invalid code');

		}else{
			$scope.state.checking = true;
			Verify.confirmCode($scope.state.code).then(function(){

				//GA verify success event
				window.analytics.trackEvent('Verification', 'Code', 'Success');
				console.log('verify success');

				$ionicViewSwitcher.nextDirection('forward');
				$state.go('list', true);
			}, function(err){
				$scope.state.codeError = 'Incorrect code';

				//GA verify incorrect code event
				window.analytics.trackEvent('Verification', 'Code', 'Incorrect');
				console.log('verify incorrect code');

			}).finally(function(){
				$scope.state.checking = false;
			});
		}	
	};

	$scope.retryCode = function(){
		//GA request new code event
		window.analytics.trackEvent('Verification', 'Code', 'New Request');
		console.log('verify new code request');

		$ionicViewSwitcher.nextDirection('back');
		$state.go('verify', true);
	};
});







