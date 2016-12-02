
// Constructor
function FFTPlayer() {
	this.isFirstTouch = navigator.userAgent.match(/iPad/i) != null; //fix iPad
	this.isTrackEnded = new Event("playlistTrackFinished");
	this.timeOffset = 0.0;
	this.smoothTime = 0.89;
	this.smoothVolume = 0.0;
	this.averageVolume = 0.0;
	this.integrateVolume = 0.0;
	// this.paused = false; // for safari

	this.frequencyData = new Array();

	var AudioContext = window.AudioContext // Default
	    || window.webkitAudioContext // Safari and old versions of Chrome
	    || false;

	if (AudioContext) {
		this.context = new AudioContext();
		this.gainNode = this.context.createGain();
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
	var that = this;
	this.context.decodeAudioData (
		this.request.response,
		function(buffer) {
			if(!buffer) {
				console.log("Error decoding file data");
			    return;
			}

			that.sourceJs = that.context.createScriptProcessor(1024);
			that.sourceJs.buffer = that.buffer;
			that.sourceJs.connect(that.context.destination);

			that.analyser = that.context.createAnalyser();
			that.analyser.smoothingTimeConstant = that.smoothTime;
			that.analyser.connect(that.sourceJs);

			// this.analyser.smoothingTimeConstant = values.smooth;
			// that.analyser.fftSize = 128;
			that.buffer = buffer;
			that.source = that.context.createBufferSource();
			that.source.onended = function() { document.dispatchEvent(that.isTrackEnded); };
			that.source.buffer = buffer;
			that.source.connect(that.analyser);
			that.source.connect(that.context.destination);


			that.sourceJs.onaudioprocess = function(e) {
			    var frequencyData = new Uint8Array(that.analyser.frequencyBinCount);
			    that.analyser.getByteFrequencyData(frequencyData);
				that.frequencyData = frequencyData;
				this.frequencyData = frequencyData;
				var values = 0;
				for (var i = 0; i < frequencyData.length; i++) {
					values += frequencyData[i];
				}
				var averageVolume = values / frequencyData.length / 255;
				var smoothVolume = (5.0 * that.smoothVolume + that.averageVolume) / 6.0;
				var integrateVolume = that.integrateVolume + averageVolume;

				that.averageVolume = averageVolume;
				that.smoothVolume = smoothVolume;
				that.integrateVolume = integrateVolume;
			};

			console.log("decodeAudioData, try noteOn");

			that.timeOffset = that.context.currentTime;
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
	console.log("[FFTPlayer] play fileName:" + fileName + ", source:" + this.source);

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


FFTPlayer.prototype.pause = function() {
	console.log("[FFTPlayer] pause");
	if (this.context.state) {
		this.context.suspend();
	} else {
		this.source.stop(0)
	}
};

FFTPlayer.prototype.resume = function() {
	console.log("[FFTPlayer] resume");
	if (this.context.state) {
		this.context.resume();
	} else {
		// console.log("[FFTPlayer] resume buffer " + this.buffer);
		// console.log("[FFTPlayer] resume source " + this.source);
		this.source = this.context.createBufferSource();
		this.source.buffer = this.buffer;
		this.source.connect(this.analyser);
		this.source.connect(this.context.destination);
		this.source.onended = function() { document.dispatchEvent(this.isTrackEnded); };
		this.source.start(0)
	}
};

FFTPlayer.prototype.isPlaying = function() {
	// console.log("[FFTPlayer] isPlaying" + this.context);
	// console.log("[FFTPlayer] state: " + this.context.state);
	// console.log("[FFTPlayer] playbackState:" + this.source.playbackState);
	if (this.context.state) {
		// Chrome
		if (this.context.state == "running") {
			return true;
		} else {
			return false;
		}
	} else {
		// Safari
		return this.source.playbackState == 2;
	}
}

FFTPlayer.prototype.togglePlay = function() {
	console.log("[app.js] togglePlay");
	if (this.isPlaying() == true) {
		this.pause();
	} else {
		this.resume();
	}
}

FFTPlayer.prototype.getProgress = function() {
	if (this.context && this.source.buffer) {
		return Math.floor((100*(this.context.currentTime-this.timeOffset))/this.source.buffer.duration);;
	} else {
		return -1;
	}
};

FFTPlayer.prototype.drawSpectrum = function() {
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	var width = canvas.width;
	var height = canvas.height;
	var bar_width = width / 128;
	ctx.clearRect(0, 0, width, height);

	if (this.frequencyData) {
		ctx.fillStyle = "#666666";
		var barCount = Math.round(width / bar_width);
		for (var i = 0; i < this.frequencyData.length; i++) {
			var magnitude = this.frequencyData[i];
			ctx.fillRect(bar_width * i, height, bar_width , -magnitude / 2 + 60);
		}
		ctx.fillRect(0, height - this.atverageVolume / 2, width / 2, 1.0);
	}
}
