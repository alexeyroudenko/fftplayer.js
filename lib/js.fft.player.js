//
//  Created by Alexey Roudenko on 23/11/16.
//  Copyright (c) 2015 Alexey Roudenko. All rights reserved.
//


function FFTPlayer(config) {

	this.START_VOLUME = 0.8;
	this.LOW_PASS_MULTIPLY = 4000;
	if (typeof(config) === "undefined") config = {};

	this.config = config;

	if (this.config.hasOwnProperty('lowpass') == false) {
		this.config.lowpass = this.LOW_PASS_MULTIPLY;
	}

	if (this.config.hasOwnProperty('volume') == false) {
		this.config.volume = this.START_VOLUME;
	}

	this.version = "1.1.1";
	this.config = config;
	this.bufferSize = 2048;
	this.fftSize = 512;
	this.timeOffset = 0.0;
	//this.isFirstTouch = navigator.userAgent.match(/iPad/i) != null;
	this.started = false;
	this.muted = false;

	this.smoothing = 0.56;
	this.smoothing2 = 0.9;
	this.smoothingDrums = 0.57;
	this.smoothingDrums2 = 0.06;
	this.drumTreshold = 0.66;
	this.drumTreshold2 = 0.7;
	this.drum  = 0.0;
	this.deltaDrum  = 0.0;
	this.drumValue  = 0.0;

	// this.lowPassFreq1  = 10440.0;
	// this.lowPassFreq2  = 440.0;

	this.createAudioContext();
}

// --------------------------------------------------------------
//
//
// create
// --------------------------------------------------------------
FFTPlayer.prototype.createAudioContext = function() {
	console.debug(this.version + " createAudioContext");
	var AudioContext = window.AudioContext // Default
		|| window.webkitAudioContext // Safari and old versions of Chrome
		|| false;



		if (AudioContext) {
			this.context = new AudioContext();
		} else {
			console.error("Sorry, but the Web Audio API is not supported by your browser.");
			console.error("Please, consider upgrading to the latest version or downloading Google Chrome or Mozilla Firefox");
		}
}

FFTPlayer.prototype.analyze = function(audioProcessingEvent) {

	if (this.analyser) {
		this.analyser.smoothingTimeConstant = this.smoothing;
		this.analyser2.smoothingTimeConstant = this.smoothing2;

		var inputBuffer = audioProcessingEvent.inputBuffer;
		var outputBuffer = audioProcessingEvent.outputBuffer;

		this.analyser.getByteFrequencyData(this.frequencyData);
		this.analyser2.getByteFrequencyData(this.frequency2Data);

		this.analyser.getFloatFrequencyData(this.floatFrequencyData);
		this.analyser.getByteTimeDomainData(this.timeDomainData);
		this.analyser.getFloatTimeDomainData(this.floatTimeDomainData);


		this.delta = new Float32Array(this.frequencyData.length);

		if (this.delta) {
			for (var i = 0; i < this.delta.length; i+=1) {
				this.delta[i] = Math.abs(this.frequencyData[i] - this.frequency2Data[i]);
			}
		}

		var drum = 0;
		var minValue = (this.delta.length * this.drumTreshold).toFixed(0);
		var maxValue = (this.delta.length * this.drumTreshold2).toFixed(0);
		for (var i = minValue; i < maxValue; i++) {
			drum += this.delta[i]
		}
		var deltaDrum = (drum - this.drum );
		this.deltaDrum = this.smoothingDrums * this.deltaDrum + (1. - this.smoothingDrums) * deltaDrum ;
		this.drum = this.smoothingDrums2 * this.drum + (1. - this.smoothingDrums2) * drum ;

		this.drumValue = Math.max(0, Math.abs(this.deltaDrum * 0.005));
		if (this.drumValue < 0.25) this.drumValue = 0;
		// console.log(this.drumValue);
		// this.integrated.update(this.drumValue);
		// this.integrated += 1.001 * this.drumValue;

	}

	for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
	    var inputData = inputBuffer.getChannelData(channel);
	    var outputData = outputBuffer.getChannelData(channel);
	    for (var sample = 0; sample < inputBuffer.length; sample++) {
			outputData[sample] = 0.0;
			outputData[sample] = inputData[sample] * 0.5 * this.config.volume;
			//outputData[sample] += ((Math.random() * 2) - 1) * 0.2;
	    }
	  }
}


