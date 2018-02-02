var getCSS = (function () {
	var _cache = {};

	return function (selector) {
		var result = _cache[selector];
		if (result) return result;

		for (var i=0, l=document.styleSheets.length; i<l; i++) {
			var sheet = document.styleSheets[i];
			for (var j=0, ll=sheet.cssRules.length; j<ll; j++) {
				var rule = sheet.cssRules[j];
				if (rule.selectorText && rule.selectorText === selector) {
					result = rule.style;
					_cache[selector] = result;
					return result;
				}
			}
		}

		return false;
	}
})();
