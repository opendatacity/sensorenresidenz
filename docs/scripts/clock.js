'use strict';
/** @namespace */
var Clock = (function () { // jshint ignore:line

// Remains undefined; used to check other variables against.
var undefined; // jshint ignore:line
// Reference points for the simulation.
var simTimeAtLastManipulation, realTimeAtLastManipulation;

// Is the simulation currently running? Used to pause and unpause.
var running = 1;

var eventHandlers = {};
var simTimeAtLastTick;

// Options object; will be merged with the other options.
var o = {
	time: new Date(),
	speed: 1,
	earliest: 0,
	latest: Infinity,
	pulse: 20 // the interval length for the `heartbeat` interval
};

var errors = {
	notInitialized: function () {
		this.name = 'NotInitializedError';
		this.message = 'Clock is not initialized. '+
			'Call `Clock.init([options])` first.';
		this.toString = function () { return this.message; };
	}
};

// Functions that manipulate clock properties need to be sure that the clock
// has been initialized. Throws an error if it hasn't.
function _checkInitialization () {
	if (simTimeAtLastManipulation === undefined) throw new errors.notInitialized();
	return true;
}
// Triggers an event handler.
function _trigger (handler) {
	if (!eventHandlers[handler]) return;
	for (var i=0, l=eventHandlers[handler].length; i<l; i++) {
		eventHandlers[handler][i](_simTime());
	}
}
// Returns the real unix time
function _realTime () {
	return (new Date()).valueOf();
}
// Returns the current simulated time
function _simTime () {
	var t = simTimeAtLastManipulation + running * o.speed * _realTimeSinceLastManipulation();
	return _bounded(t);
}
// Returns the milliseconds elapsed since the clock was last manipulated
function _realTimeSinceLastManipulation () {
	return _realTime() - realTimeAtLastManipulation;
}
// Called whenever there are manipulations that change properties of the clock
// to update the reference times.
function _willManipulate () {
	simTimeAtLastManipulation = _simTime();
	realTimeAtLastManipulation = _realTime();
}
// Helper that makes sure a given time is within the upper and lower bounds
// specified in the options.
function _bounded (t) {
	return Math.max(o.earliest, Math.min(o.latest, t));
}
function _heartbeatInterval () {
	var simTimeAtCurrentTick = _simTime();
	if (simTimeAtCurrentTick !== simTimeAtLastTick) _trigger('tick');
	simTimeAtLastTick = simTimeAtCurrentTick;
	window.requestAnimationFrame(_heartbeatInterval);
}

/** 
 * Initializes the clock
 * @param {Object} [options]
 * @param {Number} [options.time]
 *    The time at which the clock starts. Defaults to the
 *    current system time.
 * @param {Number} [options.speed]
 *    How much faster the simulated clock advances compared to a
 *    real clock. A `speed` of 1 is real-time; 10 is ten times real-time;
 *    -1 reverses time; etc.
 *    Defaults to 1.
 * @param {Number} [options.earliest]
 *    The lower bound for the simulated time. Defaults to 0.
 * @param {Number} [options.latest]
 *    The upper bound for the simulated time. Defaults to `Infinity`.
 * @memberof Clock
 */
function init (options) {
	$.extend(o, options);
	set(o.time.valueOf());
	window.requestAnimationFrame(_heartbeatInterval);
}

/**
 * - If an argument is provided, sets the speed of the simulation.
 * - If no argument is provided, returns the current speed.
 * @param {Number} [speed]
 * @returns {Number}
 * @memberof Clock
 */
function speed (val) {
	_checkInitialization();
	if (val === undefined) return o.speed;
	_willManipulate();
	o.speed = val;
	_trigger('speedchange');
}

/**
 * Unpauses the clock if it has been paused before.
 * @memberof Clock
 */
function start () {
	_checkInitialization();
	if (!running) {
		_willManipulate();
		running = 1;
		_trigger('play');
	}
}

/**
 * Pauses the clock. Equivalent to calling `Clock.speed(0)`, except that
 * the current speed will be remembered and can be resumed later on.
 * @memberof Clock
 */
function pause () {
	_checkInitialization();
	if (running) {
		_willManipulate();
		running = 0;
		_trigger('pause');
	}
}

/**
 * Returns true if the clock is currently paused, otherwise false.
 * @returns {Boolean}
 * @memberof Clock
 */
function paused () {
	return !running;
}

/**
 * Returns true if the clock is currently running, otherwise false.
 * @returns {Boolean}
 * @memberof Clock
 */
function isRunning () {
	return running;
}

/**
 * Sets the clock.
 * @param {Number|Date} time
 * @memberof Clock
 */
function set (t) {
	_willManipulate();
	simTimeAtLastManipulation = _bounded(t.valueOf());
}

/**
 * Returns the current simulated time as a unix timestamp.
 * @returns {Number}
 * @memberof Clock
 */
function get () {
	_checkInitialization();
	return _simTime();
}

/**
 * Returns the current simulated time as a JavaScript Date instance.
 * @returns {Date}
 * @memberof Clock
 */
function date () {
	return new Date(_simTime());
}

/**
 * - If an argument is provided, sets the simulated time.
 * - If no argument is provided, returns the current simulated time as a
 *   unix timestamp.
 * @param {Number} [time]
 * @returns {Number}
 * @memberof Clock
 */
function time (t) {
	if (t === undefined) return get();
	set(t);
}

/**
 * Returns the current lower bound of the clock.
 * @returns {Number}
 * @memberof Clock
 */
function earliest () {
	return o.earliest;
}

/**
 * Returns the current upper bound of the clock.
 * @returns {Number}
 * @memberof Clock
 */
function latest () {
	return o.latest;
}

/**
 * Attaches an event handler.
 * @param {String} handler
 *   The event to listen to. Possible values are `start`, `pause`,
 *   `speedchange`.
 * @param {Function} callback
 *   A function that will be called when the event is fired.
 * @memberof Clock
 */
function on (handler, callback) {
	if (!eventHandlers[handler]) eventHandlers[handler] = [];
	eventHandlers[handler].push(callback);
	console.log(eventHandlers);
}

return {
	init: init,
	time: time,
	get: get,
	date: date,
	speed: speed,
	earliest: earliest,
	latest: latest,
	start: start,
	pause: pause,
	paused: paused,
	running: isRunning,
	set: set,
	on: on,

	error: errors
};
})();
