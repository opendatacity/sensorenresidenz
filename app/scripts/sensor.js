var Sensor = (function () {
	var undefined;

	function D(s, a) {
		a = a || 0;
		return new Date(s.valueOf() + a);
	}

	function Sensor(sensor) {
		var me = this;
		this.events = sensor.events.map(function (event) {
			return {state: event[1], start: D(event[0]), sensor: me};
		});
		for (var i = 0; i < this.events.length - 1; i++) {
			this.events[i].end = this.events[i + 1].start;
			this.events[i].duration = this.events[i].end - this.events[i].start;
		}
		this.first = this.events[0];
		this.last = this.events[this.events.length - 1];
		this.duration = this.last.start - this.first.start;
		this.type = sensor.type;
		this.continuous = sensor.continuous;

		this._cache = {interval: {}}
	}

	Sensor.prototype.event = function (index) {
		// Returns the event at the provided `index`, wrapping around if it is
		// outside the event array's bounds. This means that `this.event(-1)`
		// returns the last event and so on.
		index = index % this.events.length;
		if (index < 0) {
			index += this.events.length;
		}
		return this.events[index];
	}

	Sensor.prototype.findIndex = function (date) {
		// The search algorithm guesses where it might find the date within the array
		// by interpolating `date`. If the guess was too high, it walks backwards
		// through the array, otherwise forwards, looking if `date` falls between
		// each `event`'s  `start` and `end` dates.
		date = D(date);

		// Don't bother searching if the requested `date` is out of bounds.
		// We have to ignore the last event because we can't know how long its
		// state will last.
		if (date < this.first.start || date >= this.last.start) return false;

		var dDate = date - this.first.start;
		var searchStart = Math.round(dDate / this.duration * this.events.length);
		var sign = (this.event(searchStart).end < date) ? 1 : -1;

		for (var i = 0; i < this.events.length; i++) {
			var j = searchStart + sign * i;
			if (this.event(j).start <= date && this.event(j).end > date) {
				return j;
			}
		}
		return false;
	};

	Sensor.prototype.findSeveral = function (date, number) {
		var index = this.findIndex(date);
		if (index === false) return false;
		var start = Math.max(index - number, 0);
		return this.events.slice(start, index);
	};

	Sensor.prototype.find = function (date) {
		var index = this.findIndex(date);
		if (index === false) return false;
		return this.event(index);
	};

	Sensor.prototype.intervals = function (intervalLength, start) {
		var results;
		var hash = intervalLength + '/' + start;
		if (results = this._cache.interval[hash]){
			return results;
		}

		// Default arguments
		intervalLength = intervalLength || 36e5;
		if (typeof start === 'undefined') {
			start = this.first.start;
			start.setHours(0);
			start.setMinutes(0);
			start.setSeconds(0);
			start.setMilliseconds(0);
		}
		start = start.valueOf();

		results = {intervals: [], start: D(start), intervalLength: intervalLength};
		var currentInterval = {start: start, end: start + intervalLength};
		var i = 0, currentEvent;
		while (currentInterval.start < this.last.start) {
			var result = {start: D(currentInterval.start), end: D(currentInterval.end), values: {}, mean: 0};
			// To caluclate the mean value during an interval,
			// we need the area over the interval and its length.
			var intervalArea = 0;
			while ((currentEvent = this.event(i)).end) {
				// Process events until the currently processed event
				// ends after the currently processed interval.

				if (currentEvent.start > currentInterval.end) break;

				// How much of the current event falls within the interval?
				var eventWithinIntervalStart = Math.max(currentEvent.start, currentInterval.start);
				var eventWithinIntervalEnd = Math.min(currentEvent.end, currentInterval.end);
				var eventWithinIntervalDuration = eventWithinIntervalEnd - eventWithinIntervalStart;

				if (!result.values[currentEvent.state]) result.values[currentEvent.state] = 0;
				result.values[currentEvent.state] += eventWithinIntervalDuration;

				intervalArea += eventWithinIntervalDuration * currentEvent.state;

				if (currentEvent.end > currentInterval.end) break;
				else i++;
			}
			result.mean = intervalArea / intervalLength;

			results.intervals.push(result);
			currentInterval.start += intervalLength;
			currentInterval.end += intervalLength;
		}
		results.end = D(currentInterval.end);

		this._cache.interval[hash] = results;
		return results;
	};

	Sensor.prototype.statistics = function () {
		var result = {sums: [], totalDuration: 0}, map = {};
		this.events.forEach(function (event) {
			if (event.duration === undefined) return;
			var state = event.state;
			if (!map[state]) {
				var obj = {value: state, duration: 0};
				map[state] = obj;
				result.sums.push(obj);
			}
			map[state].duration += event.duration;
			result.totalDuration += event.duration;
		});
		result.type = this.type;
		result.sums.sort(function (a, b) {
			return a.value - b.value;
		});
		return result;
	};

	/**
	 * Traverses two events sensors and multiplies their states */
	// Sensor.prototype.multiply = function (sensor2) {
	// 	var sensor1 = this;
	// 	if (sensor1.type !== sensor2.type) throw new SensorTypeMismatchError(sensor1, sensor2);
	// 	var startTime = Math.max(sensor1.first.start, sensor2.first.start);
	// 	var endTime = Math.min(sensor2.last.start, sensor2.last.start);
	// 	var timePointer = startTime;
	// 	var i1 = 0, i2 = 0;
	// 	var results = { events: [] };
	// 	while (timePointer < endTime) {
	// 		// increment i1 and i2 until the respective events end after `timePointer`
	// 		while (sensor1[i1].end <= timePointer) i1++;
	// 		while (sensor1[i2].end <= timePointer) i2++;

	// 	}
	// }

	function SensorTypeMismatchError(sensor1, sensor2) {
		this.toString = function () {
			return 'Attempted a binary operation on two sensors of different type (' +
				sensor1.type + ' and ' + sensor2.type + ')';
		}
	}

	return Sensor;
	
})();

if (typeof module !== 'undefined') module.exports = Sensor;
