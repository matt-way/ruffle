
angular.module('ruffle.reveal', ['ruffle.pixelator'])
	.controller('RevealCtrl', function($scope, $state, RuffleList, ImageLoader, LocalConfig, EULA, CreateRuffle, $ionicLoading){

		$scope.state = {
			isAndroid: ionic.Platform.isAndroid()
		};

		$scope.locals = LocalConfig.values();
		$scope.ruffle = RuffleList.getState().active;

		// update the local config view counter
		$scope.locals.viewCount = $scope.locals.viewCount || 0;
		$scope.locals.viewCount++;
		LocalConfig.update();

		$scope.$on('$ionicView.afterEnter', function(){
			var url = $scope.ruffle.getFileUrl();
			ImageLoader.loadURL(url, $scope.ruffle.state.isGIF).then(function(image){
			//ImageLoader.loadURL('/img/sample-gif.gif', true).then(function(image){
				$scope.ruffle.increaseViews();
				$scope.state.image = image;
			}, function(err){
				console.log(err);
			});
		});

		$scope.back = function(){
			$state.go('list');
		};

		$scope.reply = function(){
			// do eula check before replying
			EULA.show().then(function(){
				CreateRuffle.reply($scope.ruffle).then(function(){
					$state.go('confirm');
				}, function(err){
					// TODO: better error handling needs to be done here
					/*
					if(err && err !== 'Selection cancelled.' && err !== 'Camera cancelled.'){
						Errors.randomTitle(err, 'OK');
					}
					*/
				}).finally(function(){
					$ionicLoading.hide();
				});
			});
		};

		$scope.forward = function(){
			// do eula check before replying
			EULA.show().then(function(){				
				CreateRuffle.forward($scope.ruffle).then(function(){
					$state.go('confirm');
				}, function(err){
					// TODO: better error handling needs to be done here
					/*
					if(err && err !== 'Selection cancelled.' && err !== 'Camera cancelled.'){
						Errors.randomTitle(err, 'OK');
					}
					*/
				}).finally(function(){
					$ionicLoading.hide();
				});
			});
		};
	});