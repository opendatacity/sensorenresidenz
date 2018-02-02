'use strict';
var devices = [], sensors = [], events = [];
$(function() {

var config = {
	lat: 53.565,
	lon: 10
}

$.getJSON('data/all.json', function (data) {
	devices = data;
	var earliest = Date.now(), latest = 0;
	devices.forEach(function (device) {
		device.sensors = device.sensors.map(function (sensor) {
			var sensor = new Sensor(sensor);
			sensor.device = device;
			sensors.push(sensor);
			sensor.events.forEach(function(event) { events.push(event); });
			if (earliest > sensor.first.start.valueOf()) earliest = sensor.first.start.valueOf() + 6 * 36e5;
			if (latest < sensor.last.start.valueOf()) latest = sensor.last.start.valueOf() - 6 * 36e5;
			$(sensorMap(sensor)).data('sensor', sensor);
			return sensor;
		});
	});
	events.sort(function (a, b) { return a.start - b.start; });
	Clock.init({ time: earliest, earliest: earliest, latest: latest });
	$('.slider-simulation-speed').trigger('change');
});

var keyDown = {
	32: function spaceKey (ev) { ev.preventDefault(); $('#button-play-pause').addClass('active'); },
	38: function upKey (ev) { ev.preventDefault(); sliderIncrement($('.slider-simulation-speed'), ev.metaKey ? 1000 : 10); },
	40: function downKey (ev) { ev.preventDefault(); sliderIncrement($('.slider-simulation-speed'), ev.metaKey ? -1000 : -10); }
}
var keyUp = {
	32: function spaceKey () { $('#button-play-pause').removeClass('active').click(); }
}
$(document).keydown(function (event) {
	try { keyDown[event.keyCode](event); } catch (e) {}
});
$(document).keyup(function (event) {
	try { keyUp[event.keyCode](event); } catch (e) {}
});

$('#button-play-pause').click(function () {
	var $this = $(this);
	if (Clock.paused()) {
		Clock.start();
		$this.addClass('playing').removeClass('paused');
	} else {
		Clock.pause();
		$this.addClass('paused').removeClass('playing');
	}
});
$('.slider-simulation-speed').on('mousemove change', function () {
	var speed = Math.pow(parseInt($(this).val(), 10) * 0.5, 3);
	$(document.body).toggleClass('backwards', speed < 0);
	Clock.speed(speed);
});

function sliderIncrement (slider, amount) {
	var $s = $(slider);
	$s.val(+$s.val() + amount);
	$s.triggerHandler('change');
}

function sensorMap(sensor) {
	var device = H(sensor.device.name).umlautify().toCSSClassName().v;
	var type = H(sensor.type).toCSSClassName().v;
	return $('.'+device+'.'+type).get();
}

function updateSVG (sensor, event) {
	var elements = sensorMap(sensor);
	var onClass = sensor.type+'-on';
	var offClass = sensor.type+'-off';
	var nullClass = 'null';
	elements.forEach(function (el) {
		if (event === false) {
			el.classList.add(nullClass);
		} else {
			el.classList.remove(nullClass);
		}
		if (event.state === 0) {
			el.classList.add(offClass);
			el.classList.remove(onClass);
		} else if (event.state === 1) {
			el.classList.add(onClass);
			el.classList.remove(offClass);
		}
	});
}

Clock.on('tick', function (time) {
	var sun = SunCalc.getPosition(Clock.date(), config.lat, config.lon);
	if (sun.altitude < -.1) {
		$(document.body).addClass('night').removeClass('day');
	} else {
		$(document.body).removeClass('night').addClass('day');
	}

	//$('.timeline-chart-day').html(Clock.date());

	if (sensors.length > 0) {
		sensors.forEach(function (sensor) {
			var event = sensor.find(time);
			updateSVG(sensor, event);
		});
	}
});
});
