
angular.module('ruffle.list', ['ruffle.slidable'])
	.service('RuffleList', function(DB, API){

		var state = {
			list: [],
			initialised: initList()
		};

		// load the list from the database
		function initList(){
			/*
			return DB.getFirstPage('ruffle').then(function(items){
				state.list = items;
			});*/
		}

		// check the server for new ruffles
		function getNewRuffles(){
			//API.getRuffles()
		}

		// load the next page of ruffles (if available)
		function paginate(){

		}

		function getState(){
			return state;
		}

		return {
			getState: getState,
			paginate: paginate,
			getNewRuffles: getNewRuffles
		};
	})
	.controller('ListCtrl', function($scope, $state, RuffleList, CreateRuffle){

		$scope.state = RuffleList.getState();

		/*
		$scope.items = [];
		for(var i=0; i<4; i++){
			$scope.items.push({
				label: 'Today at ' + i + ':05pm',
				opened: i
			});
		}*/

		$scope.selectItem = function(item){
			//RevealService.setImage(item.image);
			//$state.go('reveal', { picId: '12345' });
		};

		// create a new ruffle
		$scope.create = function(){
			CreateRuffle.go();
		};
	});