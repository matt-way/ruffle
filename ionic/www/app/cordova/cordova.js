
// an ng-cordova wrapper set

var dependencies = ['ngCordova',
					'ionic',
					'ruffle.cordova.camera',
					'ruffle.cordova.contacts',
					'ruffle.cordova.actionsheet',
					'ruffle.cordova.file',
					'ruffle.cordova.push'];

angular.module('ruffle.cordova', dependencies);