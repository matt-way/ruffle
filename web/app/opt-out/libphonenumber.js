
// libphonenumber angular wrapper

angular.module('ruffleWeb.optout.number', [])
	.constant('Countries', [
		{ code: 'US', name: 'United States', numeric: '+1' },
		{ code: 'AU', name: 'Australia', numeric: '+61' },
		{ code: 'NZ', name: 'New Zealand', numeric: '+64' },
		{ code: 'GB', name: 'United Kingdom', numeric: '+44' },
		{ code: 'VN', name: 'Vietnam', numeric: '+84' },
		{ code: 'CA', name: 'Canada', numeric: '+1' }
	])
	.service('PhoneNumber', function(Countries){

		function getCountryCode(number){
			return phoneUtils.getRegionCodeForNumber(number);
		}

		function countryFromCode(code){
			for(var i=0; i<Countries.length; i++){
				if(Countries[i].code === code){
					return Countries[i];
				}
			}
			return null;
		}

		function getCountry(number){
			var code = getCountryCode(number);
			if(code){
				return countryFromCode(code);
			}
			return null;
		}

		// try and suggest a country code for a number
		function suggestRegion(number, defaultCountryCode){

			var country = getCountryCode(number);
			if(country){
				return countryFromCode(country);
			}

			if(defaultCountryCode && phoneUtils.isValidNumberForRegion(number, defaultCountryCode)){
				return countryFromCode(defaultCountryCode);
			}

			// go through a set of countries trying to find a suitable suggestion
			for(var i=0; i<Countries.length; i++){
				if(phoneUtils.isValidNumberForRegion(number, Countries[i].code)){
					// check if it is a mobile number
					var type = phoneUtils.getNumberType(number, Countries[i].code);
					if(type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE'){
						return Countries[i];	
					}
				}
			}

			return countryFromCode(defaultCountryCode);;
		}

		// perform client validation on a number/country
		function validate(number, country){
			var code = country ? country.code : null;
			try{
				return phoneUtils.isValidNumber(number, code);
			}catch(err){
				return false;
			}
		}

		function format(number, country){
			try{
				var code = country ? country.code : null;
				return phoneUtils.formatE164(number, code);
			}catch(err){
				return null;
			}
		}

		return {
			getCountryCode: getCountryCode,
			getCountry: getCountry,
			countryFromCode: countryFromCode,
			suggestRegion: suggestRegion,
			validate: validate,
			format: format
		};
	});