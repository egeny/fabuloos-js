var
	/**
	 * A RegExp used to check if a string is a timestamp
	 * @type {RegExp}
	 */
	rTimestamp = /(\d+(?:[\.|,]\d+)?)(?=[:hms]|$)/,

	/**
	 * A RegExp used to retrieve the number of seconds in a timestamp string
	 * @type {RegExp}
	 */
	rSeconds = /(\d+(?:[\.|,]\d+)?)s?$/,

	/**
	 * A RegExp used to retrieve the number of minutes in a timestamp string
	 * @type {RegExp}
	 */
	rMinutes = /(?:\d+:)?(\d+)(?=:|m)/,

	/**
	 * A RegExp used to retrieve the number of hours in a timestamp string
	 * @type {RegExp}
	 */
	rHours = /^(\d+)(?:(?::\d+){2}|h)/,

	/**
	 * The internal track used to store cues
	 * @type {fab.Track}
	 */
	track,
	cache = {};


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
fab.toSeconds = function( timestamp ) {
	timestamp += ""; // Force string conversion

	var
		s = timestamp.match( rSeconds ),
		m = timestamp.match( rMinutes ),
		h = timestamp.match( rHours );

	s = s ? parseFloat( s[1].replace( ",", "." ) ) : 0;
	m = m ? parseInt( m[1], 10 ) : 0;
	h = h ? parseInt( h[1], 10 ) : 0;

	return (h * 3600) + (m * 60) + s;
}; // end of toSeconds()


// Extend the framework with new methods
fab.extend({
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
		//console.log("registering handler for", timestamp);

		var isAbsolute = rTimestamp.test( timestamp );

		if (!track) {
			track = this.addTrack( "metadata" );

			this.on("entercue", function( event ) {
				var
					handlers = cache[event.cue.startTime],
					i = 0;

				while((handler = handlers[i++]) && handler.times) {
					handler.handler.call( this );
					handler.times--;
				}
			});
		}

		if (isAbsolute) {
			var time = fab.toSeconds( timestamp );

			if (!cache[time]) {
				cache[time] = [];
			}

			cache[time].push({
				handler: handler,
				times: once || Infinity
			});

			track.addCue( new fab.TrackCue( fab.toSeconds( timestamp ), fab.toSeconds( timestamp ) + 0.25 ) );
		} else {
			// 25%
			// half
			//var time = /(\d+)%/.exec( timestamp );
			//console.log(time);
return;
			//var time = (this.duration() / 100) * parseFloat( time[1] );
			//console.log(time);
		}
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



	/**
case "height":
case "width":
	// Don't bother if we haven't any element to measure
	if (!this.element) { return 0; }

	value = window.getComputedStyle ?
	// Pass a second argument (null) to getComputedStyle for compatibility reasons
	// @see https://developer.mozilla.org/en-US/docs/DOM/window.getComputedStyle
	window.getComputedStyle(this.element, null).getPropertyValue(property) :
	// Use the scrollWidth/scrollHeight property since it is calculated in a different way in IE
	this.element["scroll" + property.charAt(0).toUpperCase() + property.slice(1)];

	return parseInt(value, 10);
	 */



	/**
	 * TODO
	 */
	time: function(value) {
		return this[(value === undefined) ? "get" : "set"]("currentTime", value);
	}, // end of time()




	/**
	 * Get the player's ratio
	 * @function
	 *
	 * @returns {float} Return the player's ratio or 0 if the player has no width or height
	 */
	ratio: function() {
		var
			width  = this.width(),
			height = this.height();

		return (width && height) ? width / height : 0;
	}, // end of ratio()


	/**
	 * Toggle the playback of the media
	 * @function
	 *
	 * @returns {fabuloos} Return the current instance of the player to allow chaining
	 */
	togglePlay: function() {
		return this[this.paused() ? "play" : "pause"](); // Chaining
	}, // end of togglePlay()



	/**
	 * Get the video's ratio
	 * @function
	 *
	 * @returns {float} Return the video's ratio or 0 if the metadata wasn't received yet or if there is no video
	 */
	videoRatio: function() {
		var
			width  = this.videoWidth(),
			height = this.videoHeight();

		return (width && height) ? width / height : 0;
	}, // end of ratio()


	/**
	 * Get the full viewport's infos
	 * @function
	 *
	 * @returns {object} Return the full viewport infos (size and position) or undefined if none
	 */
	viewport: function() {
		var
			// Get player's size
			width       = this.width(),
			height      = this.height(),
			ratio       = this.ratio(),

			// Get video's size
			videoWidth  = this.videoWidth(),
			videoHeight = this.videoHeight(),
			videoRatio  = this.videoRatio(),

			horizontal, vertical, // Horizontal and vertical spacing
			viewport    = {}; // The object to return

		// There is no viewport
		if (!ratio || !videoRatio) {
			return;
		}

		// Calculate the viewport size
		if (ratio < videoRatio) {
			viewport.width  = width;
			viewport.height = Math.floor( videoHeight * (width / videoWidth) );
		} else {
			viewport.width  = Math.floor( videoWidth * (height / videoHeight) );
			viewport.height = height;
		}

		// Calculate horizontal and vertical spacing
		horizontal = (width  - viewport.width)  / 2;
		vertical   = (height - viewport.height) / 2;

		// Define top, right, bottom and left
		viewport.top    = Math.floor( vertical );
		viewport.right  = Math.ceil( horizontal );
		viewport.bottom = Math.ceil( vertical );
		viewport.left   = Math.floor( horizontal );

		return viewport;
	}, // end of viewport()


	/**
	 * TODO
	 */
	volume: function( value ) {
		if (value === undefined) {
			return this.get( "volume" );
		}

		var volume = typeof value === "string" ? this.get( "volume" ) + parseFloat( value ) : value;

		volume = volume < 0 ? 0 : volume;
		volume = volume > 1 ? 1 : volume;
		this.set( "volume", value );

	} // end of volume()

}); // end of fab.extend()