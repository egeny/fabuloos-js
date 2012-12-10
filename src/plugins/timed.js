// Timed module
(function( player ) {

	// Use JavaScript script mode
	"use strict";

	var
		/**
		 * A RegExp used to check if a string is a timestamp
		 * @type {RegExp}
		 */
		rTimestamp = /(\d+(?:\.\d+)?)(?=[:hms]|$)/,

		/**
		 * A RegExp used to retrieve the number of seconds in a timestamp string
		 * @type {RegExp}
		 */
		rSeconds = /(\d+)s|(\d+(?:\.\d+)?)$/,

		/**
		 * A RegExp used to retrieve the number of minutes in a timestamp string
		 * @type {RegExp}
		 */
		rMinutes = /(\d+)m|(?:\d+:)?(\d+)(?=:)/,

		/**
		 * A RegExp used to retrieve the number of hours in a timestamp string
		 * @type {RegExp}
		 */
		rHours = /(\d+)h|^(\d+)(?::\d+){2}/;


	// Extend the player with new methods
	player.extend({
		/**
		 * Register an handler to be triggered at a given timestamp
		 * @function
		 *
		 * @param {number|string} timestamp The timestamp when to trigger the handler
		 * @param {function} handler The function to call when the timestamp will be reached
		 * @param {boolean} once TODO
		 *
		 * @returns {fabuloos} Return the current instance of the player to allow chaining
		 *
		 * @example
		 *  <code>
		 *    fabuloos(…)
		 *      .at( 1367, handle ), // Launch the "handle" function at 1367 sec
		 *      .at( "3:10", handle ), // Launch the "handle" function at 3 minutes and 10 seconds
		 *      .at( "1h03m10s", handle ), // Launch the "handle" function at 1 hour, 3 minutes and 10 seconds
		 *      .at( "50%", handle ), // Launch the "handle" function when the timestamp will reach 50% of the duration
		 *      .at( "half", handle ); // Launch the "handle" function when the timestamp will reach the "half" of the duration (@see fabuloos.TODO)
		 *  </code>
		 */
		at: function( timestamp, handler, once ) {
			/*if (!this.atHandler) {
				this.atHandler = function() {

					this.timer = window.setTimeout( arguments.callee, delta );
				};

				this.on( "timeupdate", this.atHandler );
			}

			if (!this.cache) {
				this.cache = {};
			}

			if (!this.cache[timestamp]) {
				this.cache[timestamp] = [];
			}

			this.cache[timestamp].push( handler );*/
		}, // end of at()


		/**
		 * TODO
		 */
		between: function( start, end, handler, once, every ) {

		}, // end of between()


		/**
		 * TODO
		 */
		every: function( timestamp, handler, relative ) {

		} // end of every()

	}); // end of player.extend()


	/**
	 * Convert a timestamp string to a number of seconds
	 * @static @function
	 *
	 * @param {string} timestamp The timestamp to convert
	 *
	 * @returns Return the number of seconds extracted from the timestamp
	 *
	 * @example
	 *  <code>
	 *    fabuloos.toSeconds( "10" ); // Return 10
	 *    fabuloos.toSeconds( "1:23" ); // Return 83
	 *    fabuloos.toSeconds( "1:23:45" ); // Return 5025
	 *    fabuloos.toSeconds( "1s" ); // Return 1
	 *    fabuloos.toSeconds( "2m" ); // Return 120
	 *    fabuloos.toSeconds( "3h" ); // Return 10800
	 *    fabuloos.toSeconds( "1m23" ); // Return 83
	 *    fabuloos.toSeconds( "1h23s" ); // Return 3623
	 *  </code>
	 */
	player.toSeconds = function( timestamp ) {
		timestamp += ""; // Force string conversion

		var
			s = timestamp.match( rSeconds ),
			m = timestamp.match( rMinutes ),
			h = timestamp.match( rHours );

		s = s ? parseFloat( s[1] || s[2] || 0 )   : 0;
		m = m ? parseInt( m[1] || m[2] || 0, 10 ) : 0;
		h = h ? parseInt( h[1] || h[2] || 0, 10 ) : 0;

		return (h * 3600) + (m * 60) + s;
	}; // end of toSeconds()

}( fabuloos )); // end of Timed module
