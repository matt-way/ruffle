
// directive for easy background image setting

angular.module('ruffle.common.backimage', [])
	.directive('backImage', function(){
		return function(scope, element, attrs){
			attrs.$observe('backImage', function(value) {
				element.css({
					'background-image': 'url(' + value +')'
				});
			});
		};
	});