
angular.module('ruffle.list', ['ruffle.slidable'])
	.constant('ConstRuffle', {
		dbType: 'ruffle'
	})
	.service('RuffleDB', function(ConstRuffle, DB){
		return DB.createDBType(ConstRuffle.dbType);
	})
	.service('Ruffle', function(RuffleDB){

		function Ruffle(data){
			// setup any missing defaults
			this.state = {
				viewCount: 0
			};
			angular.extend(this.state, data);
		}

		// attempt to reach confirmed state
		Ruffle.prototype.load = function(){
			if(this.state.confirmed){
				return $q.when(true);
			}


		}

		Ruffle.prototype.save = function(){
			return RuffleDB.put(this.state);
		};

		return Ruffle;
	})
	// service for helping make a ruffle list load synchronously
	.service('RuffleLoader', function(){

		var queue = [];

		function add(ruffle){

		}

		return {
			add: add
		};
	})
	.service('RuffleList', function(RuffleDB, RuffleLoader, Ruffle, API){

		var state = {
			list: [],
			initialised: initList()
		};

		// load the list from the database
		function initList(){
			return RuffleDB.allDocs({
				limit: 10,
				include_docs: true,
				//startkey: 
			}).then(function(items){
				addRuffles(items.rows);
			});
		}

		function preprocessRuffle(){

		}

		function addRuffles(items){
			// go through each ruffle and preprocess
			var ruffles = [];
			angular.forEach(items, function(item){
				var ruffle = new Ruffle(item.doc);
				RuffleLoader.add(ruffle);
				ruffles.push(ruffle);
			});
			state.list = ruffles;
		}

		// set the currently active ruffle
		function setActive(ruffle){
			state.active = ruffle;
		}

		function getState(){
			return state;
		}

		return {
			getState: function(){ return state; },
			//paginate: paginate,
			//getNewRuffles: getNewRuffles,
			setActive: setActive
		};
	})
	.controller('ListCtrl', function($scope, $state, RuffleList, CreateRuffle,
		API, $http, CreateRuffle, FileTools){

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