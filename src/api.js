function cycle() {
	// Don't bother cycling if there is no cues
	if (!this._cues.length) { return; }

	var
		cues = this._cues,
		time = this.get("currentTime"),
		cue, i = 0, type, at; // Loop specific

	// Loop through each cue to check if we have to launch the handler
	while ((cue = cues[i++])) {
		type = "at"    in cue ? "at"      : null;
		type = "start" in cue ? "between" : type;
		type = "every" in cue ? "every"   : type;

		switch (type) {
			case "at":
				at = fab.toSeconds(cue.at);
				if (time >= at && time <= (at + .25)) {
					!cue.active && cue.handler.call(this);
					cue.active = cue.active ? false : true;
				}
			break;

			case "between":
				if (time >= fab.toSeconds(cue.start) && time <= fab.toSeconds(cue.end)) {
					cue.handler.call(this);
				}
			break;

			case "every":
				var modulo = time % fab.toSeconds(cue.every);
				if (time > 1 && modulo < .25) {
					!cue.active && cue.handler.call(this);
					cue.active = cue.active ? false : true;
				}
			break;
		}
	}
} // end of cycle()

var
	/**
	 * A RegExp used to retrieve the number of milliseconds in a timestamp string
	 * @type {RegExp}
	 */
	rMilliseconds = /\.(\d+)|(\d+)\s*ms/i,

	/**
	 * A RegExp used to retrieve the number of seconds in a timestamp string
	 * @type {RegExp}
	 */
	rSeconds = /^[\w\s]*?(\d+)(?=\.|$)|(\d+)\s*s|(?:\d*:)?\d*:(\d+)/i,

	/**
	 * A RegExp used to retrieve the number of minutes in a timestamp string
	 * @type {RegExp}
	 */
	rMinutes = /(\d+)\s*m(?!s)|(?:\d*:)?(\d+):\d*/i,

	/**
	 * A RegExp used to retrieve the number of hours in a timestamp string
	 * @type {RegExp}
	 */
	rHours = /(\d+)\s*h|(\d+):\d*:\d*/i;


/**
 * Convert a timestamp string to a number of seconds
 *
 * @param {string} timestamp The timestamp to convert.
 * @return {number} Return the number of seconds extracted from the timestamp.
 *
 * @example
 *   // Milliseconds
 *   fab.toSeconds(".123");    // Return 0.123
 *   fab.toSeconds("0.123");   // Return 0.123
 *   fab.toSeconds("123ms");   // Return 0.123
 *   fab.toSeconds("::.123");  // Return 0.123
 *   fab.toSeconds("::0.123"); // Return 0.123
 *
 *   // Seconds
 *   fab.toSeconds("1");       // Return 1
 *   fab.toSeconds("1s");      // Return 1
 *   fab.toSeconds("::1");     // Return 1
 *
 *   // Minutes
 *   fab.toSeconds("1m");   // Return 60
 *   fab.toSeconds("1:");   // Return 60
 *   fab.toSeconds("1:23"); // Return 83
 *
 *   // Hours
 *   fab.toSeconds("1h");      // Return 3600
 *   fab.toSeconds("1::");     // Return 3600
 *   fab.toSeconds("1:23:45"); // Return 3783
 *
 *   // Combined
 *   fab.toSeconds("1h 23m 45s 567ms"); // Return 3783.567
 *   fab.toSeconds("1:23:45.567");      // Return 3783.567
 *
 *   // Negative
 *   fab.toSeconds("-1s");  // Return -1
 *   fab.toSeconds("-::1"); // Return -1
 *
 *   // Relative
 *   fab.toSeconds("50%");  // Will return duration * .5
 *   fab.toSeconds("half"); // Will return duration * .5
 */
fab.toSeconds = function(timestamp) {
	timestamp += ""; // Force string conversion

	var
		h  = timestamp.match(rHours),
		m  = timestamp.match(rMinutes),
		s  = timestamp.match(rSeconds),
		ms = timestamp.match(rMilliseconds),

	h  = h  ? parseInt(h[1]  || h[2], 10)         : 0;
	m  = m  ? parseInt(m[1]  || m[2], 10)         : 0;
	s  = s  ? parseInt(s[1]  || s[2] || s[3], 10) : 0;
	ms = ms ? parseInt(ms[1] || ms[2], 10)        : 0;
	ms = parseInt((ms * 100 + "").substr(0, 3), 10); // Zerofill

	return (h * 3600) + (m * 60) + s + (ms / 1000);
}; // end of fab.toSeconds()


fab.extend({
	init: function init(config) {
		this._cues = [];

		this.on("timeupdate", cycle);
		return this._super(config);
	},


	/**
	 * Register an handler for a given timestamp
	 *
	 * @param {number} timestamp The timestamp when to launch the handler.
	 * @param {function} handler The function to call when the timestamp is reached.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {string} timestamp The timestamp when to launch the handler.
	 * @param {function} handler The function to call when the timestamp is reached.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {object} obj An hash of timestamps and handlers.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @example
	 *   fab(…)
	 *    .at(10, function() { console.log("10 seconds"); })
	 *    .at("1m23", function() { console.log("cue reached"); })
	 *    .at({
	 *      "1s": handle,
	 *      "2m": handle,
	 *      "3h": handle,
	 *      "50%": handle
	 *    });
	 */
	at: function at(timestamp, handler) {
		if (arguments.length === 1 && arguments[0] && arguments[0].constructor === Object) {
			for (var t in arguments[0]) {
				this.at(t, arguments[0][t]);
			}

			return this; // Chaining
		}

		// Add a new internal cue
		this._cues.push({
			at:      timestamp,
			handler: handler
		});

		return this; // Chaining
	}, // end of at()


	/**
	 * Register an handler for a given interval
	 *
	 * @param {number} start The start point of the interval.
	 * @param {number} end The end point of the interval.
	 * @param {function} handler The function to call when a timeupdate event is triggered in the interval.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {string} start The start point of the interval.
	 * @param {number} end The end point of the interval.
	 * @param {function} handler The function to call when a timeupdate event is triggered in the interval.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {number} start The start point of the interval.
	 * @param {string} end The end point of the interval.
	 * @param {function} handler The function to call when a timeupdate event is triggered in the interval.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {string} start The start point of the interval.
	 * @param {string} end The end point of the interval.
	 * @param {function} handler The function to call when a timeupdate event is triggered in the interval.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @example
	 *   fab(…)
	 *    .between(10, 20, function() { console.log("current time between 10 and 20 seconds"); })
	 *    .between("1m", "2m" function() { console.log("current time between 1 and 2 minutes"); });
	 */
	between: function between(start, end, handler) {
		this._cues.push({
			start:   start,
			end:     end,
			handler: handler
		});

		return this; // Chaining
	}, // end of between()


	/**
	 * Register a recurrent handler
	 *
	 * @param {number} timestamp The timestamp when to launch the handler.
	 * @param {function} handler The function to call when the timestamp is reached.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {string} timestamp The timestamp when to launch the handler.
	 * @param {function} handler The function to call when the timestamp is reached.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {object} obj An hash of timestamps and handlers.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @example
	 *   fab(…)
	 *    .every(10, function() { console.log("Launched every 10 seconds"); })
	 *    .every("1m", function() { console.log("Launched every minutes"); });
	 */
	every: function every(timestamp, handler) {
		this._cues.push({
			every:   timestamp,
			handler: handler
		});

		return this; // Chaining
	}, // end of every()


	/**
	 * TODO
	 */
	forget: function forget(what) {

	} // end of forget()

});