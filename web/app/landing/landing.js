
angular.module('ruffleWeb.landing', [])
	.controller('LandingCtrl', function($scope, $stateParams){
		$scope.video = '9ocBYjr0-QI';
		$scope.playerVars = {
			controls: 0,
			showinfo: 0,
			rel: 0,
			autoplay: 1
		};

		$scope.$on('youtube.player.ended', function ($event, player) {
			player.playVideo();
		});

		$scope.gaOutbound = function(destination){
			ga('send', 'event', 'click', destination);
		}
	});