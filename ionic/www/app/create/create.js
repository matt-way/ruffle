
// service for handling the creation of a new ruffle

angular.module('ruffle.create', [])
	.service('NewRuffle', function($q, $ionicActionSheet, $contacts, $camera, $state, $ionicLoading, CreationRuffle, Analytics){

		// select the type of ruffle using an action sheet
		function selectType(title){
			var deferred = $q.defer();

			$ionicActionSheet.show({
				buttons: [
					{ text: '<i class="icon-camera actionsheet-icon"></i>Take a Photo' },
					{ text: '<i class="icon-picture actionsheet-icon"></i>Choose Picture From Library' },
					{ text: '<img class="actionsheet-icon-giphy" src="img/giphy-icon.png" />Choose GIF From Giphy' }
				],
				titleText: title || 'Create New Ruffle',
				buttonClicked: function(index){
					deferred.resolve(index);
					return true;
				},
				cancel: function(){
					deferred.reject();
				}
			});

			return deferred.promise;
		}

		function cameraAction(index){
			if(index >= 0){

				var cameraActions = ['Take Photo', 'Upload Picture'];
				Analytics.trackEvent('Ruffle', 'Create', cameraActions[index]);
				
				var p = $camera.getPicture(index);
				p.then(function(imageData){
					CreationRuffle.setImage('data:image/jpeg;base64,' + imageData);
				});	
				// turn on the background loader
				$ionicLoading.show();
				return p;
			}
		}

		this.selectContact = function(){
			return $contacts.pick().then(function(contact){
				CreationRuffle.setContact(contact);			
			});
		}

		this.create = function(){
			var self = this;
			CreationRuffle.reset('create');
			selectType().then(function(index){
				if(index === 2){
					// giphy
					Analytics.trackEvent('Ruffle', 'Create', 'Giphy');
					$state.go('giphySearch', { type: 'preview' });
				}else{
					return cameraAction(index)
						.then(self.selectContact)
						.then(function(){
							$state.go('confirm');
						});
				}
			}).finally(function(){
				$ionicLoading.hide();
			});
		};

		this.reply = function(ruffle){
			CreationRuffle.reset('reply', {
				contact: {
					ruffleId: ruffle.state._id
				}
			});
			return selectType('Reply to Ruffle').then(function(index){
				if(index === 2){
					// giphy
					Analytics.trackEvent('Ruffle', 'Reply', 'Giphy');
					$state.go('giphySearch', { type: 'nopreview' });
				}else{
					return cameraAction(index)
						.then(function(){
							$state.go('confirm');
						});
				}
			}).finally(function(){
				$ionicLoading.hide();
			});
		};

		this.forward = function(ruffle){

			// reset passing in the current ruffles 
			CreationRuffle.reset('forward', {
				reference: ruffle.getReference(),
				imageData: ruffle.getFileUrl()
			});
			
			return this.selectContact()
				.then(function(){
					$state.go('confirm');
				});
		};
	})
	// service used to keep track of details regarding new ruffle
	.service('CreationRuffle', function($q, $timeout, $contacts, $ionicLoading, $cordovaToast, API, Errors, Ads, QTools, Analytics, FileTools){

		var state = {};

		this.getState = function(){
			return state;
		};

		// start a new creation ruffle state
		this.reset = function(type, initdata){

			state.contact = null;
			state.imageData = null;
			state.reference = null;
			state.signedUrl = null;
			state.type = type;
			angular.extend(state, initdata);
				
			Analytics.trackEvent('Ruffle', type, 'Start');
		};

		// set the ruffles contact explicitly
		this.setContact = function(contact){
			state.contact = contact;
		};

		// set the image information explicitly
		this.setImage = function(data){
			state.imageData = data;
		};

		// set an image reference
		this.setImageReference = function(url){
			state.reference = url;
		};

		// re process a contact if things like country have changed
		this.updateContact = function(){
			$contacts.processContact(state.contact);
		};

		function sendRuffle(){
			// if we are using giphy and doing a reference ruffle
			// we need to perform a different endpoint flow
			if(state.reference){
				if(state.contact.ruffleId){
					return API.inbox.replyReferenceRuffle({
						typeId: state.contact.ruffleId
					},{
						reference: state.reference
					}).$promise;
				}else{
					return API.inbox.sendReferenceRuffle({
						phoneNumber: state.contact.number, 
						countryCode: state.contact.country.code,
						reference: state.reference
					}).$promise;	
				}				
			}else{
				return API.inbox.presendRuffle().$promise
					.then(function(result){
						// set the signed url
						state.signedUrl = result.signedUrl;
					})
					.then(function(){
						return state.imageData;
					}).then(function(data){
						// upload the image
						// for forwarding we don't have bas64, only the local image url
						return FileTools.upload(data, state.signedUrl, state.type === 'forward');
					}).then(function(){
						if(state.contact.ruffleId){
							return API.inbox.replyRuffle({
								typeId: state.contact.ruffleId
							}).$promise;
						}else{
							// once uploaded perform the final send
							return API.inbox.sendRuffle({
								phoneNumber: state.contact.number, 
								countryCode: state.contact.country.code
							}).$promise;	
						}					
					});
			}
		}

		// primary sending process
		this.send = function(){
			
			// setup loader
			$ionicLoading.show({
				template: '<ion-spinner></ion-spinner><div>Sending Ruffle...</div>'
			});

			var deferred = $q.defer();
				
			$timeout(function(){

				var adShow = Ads.showAd();
				var uploadRuffle = sendRuffle();

				QTools.allSettled([adShow, uploadRuffle]).then(function(results){
					// check for a failure
					var failed = false;
					for(var i=0; i<results.length; i++){
						if(!results[i].succeeded){
							failed = true;
							break;
						}
					}						
					if(failed){
						$ionicLoading.hide();
						deferred.reject();
						Errors.randomTitle('We had troubles delivering your ruffle.', 'Try Again');
						//GA send error event
						Analytics.trackEvent('Ruffle', 'Send', 'Error');
					}else{							
						$ionicLoading.hide();
						deferred.resolve();
						$cordovaToast.showShortBottom('Ruffle Sent');
						//GA send complete event
						Analytics.trackEvent('Ruffle', 'Send', 'Complete');
					}						
				});

			}, 500);

			return deferred.promise;
		};
	});