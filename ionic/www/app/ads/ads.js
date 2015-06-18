
// admob wrapper

angular.module('ruffle.ads', [])
	.service('Ads', function($q, QTools, API){

		var CONFIG_RETRY = 30000; // 30 seconds
		var ADMOB_RETRY = 500; // half a second
		var adId, adQueued = false;

		// initialise the ad system
		QTools.timerRetry(configAttempt, CONFIG_RETRY).then(loadAd);

		// a single config grab attempt		
		function configAttempt(){
			return API.config.ads().then(function(result){
				adId = result.adId;
			});
		}

		// a single load ad attempt
		function loadAdAttempt(){
			var deferred = $q.defer();
			if(AdMob){
				var adOptions = {
					adId: adId, 
					autoShow: false
				};
				AdMob.prepareInterstitial(adOptions);
				deferred.resolve();
			}else{
				deferred.reject();
			}
		}

		// load an ad as soon as possible
		function loadAd(){
			QTools.timerRetry(loadAdAttempt, ADMOB_RETRY);
		}

		// admob event for whan an ad is loaded
		document.addEventListener('onAdLoaded', function(){
			adQueued = true;
		});

		// admob event for then an ad is finished
		document.addEventListener('onAdDismiss', function(){
			// start loading the next ad
			loadAd();
		});

		// show a loaded ad if available
		function showAd(){
			if(adQueued){
				adQueued = false;
				// assumes admob is ready as it must be loaded
				AdMob.showInterstitial();
			}			
		}

		return {
			showAd: showAd
		};
	});