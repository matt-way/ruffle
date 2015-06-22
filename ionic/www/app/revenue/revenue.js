
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
			return API.config.ads().$promise.then(function(result){
				adId = result.adId;
			});
		}

		// a single load ad attempt
		function loadAdAttempt(){
			var deferred = $q.defer();
			if(window.AdMob){
				var adOptions = {
					adId: adId, 
					autoShow: false
				};
				AdMob.prepareInterstitial(adOptions);
				deferred.resolve();
			}else{
				deferred.reject();
			}
			return deferred.promise;
		}

		// load an ad as soon as possible
		function loadAd(){
			QTools.timerRetry(loadAdAttempt, ADMOB_RETRY);
		}

		// admob event for whan an ad is loaded
		document.addEventListener('onAdLoaded', function(){
			adQueued = true;
		});

		var curAd;

		// admob event for then an ad is finished
		document.addEventListener('onAdDismiss', function(){
			// resolve the ad showing promise;
			curAd.resolve();
			// start loading the next ad
			loadAd();
		});

		// show a loaded ad if available
		function showAd(){
			curAd = $q.defer();

			if(adQueued){
				adQueued = false;
				// assumes admob is ready as it must be loaded
				AdMob.showInterstitial();
			}else{
				// don't reject the ad, as it still counts as completed
				curAd.resolve();
			}
			return curAd.promise;
		}

		return {
			showAd: showAd
		};
	});