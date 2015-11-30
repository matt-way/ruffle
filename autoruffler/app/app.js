
angular.module('autoRuffler', ['ngStorage'])
	.controller('AppCtrl', function($scope, $http, $q, $timeout, $localStorage){

		//$localStorage.details = 
		$scope.details = $localStorage;

		function sendSingle(number){
			var endpoint = 'http://api.ruffle.us/inbox/' + $scope.details.inboxId + '/send-direct';
			console.log('running: ', number);
			return $http.post(endpoint, {
				phoneNumber: number[1],
				countryCode: number[0],
				pictureId: $scope.details.picture
			}, {
				headers: {
					Authorization: 'Bearer ' + $scope.details.token
				}
			});
		}

		function sendDelayed(number, ms){
			return function(){
				return $timeout(function(){
					return sendSingle(number);
				}, ms);
			};
		}

		$scope.send = function(){


			//if(confirm('Are you sure you want to send?')){
				// loop through each number in the list
				var numbers = $scope.details.recipients.split('\n');
				var chain = $q.when(true);
				for(var i=0; i<numbers.length; i++){
					var number = numbers[i].split(',');
					chain = chain.then(sendDelayed(number, 500));
				}

				chain.catch(function(err){
					console.log('An error occurred: ', err);
				});
			//}	
			
		};
	});