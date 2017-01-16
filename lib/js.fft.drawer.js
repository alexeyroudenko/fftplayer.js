//
//  Created by Alexey Roudenko on 23/11/16.
//  Copyright (c) 2015 Alexey Roudenko. All rights reserved.
//

// --------------------------------------------------------------
//
// player
// --------------------------------------------------------------

FFTPlayer.prototype.clear = function(canvasId) {
	var canvas = document.getElementById(canvasId);
	var ctx = canvas.getContext('2d');
	var width = canvas.width;
	var height = canvas.height;
	ctx.clearRect(0, 0, width, height);
}

FFTPlayer.prototype.drawWave = function(canvasId, percents) {
	if (typeof percents == 'undefined') percents = 1.0;

	if (this.floatTimeDomainData) {
		var canvas = document.getElementById(canvasId);
		var ctx = canvas.getContext('2d');
		var width = canvas.width;
		var height = canvas.height;
		var bar_width = width / this.floatTimeDomainData.length / percents;

		ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
		var barCount = Math.round(width / bar_width);
		for (var i = 0; i < this.floatTimeDomainData.length * percents; i++) {
			var p = 1.0 * i / (this.floatTimeDomainData.length * percents);
			var pp = Math.abs(p - 0.5) * 5.0;
			var m = 2.0 / (1.0 + pp * pp);
			var magnitude = height * this.floatTimeDomainData[i] * m;

			ctx.fillRect(bar_width * i, height / 2, bar_width , -1.0 *magnitude / 2);
		}
	}
	// ctx.fillRect(0, height - this.atverageVolume / 2, width / 2, 1.0);
}


FFTPlayer.prototype.drawSpectrum = function(canvasId) {
	if (this.frequencyData) {
		var canvas = document.getElementById(canvasId);
		var ctx = canvas.getContext('2d');
		var width = canvas.width;
		var height = canvas.height;
		var bar_width = width / this.frequencyData.length;

		if (this.frequencyData) {
			ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
			var barCount = Math.round(width / bar_width);
			for (var i = 0; i < this.frequencyData.length; i++) {
				var magnitude = this.frequencyData[i] * 0.4;
				ctx.fillRect(bar_width * i, height, bar_width , -1.0 * magnitude);
			}
			// ctx.fillRect(0, height - this.atverageVolume / 2, width / 2, 1.0);
		}
	}
}

FFTPlayer.prototype.drawSelector = function(canvasId, at) {
	var canvas = document.getElementById(canvasId);
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
	ctx.fillRect(canvas.width * at, 0, 2 , canvas.height);
}

FFTPlayer.prototype.draw = function(canvasId, data, my) {
	if (typeof my == 'undefined') my = 1.0;
	if (data) {
		var canvas = document.getElementById(canvasId);
		var ctx = canvas.getContext('2d');
		var width = canvas.width;
		var height = canvas.height;
		var bar_width = width / data.length;
		ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
		var barCount = Math.round(width / bar_width);
		for (var i = 0; i < data.length; i++) {
			var magnitude = data[i] * 0.4;
			ctx.fillRect(bar_width * i, height, bar_width , -1.0 * magnitude * my);
		}
	}
}

FFTPlayer.prototype.drawCircle = function(canvasId, data, my, bar_width, percents) {
	if (typeof my == 'undefined') my = 1.0;
	if (typeof bar_width == 'undefined') bar_width = 5.0;
	if (typeof percents == 'undefined') percents = 1.0;

		var canvas = document.getElementById(canvasId);
		var ctx = canvas.getContext('2d');
		if (data) {
			var cx = canvas.width / 2;
			var cy = canvas.height / 2;
			var radius = window.devicePixelRatio * cx * 0.75;
			ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
			for (var i = 0; i < data.length * percents; i++) {
				var angle = 2.0 * Math.PI * i / data.length / percents;
				var x = cx + radius * Math.cos(angle);
				var y = cy + radius * Math.sin(angle);
				ctx.translate(x, y);
				ctx.rotate(angle);
				var magnitude = data[i];
				ctx.fillRect(0, 0,  my * magnitude, bar_width);
				ctx.setTransform(1, 0, 0, 1, 0, 0);
			}
			// ctx.fillRect(0, height - this.atverageVolume / 2, width / 2, 1.0);
		}
}
