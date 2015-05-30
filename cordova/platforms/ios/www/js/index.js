var canvas = document.getElementById('image-canvas');
var ctx = canvas.getContext('2d'),
    img = new Image(),
    play = false;

// wait until image is actually available
img.onload = pixelate;

var val = 1;

canvas.addEventListener('click', function(){
    val *= 3;
    val = Math.min(val, 100);
    pixelate();
}, false);

// MAIN function
function pixelate(v) {

    // if in play mode use that value, else use slider value
    var size = val * 0.01; //(play ? v : blocks.value) * 0.01,

    canvas.width = img.width;
    canvas.height = img.height;

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
        img.src = './img/cat.jpg';
    }
};

app.initialize();