
angular.module('ruffle.list', ['ruffle.slidable'])
	.service('RuffleList', function(DB, API){

		var state = {
			list: [],
			initialised: initList()
		};

		var imgs = ['bb.gif', 'cat.jpg', 'bend.gif', 'homer.gif'];

		for(var i=0; i<4; i++){
			state.list.push({
				label: 'Today at ' + i + ':05pm',
				opened: i,
				filename: imgs[i]
			});
		}

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

		// set the currently active ruffle
		function setActive(ruffle){
			state.active = ruffle;
		}

		function getState(){
			return state;
		}

		return {
			getState: getState,
			paginate: paginate,
			getNewRuffles: getNewRuffles,
			setActive: setActive
		};
	})
	.controller('ListCtrl', function($scope, $state, RuffleList, CreateRuffle){

		$scope.state = RuffleList.getState();

		$scope.selectItem = function(item){
			RuffleList.setActive(item);
			//RevealService.setImage(item.image);
			$state.go('reveal', { picId: '12345' });
		};

		// create a new ruffle
		$scope.create = function(){
			CreateRuffle.go().then(function(){
				$state.go('confirm');
			});
		};
	});