
// service for handling the creation of a new ruffle

angular.module('ruffle.create', [])
	.service('CreateRuffle', function($q, $ionicActionSheet, $camera, $contacts, $state){

		var state = {
			imageData: 'content://com.google.android.apps.photos.contentprovider/-1/1/content%3A%2F%2Fmedia%2Fexternal%2Fimages%2Fmedia%2F57964/ACTUAL'
		};

		function selectPhotoType(){
			var deferred = $q.defer();

			$ionicActionSheet.show({
				buttons: [
					{ text: 'Take a Photo' },
					{ text: 'Choose Picture From Library' }
				],
				titleText: 'Create New Ruffle',
				buttonClicked: function(index){
					state.action = index;
					deferred.resolve(index);
					return true;
				},
				cancel: function(){
					deferred.resolve(null);
				}
			});

			return deferred.promise;
		}

		function cameraAction(index){
			return $camera.getPicture(index).then(function(imageData){
				state.imageData = imageData;
			});
		}

		function selectContact(){
			return $contacts.pick().then(function(contact){
				state.contact = contact;
			});
		}

		// process for creating a new ruffle
		function create(){

			selectPhotoType()
				.then(cameraAction)
				.then(selectContact)
				.then(function(){
					$state.go('confirm');
					console.log(state);
				});
		}

		return {
			getState: function(){ return state; },
			go: create
		};
	});