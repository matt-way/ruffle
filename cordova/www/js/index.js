var canvas = document.getElementById('image-canvas');
var ctx = canvas.getContext('2d'),
    img = new Image(),
    play = false;

// wait until image is actually available
img.onload = pixelate;

var play = false;
var val = 5.7;

canvas.addEventListener('touchstart', function(){
    play = true;
    requestAnimationFrame(pixelate);
}, false);

canvas.addEventListener('touchend', function(){
    play = false;
}, false);

// MAIN function
function pixelate() {

    //canvas.width = img.width;
    canvas.height = canvas.width * (img.height / img.width);

    //var size = val * 0.01; //(play ? v : blocks.value) * 0.01,
    //size = Math.floor(size * canvas.width) / canvas.width;

    var size = Math.floor(val) / canvas.width;
    size = Math.min(size, 1);

    // turn off image smoothing - this will give the pixelated effect
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

        // cache scaled width and height
        w = canvas.width * size,
        h = canvas.height * size;

    // draw original image to the scaled size
    ctx.drawImage(img, 0, 0, w, h);

    // then draw that scaled image thumb back to fill canvas
    // As smoothing is off the result will be pixelated
    ctx.drawImage(canvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);

    if(play){
        //val *= 1.05;
        //val = Math.min(val, 100);
        val *= 1.05;
        requestAnimationFrame(pixelate);
    }
}


var app = {
    // Application Constructor
    initialize: function() {

        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
            this.bindEvents();
        } else {
            this.receivedEvent();
        }
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {

        // some image, we are not struck with CORS restrictions as we
        // do not use pixel buffer to pixelate, so any image will do
        img.src = './img/test.jpg';
    }
};

// poly-fill for requestAnmationFrame with fallback for older
// browsers which do not support rAF.
window.requestAnimationFrame = (function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

app.initialize();