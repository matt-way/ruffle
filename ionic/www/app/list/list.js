
angular.module('ruffle.list', ['ruffle.slidable'])
	.controller('ListCtrl', function($scope, $state, $camera, $contacts){

		$scope.items = [];
		for(var i=0; i<4; i++){
			$scope.items.push({
				label: 'Today at ' + i + ':05pm',
				opened: i
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

		$scope.next = function(){
			$state.go('confirm');
		}
	});