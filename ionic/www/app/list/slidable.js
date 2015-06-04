
angular.module('ruffle.slidable', [])
	.directive('rfSlidable', function(){
		return {
			scope: {
				clickAction: '&clickAction'
			},
			link: function(scope, elem, attrs){

				var maxSlide = parseInt(attrs.rfSlidable);

				Draggable.create(elem[0], {
					type: "x",
					bounds: {
						minX: -maxSlide, 
						maxX: maxSlide
					},
					onClick: function(){
						if(attrs.clickAction){
							scope.clickAction();
						}
					},
					onDragEnd: function(){
						TweenMax.to(elem[0], 0.5, { x: 0, ease: Power3.easeOut });
					}
				});
			}
		};
	});