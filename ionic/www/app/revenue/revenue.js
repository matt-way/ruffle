
// admob wrapper

angular.module('ruffle.ads', [])
	.constant('ConstAds', {
		admobRetryTime: 1000 // one second
	})
	.service('Ads', function(ConstAds, $q, QTools, Config, Analytics){

		var adQueued = false;
		var config = Config.values();

		// initialise the ad system (wait for loaded config)
		Config.loaded.then(loadAd);

		// a single load ad attempt
		function loadAdAttempt(){
			var deferred = $q.defer();
			if(window.AdMob){
				// get the correct id based on the platform
				var id = config.adIdIOS;
				if(ionic.Platform.isAndroid()){
					id = config.adId;
				}

				var adOptions = {
					adId: id, 
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
			QTools.timerRetry(loadAdAttempt, ConstAds.admobRetryTime);
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

		// admob event for when an ads is clicked (and user leaves app)
		document.addEventListener('onAdLeaveApp', function(){
			//GA ad click event
			Analytics.trackEvent('Ad', 'Click');
		});

		// show a loaded ad if available
		function showAd(){
			curAd = $q.defer();

			if(adQueued){
				adQueued = false;
				// assumes admob is ready as it must be loaded
				AdMob.showInterstitial();

				//GA ad view event
				Analytics.trackEvent('Ad', 'View');
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