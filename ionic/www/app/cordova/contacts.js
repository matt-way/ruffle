
// cordova camera wrapper

angular.module('ruffle.cordova.contacts', [])
	.service('$contacts', function($cordovaContacts, $ionicPlatform, PhoneNumber){

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

		this.processContact = function(contact, suggest){

			var number = getBestNumber(contact);
			if(number){
				// attempt to get the most appropriate countrycode
				var country = PhoneNumber.getCountry(number);
				if(country){
					contact.country = country;
				}else if(suggest){
					contact.country = PhoneNumber.suggestRegion(number);		
				}				
				// update the number to be the formatted one
				contact.number = PhoneNumber.format(number, contact.country);
			}

			// the display name could be in a few different locations depending on the device and setup
			if(!contact.displayName || contact.displayName.length <= 0){
				if(contact.name){
					if(contact.name.formatted){
						contact.displayName = contact.name.formatted;
					}else{
						var hasFirst = false;
						if(contact.name.givenName){
							contact.displayName = contact.name.givenName;
							hasFirst = true;
						}
						if(contact.name.familyName){
							if(hasFirst){
								contact.displayName = contact.displayName + ' ' + contact.name.familyName;
							}else{
								contact.displayName = contact.familyName;
							}
						}
					}
				}
			}

			return contact;
		};

		this.pick = function(){
			var self = this;
			return $ionicPlatform.ready()
				.then($cordovaContacts.pickContact)
				.then(function(contact){
					return self.processContact(contact, true);
				});
		};
	});