
angular.module('ruffle.list', ['ruffle.slidable'])
	.controller('ListCtrl', function($scope, $state, $camera, $contacts, $http, RevealService){

		$scope.items = [];
		for(var i=0; i<4; i++){
			$scope.items.push({
				label: 'Today at ' + i + ':05pm',
				opened: i
			});
		}

		/*
		$http.get('./img/cat.jpg', {
			//responseType: 'arraybuffer'
		}).then(function(result){
			//var gif = new GIF(result.data);
			//$scope.items[0].image = gif;
			$scope.items[0].image = result;
			console.log('loaded image');
		});*/

		var img = new Image();
		img.onload = function(){
			$scope.items[0].image = img;
			$scope.$apply();
		};
		img.src = './img/cat.jpg';

		$scope.selectItem = function(item){
			RevealService.setImage(item.image);
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