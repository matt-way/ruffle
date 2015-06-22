
angular.module('ruffle.slidable', [])
	.directive('rfSlidable', function(){
		return {
			scope: {
				clickAction: '&clickAction'
			},
			link: function(scope, elem, attrs){

				var maxSlide = parseInt(elem[0].clientWidth);
				var halfWay = maxSlide / 2;
				console.log(halfWay);

				var children = elem.parent().children();
				var optionBlock = angular.element(children[1]);
				var optionDelete = angular.element(children[0]);

				Draggable.create(elem[0], {
					type: "x",
					bounds: {
						minX: -maxSlide, 
						maxX: maxSlide
					},
					onDrag: function(){
						//drag left
						console.log(this.x);
						if(this.x < 0){
							optionBlock.removeClass('option-hide');
							optionBlock.addClass('option-full');
							optionDelete.addClass('option-hide');
						}
						if(this.x > 0){
							optionDelete.removeClass('option-hide');
							optionDelete.addClass('option-full');
							optionBlock.addClass('option-hide');
						}
						
					},
					onClick: function(){
						if(attrs.clickAction){
							scope.clickAction();
						}
					},
					onDragEnd: function(){
						if(this.x > -halfWay && this.x < 0){
							//bounce back left
							TweenMax.to(elem[0], 0.5, { x: 0, ease: Power3.easeOut });	
						} else if(this.x < halfWay && this.x > 0){
							//bounce back right
							TweenMax.to(elem[0], 0.5, { x: 0, ease: Power3.easeOut });	
						} else if(this.x > halfWay){
							//swipe off right
							TweenMax.to(elem[0], 0.5, { x: maxSlide + 1, ease: Power3.easeOut });
							
							//delete

						} else if(this.x < -halfWay){
							//swipe off left
							TweenMax.to(elem[0], 0.5, { x: -maxSlide -1 , ease: Power3.easeOut });	
							
							//block

						}

						
					}
				});
			}
		};
	});