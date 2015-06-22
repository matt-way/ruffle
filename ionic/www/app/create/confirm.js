
angular.module('ruffle.confirm', [])
	.controller('ConfirmCtrl', function($scope, $state, CreateRuffle, $cordovaToast, $cordovaDialogs){

		var state = CreateRuffle.getState();
		$scope.state = {
			contact: state.contact
		};
		// wait util animated in before loading the image state object
		$scope.$on('$ionicView.afterEnter', function(){
			$scope.state = state;
		});

		// watch changes to the country code so that the number can be properly updated
		$scope.$watch('state.contact.country', function(newValue){
			if(newValue){
				CreateRuffle.updateContact();
			}
		});

		$scope.back = function(){
			$state.go('list', true);
		};

		$scope.send = function(){
			CreateRuffle.send().then(function(){
				// go back to list, clearing the history if send successful
				$state.go('list', true);
			});
		};

		$scope.changeContact = function(){
			CreateRuffle.selectContact();
		};
	});