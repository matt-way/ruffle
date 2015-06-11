
angular.module('ruffle.list', ['ruffle.slidable'])
	.controller('ListCtrl', function($scope, $state, $camera, $contacts){

		$scope.items = [];
		for(var i=0; i<10; i++){
			$scope.items.push({
				label: 'label ' + i,
				opened: i%3 == 0
			});
		}

		$scope.selectItem = function(item){
			$state.go('reveal', { picId: '12345' });
		};

		$scope.camera = function(){
			$camera.getPicture({
				sourceType: Camera.PictureSourceType.CAMERA,
			});
		};

		$scope.contacts = function(){
			$contacts.pick();
		};
	});