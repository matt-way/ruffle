
// analytics wrapper

angular.module('ruffle.analytics', [])
	.service('Analytics', function($ionicPlatform, Config){

		var config = Config.values();
		Config.loaded.then(init);

		function init(){
			$ionicPlatform.ready().then(function(){
				window.analytics.startTrackerWithId(config.gaId);
			});
		}

		function trackView(view){
			$ionicPlatform.ready().then(function(){
				window.analytics.trackView(view);
			});
		}

		function trackEvent(a, b, c){
			$ionicPlatform.ready().then(function(){
				window.analytics.trackEvent(a, b, c);
			});	
		}

		return {
			trackView: trackView,
			trackEvent: trackEvent
		};
	});