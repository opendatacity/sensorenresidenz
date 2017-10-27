var graphs = (function () {
	function hour(time) {
		return (new Date(time)).getHours();
	}

	function day(time) {
		return (new Date(time)).getDate();
	}

	function month(time) {
		return (new Date(time)).getMonth();
	}

	var scaleFactor = window.devicePixelRatio;

	var blockSize = 5;
	var axisMargin = 20;

	var color = chroma(getCSS('.device-inspector .graph').color);

	var timeScale = 1 / 6e5; // pixels per millisecond

	function s(value) {
		// Returns a value scaled by a pre-set factor
		// Intended to simplify drawing for high-res displays
		return value * scaleFactor;
	}

	function font(ctx, fontSize) {
		fontSize = fontSize || 9;
		ctx.font = s(fontSize) + "pt " + $(document.body).css('font-family');
	}

	var defaults = {
		strokeStyle: '#999',
		lineWidth: s(1 / window.devicePixelRatio)
	};

	var coordinatesByTime = {
		block: {},
		timeline: {}
	};
	var timeByCoordinates = {
		block: [],
		timeline: []
	};

	function coordinates(/* time, [referenceTime,] layout */) {
		var time, referenceTime, layout;
		time = arguments[0];
		layout = arguments[arguments.length - 1];
		if (arguments.length > 2) referenceTime = arguments[1];
		else referenceTime = Clock.earliest();

		var coords;
		var offset = time - referenceTime;

		if (coords = coordinatesByTime[layout][offset]) return coords;

		({
			block: function () {
				var day = (offset / 864e5) | 0;
				var hour = new Date(time).getHours();
				coords = {
					x: day * blockSize,
					y: hour * blockSize
				};
				coordinatesByTime[layout][offset] = coords;
			},
			timeline: function () {
				coords = {x: offset * timeScale};
			}
		})[layout]();
		return coords;
	}

	function reverseCoordinates(t, layout) {
		for (var time in coordinatesByTime[layout]) {
			var c = coordinatesByTime[layout][time];
			if (
				t.x >= c.x && t.x < c.x + blockSize &&
				t.y >= c.y && t.y < c.y + blockSize) {
				return time;
			}
		}
		return false;
	}

	var fillStyles = {
		discrete: function (interval) {
			return color.alpha(interval.mean).css();
		},
		temperature: function (interval) {
			var factor = (interval.mean - 15) / 10;
			return color.alpha(factor).css();
		},
		level: function (interval) {
			return color.alpha(interval.mean / 100).css();
		},
		hue: function (interval) {
			return 'hsl(' + (interval.mean) + ', 100%, 80%)';
		}
	};
	fillStyles.default = fillStyles.discrete;

	function fillStyle(sensor) {
		if (fillStyles[sensor.type]) return fillStyles[sensor.type];
		return fillStyles.default;
	}

	function setCanvasSize(canvas, width, height) {
		canvas.setAttribute('width', s(width));
		canvas.setAttribute('height', s(height));
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
	}

	function sensorGraph(sensor, canvas) {
		if (!canvas) canvas = document.createElement('canvas');

		var height = blockSize * 24;
		var width = blockSize * Math.min(
				Math.ceil((Clock.latest() - Clock.earliest()) / 864e5),
				400
			);
		setCanvasSize(canvas, width, height);

		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, s(width), s(height));

		var intervals = sensor.intervals().intervals;
		intervals.forEach(function (interval) {
			var coords = coordinates(interval.start, 'block');

			ctx.fillStyle = fillStyle(sensor)(interval);
			ctx.fillRect(s(coords.x), s(coords.y), s(blockSize), s(blockSize));
		});

		return canvas;
	}

	function sensorAxes(sensor, canvas, highlight) {
		if (!canvas) canvas = document.createElement('canvas');

		var height = blockSize * 24 + 2 * axisMargin;
		var width = blockSize * Math.min(
				Math.ceil((Clock.latest() - Clock.earliest()) / 864e5),
				400
			) + 2 * axisMargin;
		setCanvasSize(canvas, width, height);

		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, s(width), s(height));

		font(ctx, 9);
		ctx.strokeStyle = defaults.strokeStyle;
		ctx.lineWidth = defaults.lineWidth;

		// y axis: hours
		ctx.textAlign = 'right';
		ctx.textBaseline = 'middle';
		for (var h = 0; h <= 24; h++) {
			var x = axisMargin * 0.8;
			var y = axisMargin + h * blockSize;
			var labelHour;
			if (highlight) {
				labelHour = (y <= highlight.y && y + blockSize > highlight.y);
			} else {
				labelHour = (h % 6) == 0;
			}
			if (labelHour) {
				ctx.fillText(h, s(x), s(y - 0.5 * blockSize));
			}
		}

		// x axis: days
		ctx.textAlign = 'left';
		ctx.textBaseline = 'bottom';
		var date = new Date(Clock.earliest());
		var endDate = new Date(Clock.latest());
		var i = 0;
		while (date < endDate) {
			var x = axisMargin + i * blockSize;
			var y = axisMargin;
			var day = date.getDate();
			var labelDate, labelMonth;
			if (highlight) {
				labelDate = (x <= highlight.x && x + blockSize > highlight.x);
				labelMonth = labelDate;
			} else {
				labelDate = ((i === 0 && day < 27) || day === 1);
				labelMonth = ((i === 0 && day < 20) || day === 1);
			}

			if (labelDate) ctx.fillText(date.getDate(), s(x + 2), s(y * 0.8));

			if (labelMonth) {
				// Draw month label
				var daySize = ctx.measureText(date.getDate());
				var monthSize = ctx.measureText(i18n('MMM' + date.getMonth()));
				// will this label fit inside the canvas?
				if (s(x + 4) + daySize.width + monthSize.width <= width) {
					ctx.fillStyle = 'rgba(0,0,0,.3)';
					ctx.fillText(i18n('MMM' + date.getMonth()), s(x + 4) + daySize.width, s(y * 0.8));
					ctx.fillStyle = '#000';
				}
			}
			if (!highlight && day === 1) {
				// draw line in front of first of month
				ctx.beginPath();
				ctx.moveTo(s(x - 0.5), 0);
				ctx.lineTo(s(x - 0.5), s(y * 0.9));
				ctx.stroke();
			}
			i++;
			date.setDate(date.getDate() + 1);
		}

		return canvas;
	}

	function timelineGraph(now, canvas, presenceSensors) {
		if (!canvas) canvas = document.createElement('canvas');
		if (!now) now = Clock.time();
		var $canvas = $(canvas);

		var width = $canvas.width();
		var height = $canvas.height();
		$canvas.attr('width', s(width));
		$canvas.attr('height', s(height));
		$canvas.css({width: '100%', height: height + 'px'});

		function xCenter(val) {
			return val + width * 0.5;
		}

		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, s(width), s(height));

		ctx.strokeStyle = defaults.strokeStyle;
		ctx.lineWidth = defaults.lineWidth;
		font(ctx, 9);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';

		// Draw ticks
		var current = Clock.earliest(),
			end = Clock.latest();
		while (current < end) {
			var x = coordinates(current, now, 'timeline').x;
			if (x >= 0 || x <= width) {
				var tickHeight;
				var h = hour(current);
				if (h === 0) {
					tickHeight = .2 * height;
					font(ctx, 9);
					ctx.fillText(day(current), s(xCenter(x)), s(tickHeight));
					font(ctx, 7);
					ctx.fillText(i18n('MMM' + month(current)).toUpperCase(), s(xCenter(x)), s(tickHeight + 11));
				} else if (h === 12) {
					tickHeight = 0.15 * height;
				} else {
					tickHeight = 0.1 * height;
				}
				ctx.beginPath();
				ctx.moveTo(s(xCenter(x)), 0);
				ctx.lineTo(s(xCenter(x)), s(tickHeight));
				ctx.stroke();
				current += 36e5;
			}
		}

		// Draw current time marker
		ctx.lineWidth = s(2);
		ctx.beginPath();
		ctx.moveTo(s(xCenter(0)), 0);
		ctx.lineTo(s(xCenter(0)), s(height));
		ctx.stroke();

		return canvas;
	}

	return {sensor: sensorGraph, sensorAxes: sensorAxes, timeline: timelineGraph, timeScale: timeScale};
})();
