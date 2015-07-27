
angular.module('ruffle.slidable', [])
	.directive('rfSlidable', function($timeout){

		// Main slidable controller
		function SlideCtrl($scope){
			this.scope = $scope;
		}

		SlideCtrl.prototype.addOption = function(obj, side){
			if(side === 'left'){
				this.leftOption = obj;
			}else{
				this.rightOption = obj;
			}
		};

		// a visible option is cancelled
		SlideCtrl.prototype.cancelOption = function(){
			var self = this;
			$timeout(function(){
				self.dragItem[0].disable();
				TweenMax.to(self.dragElem[0], 0.5, { 
					x: 0, 
					ease: Power3.easeOut,
					//onUpdate: self.dragItem[0].update,
					//overwrite: 'all',
					onComplete: function(){
						// to avoid slider issues, when the to completes, enforce a zero position
						TweenMax.set(self.dragElem[0], { x: 0 });
						self.dragItem[0].enable();
					}
				});
			});
		};

		SlideCtrl.prototype.createDraggable = function(elem, clickFunc){
			var self = this;
			var maxSlide = parseInt(elem[0].clientWidth);
			var threshold = 0.4 * maxSlide;

			self.dragElem = elem;			

			this.dragItem = Draggable.create(elem[0], {
				type: "x",
				bounds: {
					minX: self.leftOption ? -maxSlide : 0, 
					maxX: self.rightOption ? maxSlide : 0
				},
				onDrag: function(){
					//drag left
					if(this.x < 0){
						if(self.rightOption){ self.rightOption.show(true); }
						if(self.leftOption){ self.leftOption.show(false); }
					}
					if(this.x > 0){
						if(self.rightOption){ self.rightOption.show(false); }
						if(self.leftOption){ self.leftOption.show(true); }						
					}					
				},
				onClick: function(e){
					var self = this;
					if(clickFunc && !(e instanceof MouseEvent) && Math.floor(self.x) === 0){
						clickFunc();
					}else{
						return false;
					}
				},
				onDragEnd: function(){					
					if(this.x > -threshold && this.x < 0){
						//bounce back left
						TweenMax.to(elem[0], 0.5, { x: 0, ease: Power3.easeOut });	
					} else if(this.x < threshold && this.x > 0){
						//bounce back right
						TweenMax.to(elem[0], 0.5, { x: 0, ease: Power3.easeOut });	
					} else if(this.x > threshold){
						//swipe off right
						TweenMax.to(elem[0], 0.5, { x: maxSlide + 1, ease: Power3.easeOut });
						// show confirm for left action
						self.leftOption.confirm(true);
					} else if(this.x < -threshold){
						//swipe off left
						TweenMax.to(elem[0], 0.5, { x: -maxSlide -1 , ease: Power3.easeOut });	
						// show confirm for right action
						self.rightOption.confirm(true);
					}					
				}
			});
		};

		return {
			controller: SlideCtrl,
			link: function(scope, elem, attrs){
				
			}
		};
	})
	.directive('rfSlidableOption', function($timeout){

		// object for manipulating slider options
		function SlideOption(scope, elem){
			this.scope = scope;
			this.elem = elem;
		}

		SlideOption.prototype.show = function(toggle){
			if(toggle){				
				this.elem.removeClass('option-hide');
			}else{
				this.elem.addClass('option-hide');
			}
		};

		SlideOption.prototype.confirm = function(toggle){
			this.scope.confirm = toggle;
			this.scope.$apply();
		};

		return {
			scope: {
				success: '&optionSuccess'
			},
			transclude: true,
			require: '^rfSlidable',			
			link: function(scope, elem, attrs, ctrl, transcluder){
				elem.addClass('slide-option');
				elem.addClass('option-full');
				if(attrs.rfSlidableOption === 'right'){
					elem.addClass('option-right');
				}

				scope.cancelled = function(e){
					e.stopPropagation();
					scope.confirm = false;
					ctrl.cancelOption();
				};

				scope.confirmed = function(e){
					e.stopPropagation();
					scope.working = true;
					scope.success().then(function(res){
						scope.working = false;
						// snap back if promise returns true
						if(res === true){
							ctrl.cancelOption();
						}
					}, function(err){
						scope.working = false;
					});					
				};

				this.optionObj = new SlideOption(scope, elem);
				ctrl.addOption(this.optionObj, attrs.rfSlidableOption);

				// setup the transcluded html to be part of the isolated scope
				transcluder(scope, function(clone, scope){
					elem.append(clone);
				});
			}
		};
	})
	.directive('rfSlidableItem', function(){
		return {
			scope: {
				clickAction: '&clickAction'
			},
			require: '^rfSlidable',
			link: function(scope, elem, attrs, ctrl){
				ctrl.createDraggable(elem, scope.clickAction);
			}
		};
	});