// --------------------------------------------------------------
//
//
// init
// --------------------------------------------------------------
FFTPlayer.prototype.initAudioContext = function() {
	this.createNodes();
	this.connect();
	console.debug("initAudioContext, source " + this.source);
	this.ready();
}

FFTPlayer.prototype.createNodes = function() {
	this.source = this.context.createBufferSource();
	this.source.onended = function() {
		var element = document;
 		var event = document.createEvent("CustomEvent");
 		event.initCustomEvent("AudioCompleteEvent", true, true, {});
 		element.dispatchEvent(event);
	};
	this.source.buffer = this.buffer;

	// nodes
	this.lowpass = this.context.createBiquadFilter();
	this.lowpass.type = 'lowpass';
	this.lowpass.frequency.value = this.config.lowpass * this.LOW_PASS_MULTIPLY;

	this.gainNode = this.context.createGain();
	this.gainNode.gain.value = this.config.volume;

	this.analyser = this.context.createAnalyser();
	this.analyser.smoothingTimeConstant = this.smoothing;
	this.analyser.fftSize = this.fftSize ;

	this.analyser2 = this.context.createAnalyser();
	this.analyser2.smoothingTimeConstant = this.smoothing2;
	this.analyser2.fftSize = this.fftSize;

	this.splitter = this.context.createChannelSplitter();

	var bufferLength = this.analyser.frequencyBinCount;
	var fftSize = this.analyser.fftSize;

	this.frequencyData = new Uint8Array(bufferLength);
	this.frequency2Data = new Uint8Array(bufferLength);
	this.floatFrequencyData = new Float32Array(bufferLength);

	this.timeDomainData = new Uint8Array(fftSize);
	this.floatTimeDomainData = new Float32Array(fftSize);
	this.delta = new Float32Array(bufferLength);

	this.scriptProcessor = this.context.createScriptProcessor(this.bufferSize, 1, 1);
	this.scriptProcessor.buffer = this.buffer;
	var that = this;
	this.scriptProcessor.onaudioprocess = function(e) {that.analyze(e);}
}

FFTPlayer.prototype.connect = function() {
	this.source.connect(this.gainNode);
	this.gainNode.connect(this.splitter);
	this.splitter.connect(this.analyser,0,0);
	this.splitter.connect(this.analyser2,1,0);
	this.analyser.connect(this.lowpass);
	this.lowpass.connect(this.scriptProcessor);
	this.scriptProcessor.connect(this.context.destination);
}

FFTPlayer.prototype.onLoadListener = function(event) {
	console.debug("onLoadListener");
	var that = this;
	this.context.decodeAudioData (
		this.request.response,
		function(buffer) {
			if(!buffer) {
				console.log("Error decoding file data");
			    return;
			}
			that.buffer = buffer;
			that.initAudioContext();
		},

		function(error) {
			console.log("Error decoding file data");
		}
	);
}

FFTPlayer.prototype.loadAudio = function(fileName) {
	console.debug("load " + fileName);
	this.request = new XMLHttpRequest();
	this.request.responseType = "arraybuffer";
	var that = this;
	this.request.onload = function(e) {
		that.onLoadListener(e);
	}
	this.request.open('GET', fileName, true);
	this.request.send();
};


FFTPlayer.prototype.resetOffset = function() {
	this.timeOffset = 0;
}



// --------------------------------------------------------------
//
//
//
// methods
// --------------------------------------------------------------
FFTPlayer.prototype.play = function() {
	console.info("play ", this.context.currentTime);
	this.started = true;
	this.timeOffset = this.context.currentTime;
	this.source.start(0);

	// this.source.play ? this.source.play(0) : this.source.noteOn(0);
 // 		if (this.source) {
	// 	if (this.isFirstTouch == true) {
	// 		this.isFirstTouch = false;
	// 		this.source.play ? this.source.play(0) : this.source.noteOn(0);
	// 	} else {
	// 		this.source.stop ? this.source.stop(0) : this.source.noteOff(0);
	// 	}
	// }
};


