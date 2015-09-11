
// Constructor
function FFTPlayer() {
	this.isFirstTouch = true; // fix iPad

	var AudioContext = window.AudioContext // Default
	    || window.webkitAudioContext // Safari and old versions of Chrome
	    || false;

	if (AudioContext) {
	    this.context = new AudioContext();
		this.request = new XMLHttpRequest();
		this.request.responseType = "arraybuffer";
		var that = this;
		this.request.onload = function(e) {
  			that.onLoadListener(e);
		}

	} else {
	    console.log("Sorry, but the Web Audio API is not supported by your browser.");
	    console.log("Please, consider upgrading to the latest version or downloading Google Chrome or Mozilla Firefox");
	}
}

FFTPlayer.prototype.onLoadListener = function(event) {

	console.log("onLoadListener " + event);
	console.log("this.context " + this.context);
	console.log("this " + this);

	var that = this;
	this.context.decodeAudioData (
		this.request.response,
		function(buffer) {
		    if(!buffer) {
		    	console.log("Error decoding file data");
		        return;
		    }

			that.sourceJs = that.context.createScriptProcessor(2048);
		    that.sourceJs.buffer = that.buffer;

		    that.sourceJs.connect(that.context.destination);
		    that.analyser = that.context.createAnalyser();
		    // this.analyser.smoothingTimeConstant = values.smooth;
		    that.analyser.fftSize = 128;

		    that.source = that.context.createBufferSource();
		    that.source.buffer = buffer;
		    that.source.connect(that.analyser);
		    that.analyser.connect(that.sourceJs);
		    that.source.connect(that.context.destination);

		    that.sourceJs.onaudioprocess = function(e) {
		        frequencyData = new Uint8Array(that.analyser.frequencyBinCount);
		        that.analyser.getByteFrequencyData(frequencyData);
				that.getProgress();
		    };

		    console.log("decodeAudioData, try noteOn");

		    // on iPad does't work
			that.source.start ? that.source.start(0) : that.source.noteOn(0);
		},

		function(error) {
			console.log("Error decoding file data");
		}
	);
}

// class methods
FFTPlayer.prototype.play = function(fileName) {
	console.log("play fileName:" + fileName + ", source:" + this.source);
	
 	if (this.source) {
		if (this.isFirstTouch == true) {
			this.isFirstTouch = false;
			this.source.play ? this.source.play(0) : this.source.noteOn(0);
		} else {
			this.source.stop ? this.source.stop(0) : this.source.noteOff(0);
		}
	}
	this.request.open('GET', fileName, true);
	this.request.send();
};

FFTPlayer.prototype.getProgress = function() {
	if (this.context && this.source.buffer) {
		var progress = this.context.currentTime / this.source.buffer.duration;
		return progress;
	} else {
		return 0.0;
	}
};


// ---------------------------------------------------------------------------------------

FFTPlayer.prototype.drawSpectrum = function() {
    var canvas = document.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var width = canvas.width;
    var height = canvas.height;
    var bar_width = width / 128;
    ctx.clearRect(0, 0, width, height);

    if (frequencyData) {
	    var barCount = Math.round(width / bar_width);
	    for (var i = 0; i < frequencyData.length; i++) {
	        var magnitude = frequencyData[i];
	        ctx.fillRect(bar_width * i, height, bar_width , -magnitude / 2 + 60);
	    }
	    ctx.fillRect(0, height - averageVolume / 2, width / 2, 1.0);
	}
}

FFTPlayer.prototype.getAverageVolume = function(array) {
    var values = 0;
    var average;
    var length = array.length;
    for (var i = 0; i < length; i++) {
        values += array[i];
    }
    average = values / length;
    return average;
}