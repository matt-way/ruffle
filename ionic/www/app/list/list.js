
angular.module('ruffle.list', [])
	.controller('ListCtrl', function($scope){

		$scope.items = [];
		for(var i=0; i<10; i++){
			$scope.items.push({
				label: 'label ' + i,
				opened: i%3 == 0
			});
		}
	});