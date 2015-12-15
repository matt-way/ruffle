
angular.module('ruffle.confirm', [])
	.controller('ConfirmCtrl', function($scope, $state, $ionicHistory, $cordovaToast, $cordovaDialogs, CreationRuffle){

		var state = CreationRuffle.getState();
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
				CreationRuffle.updateContact();
			}
		});

		$scope.back = function(){
			if(state.type === 'create'){
				$state.go('list');
			}else{
				$ionicHistory.goBack();
			}			
		};

		$scope.send = function(){
			CreationRuffle.send().then(function(){
				// go back to list
				$state.go('list');
			});
		};

		$scope.changeContact = function(){
			CreateRuffle.selectContact();
		};
	});