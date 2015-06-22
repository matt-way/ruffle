
// error dialog wrapper

angular.module('ruffle.common.error', [])
	.constant('ErrorTitles', [
		'Dang It',
		'Uh-oh Spaghetti-o\'s',
		'Oops',
		'Oops-a-daisy',
		'Oh Snap :(',
	])
	.service('Errors', function($cordovaDialogs, ErrorTitles){

		function randInt(min, max){
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}

		function randomTitle(msg, btnText){
			var titleIndex = randInt(0, ErrorTitles.length - 1);
			return $cordovaDialogs.alert(msg, ErrorTitles[titleIndex], btnText);
		}

		return {
			randomTitle: randomTitle
		};
	});