
// service for handling the creation of a new ruffle

angular.module('ruffle.create', [])
	.service('CreateRuffle', function($q, QTools, $ionicActionSheet, 
		$ionicLoading, $camera, $contacts, PhoneNumber, FileTools, ImageLoader,
		Errors, $timeout, Ads, API, $cordovaToast, ImagePreprocess, RuffleList, Analytics){

		var state = {
			seenAd: false
		};

		function selectPhotoType(){
			var deferred = $q.defer();

			$ionicActionSheet.show({
				buttons: [
					{ text: '<i class="icon-camera actionsheet-icon"></i>Take a Photo' },
					{ text: '<i class="icon-picture actionsheet-icon"></i>Choose Picture From Library' }
				],
				titleText: 'Create New Ruffle',
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
				if(index == 1){
					//GA create photo event
					Analytics.trackEvent('Ruffle', 'Create', 'Upload Picture');
				} else {
					//GA create upload event
					Analytics.trackEvent('Ruffle', 'Create', 'Take Photo');
				}

				return $camera.getPicture(index).then(function(imageData){
					state.imageData = 'data:image/jpeg;base64,' + imageData;
				});
			}			
		}

		function updateContact(contact, suggest){
			var conUse = contact || state.contact;

			if(conUse.phoneNumbers && conUse.phoneNumbers.length > 0){
				var number = conUse.phoneNumbers[0].value;
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

			//GA create event
			Analytics.trackEvent('Ruffle', 'Create', 'Start');

			return selectPhotoType()
				.then(cameraAction)
				.then(selectContact);
		}

		// validate the current settings pre send
		function validate(){
			return $q.when(true);

			if(!PhoneNumber.validate(state.contact.number, state.contact.country)){
				return Errors.randomTitle('Something doesn\'t look right.\nPlease check the number and country selected.', 'Try Again');
			}

			return $q.when(true);			
		}

		function sendRuffle(){

			return API.inbox.presendRuffle().$promise
				.then(function(result){
					// set the signed url
					state.signedUrl = result.signedUrl;
				})
				.then(function(){
					// check if the image is a gif
					return ImageLoader.isGIF(state.imageData).then(function(is){
						if(!is){
							return ImagePreprocess.resizeMaxWidth(state.imageData, 500);
						}
						return state.imageData;
					});
				}).then(function(data){
					// upload the image
					return FileTools.upload(data, state.signedUrl);
				}).then(function(){
					// once uploaded perform the final send
					return API.inbox.sendRuffle({
						phoneNumber: state.contact.number, 
						countryCode: state.contact.country.code
					}).$promise;
				});
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
			go: create,
			send: send,
			updateContact: updateContact,
			camera: cameraAction
		};
	});