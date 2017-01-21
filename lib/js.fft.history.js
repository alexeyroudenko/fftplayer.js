//
//  Created by Alexey Roudenko on 23/11/16.
//  Copyright (c) 2015 Alexey Roudenko. All rights reserved.
//

function FFTHistory(config) {
	this.config = config;
	this.config.length = 400;
	this.data = new Array(this.config.length);
}

FFTHistory.prototype.update = function(value) {
	if (this.data.length > this.config.length) {
		this.data.shift();
	}
	this.data.push(value);
}

FFTHistory.prototype.draw = function(canvasId) {
	if (typeof my == 'undefined') my = 1.0;
	if (typeof bar_width == 'undefined') bar_width = 2.0;
	if (typeof percents == 'undefined') percents = 1.0;

	var canvas = document.getElementById(canvasId);
	var ctx = canvas.getContext('2d');

	if (this.data) {
		var canvas = document.getElementById(canvasId);
		var ctx = canvas.getContext('2d');
		var width = canvas.width;
		var height = canvas.height;
		var bar_width = width / this.data.length;
		ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
		var barCount = Math.round(width / bar_width);
		for (var i = 0; i < this.data.length; i++) {
			var magnitude = this.data[i] * 100.4;
			ctx.fillRect(bar_width * i, height, bar_width , -1.0 * magnitude);
		}
	}
}
