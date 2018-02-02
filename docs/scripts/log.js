$(function () {
	function getLatestEvents (target, number) {
		var latestEvents = [];

		return _(sensors).map(function (sensor) {
			return sensor.findSeveral(target, number);
		})
		.flatten(true)
		.sortBy('start')
		.reverse()
		.value();
	}

	Clock.on('tick', function (time) {
		var latest = getLatestEvents(time, 10);
		var events = latest.map(function (event) {
			if (!event.sensor) return;
			return ([
				event.start.toString().match(/..:..:../)[0],
				event.sensor.device.name,
				i18n(event.sensor.type + 'State', event.state)
			]).join(' · ');
		});
		$('.events-log').html(_.uniq(events, true).slice(1,16).join('<br>'));
	})
});
