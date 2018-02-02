$(function () {
	var timeScale = 1/graphs.timeScale;

	function drawTimeline (time) {
		if (!+time) time = Clock.time();
		graphs.timeline(time, document.getElementById('timeline-graph'));
	}
	Clock.on('tick', drawTimeline);
	$(window).on('resize', drawTimeline);

	var $timeline = $('.timeline-chart');
	var $document = $(document);
	var dragStartX, dragStartSimTime, lastSimTime, lastRealTime, dragging = false, wasRunning;
	$document.on('mousedown', '.timeline-chart', function (event) {
		dragging = true;
		$(document.body).addClass('dragging');
		dragStartX = event.screenX;
		dragStartSimTime = Clock.time();
		wasRunning = Clock.running();
		Clock.pause();
		inertia.stop();
	});
	$document.on('mousemove', function (event) {
		if (!dragging) return;
		event.preventDefault();
		var dX = dragStartX - event.screenX;
		var dTime = dX * timeScale;
		lastSimTime = dragStartSimTime + dTime;
		lastRealTime = Date.now();
		Clock.set(lastSimTime);
	});
	$document.on('mouseup', function (event) {
		if (!dragging) return;
		dragging = false;
		$(document.body).removeClass('dragging');

		var dX = dragStartX - event.screenX;
		var dTime = dX * timeScale;
		var newSimTime = dragStartSimTime + dTime;
		var newRealTime = Date.now();
		var dragSpeed = (newSimTime - lastSimTime)/(newRealTime - lastRealTime);
		Clock.set(newSimTime);

		// inertia
		inertia.start(dragSpeed);

		if(wasRunning) Clock.start();
	});

	var inertia = (function () {
		function timing (dTime, duration) {
			duration = duration || 1000;
			var progress = Math.min(dTime/duration, 1);
			return progress;
		}

		var interval;

		/*return {
			start: function (startSpeed) {
				window.clearInterval(interval);
				var finalSpeed = Clock.speed();
				var dropRealTime = Date.now();
				interval = window.setInterval(function () {
					var dTime = Date.now() - dropRealTime;
					var factor = timing(dTime);
					Clock.speed(startSpeed * (1-factor) + finalSpeed * factor);
					if (factor === 1) window.clearInterval(interval);
				}, 20);
			},
			stop: function () {
				window.clearInterval(interval);
			}
		};*/
		return {
			start: function () {},
			stop: function () {}
		}
	})();

});
