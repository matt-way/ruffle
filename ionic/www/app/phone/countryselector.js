
// country selection directive for phone numbers

angular.module('ruffle.phone.country', [])
	.constant('Countries', [
		{ code: 'US', name: 'United States', numeric: '+1' },
		{ code: 'AU', name: 'Australia', numeric: '+61' },
		{ code: 'NZ', name: 'New Zealand', numeric: '+64' },
		{ code: 'GB', name: 'United Kingdom', numeric: '+44' },
		{ code: 'VN', name: 'Vietnam', numeric: '+84' },
		{ code: 'CA', name: 'Canada', numeric: '+1' }
	])
	.service('Geo', function($http, $q, PhoneNumber){

		var country = null;

		function approxCountry(){
			if(country){ 
				return $q.when(country); 
			}else{
				return $http({
					url: 'http://ipinfo.io',
					headers: {
						Accept: 'application/json'
					},
					timeout: 3000
				}).then(function(result){
					if(result && result.data && result.data.country){
						country = PhoneNumber.countryFromCode(result.data.country);
						return country;
					}
					return null;
				});	
			}		
		}

		return {
			approxCountry: approxCountry
		};
	})
	.directive('countrySelector', function(Countries){
		return {
			scope: {
				selected: '=countrySelector',
				locked: '=locked'
			},
			templateUrl: 'app/phone/countryselector.html',
			link: function(scope, elem, attrs){
				elem.addClass('country-selector');
				scope.countries = Countries;
			}
		};
	});