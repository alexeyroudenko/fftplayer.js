//
//  Created by Alexey Roudenko on 23/11/16.
//  Copyright (c) 2015 Alexey Roudenko. All rights reserved.
//

// --------------------------------------------------------------
//
// player
// --------------------------------------------------------------
// Constructor
function FFTPlayer(config) {
	this.config = config;
	this.bufferSize = 2048;
	this.fftSize = 512;
	this.timeOffset = 0.0;
	this.isFirstTouch = navigator.userAgent.match(/iPad/i) != null;
	this.isTrackEnded = new Event("playlistTrackFinished");
	this.volume = 1.0;


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

	this.lowPassFreq1  = 20400.0;
	this.lowPassFreq2  = 20440.0;

	this.createAudioContext();
}

// --------------------------------------------------------------
//
//
// create
// --------------------------------------------------------------
FFTPlayer.prototype.createAudioContext = function() {
	var AudioContext = window.AudioContext // Default
		|| window.webkitAudioContext // Safari and old versions of Chrome
		|| false;

	if (AudioContext) {
		this.context = new AudioContext();
	} else {
		console.log("Sorry, but the Web Audio API is not supported by your browser.");
		console.log("Please, consider upgrading to the latest version or downloading Google Chrome or Mozilla Firefox");
	}
}

FFTPlayer.prototype.analyze = function(audioProcessingEvent) {

	if (this.analyser) {
		this.analyser.smoothingTimeConstant = this.smoothing;
		this.analyser2.smoothingTimeConstant = this.smoothing2;

		this.lowpass.frequency.value = this.lowPassFreq1;

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

	}

	for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
	    var inputData = inputBuffer.getChannelData(channel);
	    var outputData = outputBuffer.getChannelData(channel);
	    for (var sample = 0; sample < inputBuffer.length; sample++) {
			outputData[sample] = 0.0;
			outputData[sample] = inputData[sample] * 0.5;
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
	console.log("[FFTPlayer] initAudioContext, source " + this.source);
	this.ready();
}

FFTPlayer.prototype.createNodes = function() {
	this.source = this.context.createBufferSource();
	//this.source.onended = function() { document.dispatchEvent(this.isTrackEnded); };
	this.source.buffer = this.buffer;

	// nodes
	this.lowpass = this.context.createBiquadFilter();
	this.lowpass.type = 'lowpass';
	this.lowpass.frequency.value = this.lowPassFreq1;

	this.gainNode = this.context.createGain();
	this.gainNode.gain.value = 1.0;

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
	this.source.connect(this.splitter);
	this.splitter.connect(this.analyser,0,0);
	this.splitter.connect(this.analyser2,1,0);
	this.analyser.connect(this.gainNode);
	this.gainNode.connect(this.lowpass);
	this.lowpass.connect(this.scriptProcessor);
	this.scriptProcessor.connect(this.context.destination);
}
//
// FFTPlayer.prototype.ready = function() {
// 	console.log("[FFTPlayer] ready decodeAudioData, try noteOn");
// 	that.timeOffset = that.context.currentTime;
// 	// on iPad does't work
// 	//that.source.start ? that.source.start(0) : that.source.noteOn(0);
// }

FFTPlayer.prototype.onLoadListener = function(event) {
	console.log("[FFTPlayer] onLoadListener");
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
	console.log("[FFTPlayer] load " + fileName);
	this.request = new XMLHttpRequest();
	this.request.responseType = "arraybuffer";
	var that = this;
	this.request.onload = function(e) {
		that.onLoadListener(e);
	}

 // 	if (this.source) {
		// if (this.isFirstTouch == true) {
		// 	this.isFirstTouch = false;
		// 	this.source.play ? this.source.play(0) : this.source.noteOn(0);
		// } else {
		// 	this.source.stop ? this.source.stop(0) : this.source.noteOff(0);
		// }
	// }

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
	console.log("[FFTPlayer] play ", this.context.currentTime);
	this.timeOffset = this.context.currentTime;
	this.source.start(0);
	if (this.isFirstTouch == true) {
		this.isFirstTouch = false;
	}
	// this.source.play ? this.source.play(0) : this.source.noteOn(0);
 	// 	if (this.source) {
	// 	if (this.isFirstTouch == true) {
	// 		this.isFirstTouch = false;
	// 		this.source.play ? this.source.play(0) : this.source.noteOn(0);
	// 	} else {
	// 		this.source.stop ? this.source.stop(0) : this.source.noteOff(0);
	// 	}
	// }
};


FFTPlayer.prototype.resume = function() {
	console.log("[FFTPlayer] resume");
	if (this.context.state) {
		this.context.resume();
	} else {
		this.source = this.context.createBufferSource();
		this.source.buffer = this.buffer;
		this.connect();
		this.source.onended = function() { document.dispatchEvent(this.isTrackEnded); };
		this.source.start(0)
	}
};

FFTPlayer.prototype.pause = function() {
	console.log("[FFTPlayer] pause");
	if (this.context.state) {
		this.context.suspend();
		console.log("[FFTPlayer] suspend");
	} else {
		this.source.stop(0)
		console.log("[FFTPlayer] stop");
	}
};

FFTPlayer.prototype.stop = function() {
	console.log("[FFTPlayer] stop");
	this.timeOffset = this.context.currentTime;
	if (this.source) this.source.stop(0)
};

FFTPlayer.prototype.seek = function(value) {

	value = Math.abs(value);
	this.source.stop(0)
	var offset = this.source.buffer.duration.toFixed(2) * value;

	console.log("[FFTPlayer] seek " + value.toFixed(2) + " duration " +
		this.source.buffer.duration.toFixed(2) + " offset " + this.timeOffset.toFixed(2));

	this.timeOffset = -offset;
	this.source = this.context.createBufferSource();
	this.source.buffer = this.buffer;
	this.connect();
	this.source.start(0, offset);

	this.onSeek(value);
}

FFTPlayer.prototype.onSeek = function(value) {}

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

FFTPlayer.prototype.togglePlay = function() {
	console.log("[app.js] togglePlay");
	if (this.isPlaying() == true) {
		this.pause();
	} else {
		this.resume();
	}
}


FFTPlayer.prototype.setOutputVolume = function(value) {
	console.log("[app] setOutputVolume " + value);
	this.gainNode.value = value;
	this.lowpass.frequency.value = 440 * 0.2 * 1.0;
}


// --------------------------------------------------------------
//
//
//
// gets
// --------------------------------------------------------------
FFTPlayer.prototype.getState = function() {
	return this.context.state;
}

FFTPlayer.prototype.getCurrentTime = function() {
	if (this.context) {
		if (this.getProgress() == -1) return 0;
		return this.context.currentTime - this.timeOffset;
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
		if (this.context && this.source.buffer) {
			return (this.context.currentTime - this.timeOffset)/this.source.buffer.duration;
		} else {
			return -1;
		}
	} else {
		return -1;
	}
};

FFTPlayer.prototype.getSampleRate = function() {
	return this.context.sampleRate;
}
