'use strict';
var H = (function () {
	var undefined;

	var dict = {
		umlauts: {
			'ä': 'ae',
			'ü': 'ue',
			'ö': 'oe',
			'Ä': 'Ae',
			'Ö': 'Oe',
			'Ü': 'Ue',
			'ß': 'ss'
		}
	}
	function _replace (subDict) {
		return function (letter) {
			var m = dict[subDict][letter];
			if (!m) return letter;
			return m;
		}
	}

	var H = function (value) { return new Helper(value); }
	var Helper = function (value) {
		if (value instanceof Helper) { this.v = value.v; }
		else { this.v = value; }
		if (this.v === undefined) this.v = '';
		if (this.v === null) this.v = 'null';
	}
	Helper.prototype.umlautify = function() {
		this.v = this.v.replace(/./g, _replace('umlauts'));
		return this;
	}
	Helper.prototype.toCSSClassName = function() {
		this.v = this.v
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9-\s]/g, '')
		.replace(/\s+/g, '-');
		return this;
	};
	Helper.prototype.toString = function () {
		return this.v.toString();
	}
	Helper.prototype._ = function() {
		return this.v;
	}
	return H;
})();
