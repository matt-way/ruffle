
angular.module('ruffle.slidable', [])
	.directive('rfSlidable', function(){
		return {
			scope: {
				clickAction: '&clickAction'
			},
			link: function(scope, elem, attrs){

				var maxSlide = parseInt(elem[0].clientWidth);

				var children = elem.parent().children();
				var optionBlock = angular.element(children[0]);
				var optionDelete = angular.element(children[1]);

				Draggable.create(elem[0], {
					type: "x",
					bounds: {
						minX: -maxSlide, 
						maxX: maxSlide
					},
					onDrag: function(){
						//drag left
						if(this.x < 0){

							
						}
						
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