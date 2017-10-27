var i18n = (function () {
	dict = {
		motion: 'Bewegung',
		motionState: ['nein', 'ja'],

		'switch': 'Schalter',
		switchState: ['aus', 'an'],

		level: 'Stufe',
		hue: 'Farbton',
		saturation: 'Sättigung',

		contact: 'Kontakt',
		contactState: ['offen', 'geschlossen'],

		temperature: 'Temperatur',
		temperatureState: function (n) {
			if (n === undefined) return 'Temperatur';
			return n + ' °C';
		},
		acceleration: 'Beschleunigung',

		presence: 'Anwesenheit',
		presenceState: ['nicht zu Hause', 'zu Hause'],

		'MMM0': 'Jan',
		'MMM1': 'Feb',
		'MMM2': 'Mrz',
		'MMM3': 'Apr',
		'MMM4': 'Mai',
		'MMM5': 'Jun',
		'MMM6': 'Jul',
		'MMM7': 'Aug',
		'MMM8': 'Sep',
		'MMM9': 'Okt',
		'MMM10': 'Nov',
		'MMM11': 'Dez',

		events: function (n) {
			if (n === 0) return 'Keine Ereignisse';
			if (n === 1) return '1 Ereignis';
			return n + ' Ereignisse';
		}
	};

	return function (word, n) {
		var w = dict[word];
		if (typeof w === 'string') return w;
		if (_.isArray(w)) return w[n];
		if (typeof w === 'function') return w(n);
		if (n !== undefined) return n + ' ' + word;
		return word;
	}
})();
