$(function () {
	var $inspector = $('.js-device-inspector');
	$inspector.addClass('hidden');

	var initialContents = $inspector.html();

	function $find (selector) {
		return $inspector.find(selector);
	}

	$('.floorplan').on('mouseenter', '.sensor', function (event) {
		if (event.target.nodeName !== 'polygon') updateInspector($(this).data('sensor'));
	});

	function resetInspector () {
		$inspector.html(initialContents);
	}

	function updateInspector(sensor) {
		resetInspector();

		var device = sensor.device;
		$find('.js-device-name').text(device.name);

		var $sensor = $find('.js-device-sensor');
		$sensor.remove();
		device.sensors.forEach(function (sensor) {
			var $clone = $sensor.clone();
			var $graph = $(graphs.sensor(sensor)).addClass('graph');
			var $axes = $(graphs.sensorAxes(sensor)).addClass('axes');
			$clone.find('.js-device-sensor-type').text(i18n(sensor.type));
			$clone.find('.js-device-sensor-state').text(i18n(sensor.state));
			$clone.find('.js-device-sensor-graph').append($graph);
			$clone.find('.js-device-sensor-graph').append($axes);

			$clone.find('.js-device-sensor-count').text(i18n('events', sensor.events.length));

			buildStatisticsDL($clone.find('.js-device-sensor-statistics'), sensor.statistics());

			$clone.data('sensor', sensor);
			$inspector.append($clone);
		});
	}

	function buildStatisticsDL ($dl, statistics) {
		statistics.sums.forEach(function (sum) {
			var label = i18n(statistics.type+'State', sum.value)
			$dl.append('<dt>'+label+'</dt>');
			var percent = sum.duration/statistics.totalDuration;
			percent = Math.round(percent*1000)/10;
			var $dd = $('<dd>'+percent+' %</dd>');
			var bar = $('<span> </span>');
			bar.addClass('bar');
			bar.width(percent + '%');
			$dd.append(bar);
			$dl.append($dd);
		});
	}

	$inspector.on('mousemove', '.axes', function (event) {
		graphs.sensorAxes($(this).parents('.js-device-sensor').data('sensor'), this, { x: event.offsetX, y: event.offsetY });
	})
	$inspector.on('mouseleave', '.axes', function () {
		graphs.sensorAxes($(this).parents('.js-device-sensor').data('sensor'), this, false);
	})
});
