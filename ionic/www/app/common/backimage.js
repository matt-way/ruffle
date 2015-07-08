
// directive for easy background image setting

angular.module('ruffle.common.backimage', [])
	.directive('backImage', function(){
		return function(scope, element, attrs){
			attrs.$observe('backImage', function(value) {
				if(value && value.length > 0){
					element.css({
						'background-image': 'url(' + value +')'
					});	
				}else{
					element.css({
						'background-image': 'none'
					});
				}		
			});
		};
	});