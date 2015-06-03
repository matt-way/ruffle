
angular.module('ruffle.slidable', [])
	.directive('rfSlidable', function(){
		return {
			link: function(scope, elem, attrs){

				var maxSlide = parseInt(attrs.rfSlidable);

				Draggable.create(elem[0], {
					type: "x",
					bounds: {
						minX: -maxSlide, 
						maxX: maxSlide
					},
					dragResistance: 0.5,
					onDragEnd: function(){
						TweenMax.to(elem[0], 0.5, { x: 0, ease: Power3.easeOut });
					}
				});

/*
				var startX;
				var dragging = false;

				

				function setTransform(el, transform){
					el.style.transform = transform;
					el.style.webkitTransform = transform;
					el.style.mozTransform = transform;
					el.style.msTransform = transform;
					el.style.oTransform = transform;
				}

				elem.bind('touchstart', function(e){
					startX = e.touches[0].clientX;
					dragging = true;
				});

				elem.bind('touchmove', function(e){
					if(dragging){						
						var curX = e.touches[0].clientX;
						var targetX = Math.min(maxSlide, Math.max(-maxSlide, curX - startX));
						TweenMax.set(elem[0], { x: targetX });
						//setTransform(elem[0], 'translateX(' + targetX + 'px)');//, 0, 0)');
					}
				});

				elem.bind('touchend', function(e){
					dragging = false;
					// animate back to initial pos
					TweenMax.to(elem[0], 1, { x: 0 });
				});
*/
			}
		};
	});