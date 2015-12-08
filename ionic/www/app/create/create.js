
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
					{ text: '<i class="icon-giphy actionsheet-icon"></i>Choose GIF From Giphy' }
				],
				titleText: title || 'Create New Ruffle',
				buttonClicked: function(index){
					state.action = index;
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
				Analytics.trackEvent('Ruffle', 'Create', creationActions[index]);
				
				var p = $camera.getPicture(index).then(function(imageData){
					CreationRuffle.setImage('data:image/jpeg;base64,' + imageData);
				});	
				// turn on the background loader
				$ionicLoading.show();
				return p;
			}
		}

		function selectContact(){
			return $contacts.pick().then(function(contact){
				CreationRuffle.setContact(contact);			
			});
		}

		this.create = function(){
			CreationRuffle.reset('create');
			selectType().then(function(index){
				if(index === 2){
					// giphy
					Analytics.trackEvent('Ruffle', 'Create', 'Giphy');
					$state.go('giphySearch', { type: 'preview' });
				}else{
					return cameraAction(index)
						.then(selectContact)
						.then(function(){
							$state.go('confirm');
						});
				}
			}).finally(function(){
				$ionicLoading.hide();
			});
		};

		this.reply = function(){
			CreationRuffle.reset('reply', {
				contact: {
					ruffleId: ruffle.state._id
				}
			});
			return selectType('Reply to Ruffle').then(function(index){
				if(index === 2){
					// giphy
					Analytics.trackEvent('Ruffle', 'Create', 'Giphy');
					$state.go('giphySearch', { type: 'nopreview' });
				}else{
					return cameraAction(index)
						.then(function(){
							$state.go('confirm');
						});
				}
			});
		};

		this.forward = function(ruffle){

			// reset passing in the current ruffles 
			CreationRuffle.reset('forward', {
				reference: ruffle.getReference(),
				imageData: ruffle.getFileUrl()
			});
			
			return selectContact();
		};
	})
	// service used to keep track of details regarding new ruffle
	.service('CreationRuffle', function($contacts, Analytics){

		var state = {};

		this.getState = function(){
			return state;
		};

		// start a new creation ruffle state
		this.reset = function(type, initdata){

			state = initdata || {};
			state.type = type;
				
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
	});


/*
	.service('CreateRuffle', function($q, QTools, $ionicActionSheet, 
		$ionicLoading, $camera, $contacts, PhoneNumber, FileTools, ImageLoader,
		Errors, $timeout, Ads, API, $cordovaToast, ImagePreprocess, RuffleList, Analytics, Giphy){

		var state = {
			seenAd: false
		};

		function selectPhotoType(title){
			var deferred = $q.defer();

			$ionicActionSheet.show({
				buttons: [
					{ text: '<i class="icon-camera actionsheet-icon"></i>Take a Photo' },
					{ text: '<i class="icon-picture actionsheet-icon"></i>Choose Picture From Library' },
					{ text: '<i class="icon-giphy actionsheet-icon"></i>Choose GIF From Giphy' }
				],
				titleText: title || 'Create New Ruffle',
				buttonClicked: function(index){
					state.action = index;
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

				//Google Analytics
				Analytics.trackEvent('Ruffle', 'Create', creationActions[index]);
				
				if(index === 2){
					// giphy
					return Giphy.selectGIF(state.type !== 'reply');
				}else{
					var p = $camera.getPicture(index).then(function(imageData){
						state.imageData = 'data:image/jpeg;base64,' + imageData;
					});	
					// turn on the background loader
					$ionicLoading.show();

					return p;
				}
			}			
		}

		function setImageUrl(url){
			state.imageData = url;
			state.referenceUrl = url;
		}

		// loads a local image for forwarding given a particular ruffle
		function imageFromRuffle(ruffle){
			// as we already have the url, we dont need to use base64 here
			if(ruffle.reference){
				state.imageData = ruffle.reference;
				state.referenceUrl = ruffle.reference;
			}else{
				state.imageData = ruffle.getFileUrl();	
			}
		}

		// given a contact object returned from plugin, find the best number
		function getBestNumber(contact){
			var numbers = contact.phoneNumbers;
			var first = null;
			if(numbers){
				for(var i=0; i<numbers.length; i++){
					var number = numbers[i];
					if(number.value){
						if(number.type === 'mobile'){
							return number.value;
						}else if(!first){
							first = number.value;
						}
					}
				}
			}
			return first;			
		}

		function updateContact(contact, suggest){
			var conUse = contact || state.contact;

			var number = getBestNumber(conUse);
			if(number){
				// attempt to get the most appropriate countrycode
				var country = PhoneNumber.getCountry(number);
				if(country){
					conUse.country = country;
					contact.lockCountry = true;
				}else if(suggest){
					conUse.country = PhoneNumber.suggestRegion(number);		
				}				
				// update the number to be the formatted one
				conUse.number = PhoneNumber.format(number, conUse.country);
			}

			// the display name could be in a few different locations depending on the device and setup
			if(!conUse.displayName || conUse.displayName.length <= 0){
				if(conUse.name){
					if(conUse.name.formatted){
						conUse.displayName = conUse.name.formatted;
					}else{
						var hasFirst = false;
						if(conUse.name.givenName){
							conUse.displayName = conUse.name.givenName;
							hasFirst = true;
						}
						if(conUse.name.familyName){
							if(hasFirst){
								conUse.displayName = conUse.displayName + ' ' + conUse.name.familyName;
							}else{
								conUse.displayName = conUse.familyName;
							}
						}
					}
				}
			}

			state.contact = conUse;
		}

		function selectContact(){
			return $contacts.pick().then(function(contact){
				updateContact(contact, true);			
			});
		}

		// process for pre creating a new ruffle
		function create(){
			// reset the state
			state.seenAd = false;
			state.type = 'create';
			state.referenceUrl = null;

			//GA create event
			Analytics.trackEvent('Ruffle', 'Create', 'Start');

			return selectPhotoType()
				.then(cameraAction)
				.then(selectContact);
		}

		// process for replying to a ruffle
		function reply(ruffle){
			// reset the state
			state.seenAd = false;
			state.type = 'reply';
			state.referenceUrl = null;

			//GA create event
			Analytics.trackEvent('Ruffle', 'Reply', 'Start');

			return selectPhotoType('Reply to Ruffle')
				.then(cameraAction)
				.then(function(){
					state.contact = {
						ruffleId: ruffle.state._id
					};					
				});
		}

		// process for forwarding ruffles on
		function forward(ruffle){
			// reset the state
			state.seenAd = false;
			state.type = 'forward';
			state.referenceUrl = null;

			//GA create event
			Analytics.trackEvent('Ruffle', 'Forward', 'Start');

			return selectContact()
				.then(function(){
					return imageFromRuffle(ruffle);
				});
		}

		// validate the current settings pre send
		function validate(){
			if(state.contact && state.contact.ruffleId){
				return $q.when(true);
			}

			/*
			if(!PhoneNumber.validate(state.contact.number, state.contact.country)){
				return Errors.randomTitle('Something doesn\'t look right.\nPlease check the number and country selected.', 'Try Again');
			}*/
/*
			return $q.when(true);			
		}

		function sendRuffle(){

			// if we are using giphy and doing a reference ruffle
			// we need to perform a different endpoint flow
			if(state.referenceUrl){
				if(state.contact.ruffleId){
					return API.inbox.replyReferenceRuffle({
						typeId: state.contact.ruffleId
					},{
						reference: state.referenceUrl
					}).$promise;
				}else{
					return API.inbox.sendReferenceRuffle({
						phoneNumber: state.contact.number, 
						countryCode: state.contact.country.code,
						reference: state.referenceUrl
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

		// final send of a ruffle
		function send(){
			// validate the given parameters
			return validate().then(function(){
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
			});
		}

		return {
			getState: function(){ return state; },
			selectContact: selectContact,
			create: create,
			reply: reply,
			forward: forward,
			send: send,
			updateContact: updateContact,
			camera: cameraAction,
			setImageUrl: setImageUrl
		};
	});

*/