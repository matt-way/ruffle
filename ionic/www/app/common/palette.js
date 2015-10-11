
// module for retrieving colors from the ruffle color palette

angular.module('ruffle.common.palette', [])
	.service('Palette', function(){

		var colors = [
			'#AB85E4',
			'#7DE5B3',
			'#FFF38B',
			'#FFA98B',
			//'#6F3FB5',
			//'#35B979',
			//'#FFED49',
			//'#FF7849'
		];

		// get a random color
		function randomColor(){
			return colors[Math.floor(Math.random()*colors.length)];
		}

		// get the next color available
		var curIndex = 0;
		function nextColor(){
			var returner = colors[curIndex];
			curIndex++;
			if(curIndex >= colors.length){
				curIndex = 0;
			}
			return returner;
		}

		return {
			randomColor: randomColor,
			nextColor: nextColor
		};
	});