
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

		/*
		function upload_file(file, signed_request, url){
		    var xhr = new XMLHttpRequest();
		    xhr.open("PUT", signed_request);
		    xhr.setRequestHeader('x-amz-acl', 'public-read');
		    xhr.onload = function() {
		        if (xhr.status === 200) {
		            console.log('DONE!')
		        }
		    };
		    xhr.onerror = function() {
		        alert("Could not upload file."); 
		    };
		    xhr.send(file);
		}


		function upload(file, uploadUrl){
	        var fd = new FormData();
	        fd.append('file', file);
	        return $http.put(uploadUrl, fd, {
	            transformRequest: angular.identity,
	            headers: {'Content-Type': 'image/jpeg'}
	        });
	    }
		*/
	})
	.directive('fileModel', ['$parse', function ($parse) {
	    return {
	        restrict: 'A',
	        link: function(scope, element, attrs) {
	            var model = $parse(attrs.fileModel);
	            var modelSetter = model.assign;
	            
	            element.bind('change', function(){
	                scope.$apply(function(){
	                    modelSetter(scope, element[0].files[0]);
	                });
	            });
	        }
	    };
	}]);;