FFTPlayer.prototype.resume = function() {
	console.info("resume");
	if (this.context.state) {
		this.context.resume();
	} else {
		this.source = this.context.createBufferSource();
		this.source.buffer = this.buffer;
		this.connect();
		this.source.onended = function() {
			var element = document;
			var event = document.createEvent("CustomEvent");
			event.initCustomEvent("AudioCompleteEvent", true, true, {});
			element.dispatchEvent(event);
		 };
		this.source.start(0)
	}
};

FFTPlayer.prototype.pause = function() {
	console.log("pause");
	if (this.context.state) {
		this.context.suspend();
		console.log("suspend");
	} else {
		this.source.stop(0)
		console.log("stop");
	}
};

FFTPlayer.prototype.stop = function() {
	console.info("stop");
	this.timeOffset = this.context.currentTime;
	if (this.source) this.source.stop(0)
};

FFTPlayer.prototype.seek = function(value) {
	value = Math.abs(value);
	this.source.stop(0)
	var offset = this.source.buffer.duration.toFixed(2) * value;

	console.info("seek " + value.toFixed(2) + " duration " +
		this.source.buffer.duration.toFixed(2) + " offset " + this.timeOffset.toFixed(2));

	this.timeOffset = -offset;
	this.source = this.context.createBufferSource();
	this.source.buffer = this.buffer;
	this.connect();
	this.source.start(0, offset);

	this.onSeek(value);
}

FFTPlayer.prototype.onSeek = function(value) {}


FFTPlayer.prototype.togglePlay = function() {
	console.info("[app.js] togglePlay");
	if (this.isPlaying() == true) {
		this.pause();
	} else {
		this.resume();
	}
}


FFTPlayer.prototype.toggleMute = function() {
	this.muted = !this.muted;
	if (this.muted == true) {
		this.savedVolume = this.config.volume;
		this.config.volume = 0;
		this.gainNode.value = 0;
	} else {
		this.config.volume = this.savedVolume;
		this.gainNode.value = this.config.volume;
	}
	console.log("toggleMute " + this.gainNode.value);
}

FFTPlayer.prototype.setVolume = function(value) {

	this.config.volume = value;
	this.gainNode.value = this.config.volume;
	// console.log("[app] setOutputVolume " + this.config.volume);
	// this.lowpass.frequency.value = 440 * 0.2 * 1.0 * value;
}

FFTPlayer.prototype.setFilter = function(value) {
	// console.log("[app] setFilter " + value, this.lowpass);
	this.config.lowpass = value;
	this.lowpass.frequency.value = this.config.lowpass * this.LOW_PASS_MULTIPLY;
}

// --------------------------------------------------------------
//
//
//
// gets
// --------------------------------------------------------------
FFTPlayer.prototype.isPlaying = function() {
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

FFTPlayer.prototype.getState = function() {
	return this.context.state;
}

FFTPlayer.prototype.getCurrentTime = function() {
	if (this.context) {

		if (this.context.state == "running" && this.started == true) {
			return this.context.currentTime - this.timeOffset;
			if (this.getProgress() == -1) return 0;
		}
		return 0;
	} else {
		return -1;
	}
}

FFTPlayer.prototype.getDuration = function() {
	if (this.source) {
		return this.source.buffer.duration;
	} else {
		return -1;
	}
}

FFTPlayer.prototype.getProgress = function() {
	if (this.source) {
		if (this.context && this.source.buffer && this.started == true) {
			return (this.context.currentTime - this.timeOffset)/this.source.buffer.duration;
		} else {
			return 0;
		}
	} else {
		return 0;
	}
};

FFTPlayer.prototype.getSampleRate = function() {
	return this.context.sampleRate;
}
