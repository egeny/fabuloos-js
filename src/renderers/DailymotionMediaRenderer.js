/*global Renderer, FlashRenderer */

/**
 * DailymotionMediaRenderer
 * @constructor
 *
 * @param {object} config The renderer config
 *
 * @returns {DailymotionMediaRenderer} A new DailymotionMediaRenderer instance
 */
function DailymotionMediaRenderer( config ) {
	var instance = this;

	instance.config = Renderer.merge( config, DailymotionMediaRenderer.config ); // Merge the config with defaults
	instance        = FlashRenderer.init( instance );

	// Append the "playerapiid" to the URL to correctly dispatch events
	instance.config.data += "&playerapiid=" + instance.config.id;

	// Prepare a closure for the timeupdate event
	// (will be called by window, so correct the "this")
	instance.timeupdate = function() {
		// Dispatch a "timeupdate" event
		instance.dispatch( "timeupdate" );
	};

	return instance;
} // end of DailymotionMediaRenderer constructor


// Set the constructor name if it doesn't exists (IE)
// Beware to only set it if undefined, this property is read-only in strict mode
if (!DailymotionMediaRenderer.name) {
	DailymotionMediaRenderer.name = "DailymotionMediaRenderer";
}

DailymotionMediaRenderer.prototype = new FlashRenderer(); // Inherit from FlashRenderer
DailymotionMediaRenderer.prototype.constructor = DailymotionMediaRenderer; // Don't forget to correct the constructor


/**
 * Default plugin configuration
 * @static
 * @type {object}
 */
DailymotionMediaRenderer.config = {
	data: "http://www.dailymotion.com/swf?chromeless=1&enableApi=1"
};


/**
 * The delay between each timeupdate event
 * @static
 * @type {Number}
 */
DailymotionMediaRenderer.timeupdateDelay = 250;


/**
 * Regular expression to test a youtube URL or retrieve the video ID
 * @static
 * @type {RegExp}
 */
DailymotionMediaRenderer.RegExp = /dailymotion(?:.+)video\/([\w+]{6})/;


/**
 * Check if a given URL is readable by this renderer
 * @static @function
 *
 * @param {string} url The url to check
 *
 * @returns {string} Returns "probably" if the URL seems to be a Youtube valid URL, otherwise return an empty string
 */
DailymotionMediaRenderer.canPlay = function( url ) {
	return DailymotionMediaRenderer.RegExp.test( url ) ? "probably" : "";
};


/**
 * The DailymotionMediaRenderer can only play Youtube's video so this method will always return an empty string
 * @static
 * @type {function}
 */
DailymotionMediaRenderer.canPlayType = function() {
	return "";
};


/**
 * A cache for the internal handlers
 * @see #onYouTubePlayerReady
 * @static
 * @type {object}
 */
DailymotionMediaRenderer.handlers = { length: 0 };


/**
 * Will this renderer be supported on this browser?
 * @static
 * @type {function}
 */
DailymotionMediaRenderer.isSupported = FlashRenderer.isSupported;

// If supported, append this renderer to the supported renderers stack
if (DailymotionMediaRenderer.isSupported) {
	Renderer.supported.push( DailymotionMediaRenderer );
}


// Extend the DailymotionMediaRenderer prototype
Renderer.extend(DailymotionMediaRenderer.prototype, {

	/**
	 * Get a property's value
	 * @function
	 *
	 * @param {string} property The property name
	 *
	 * @returns The property's value or undefined if the property or element doesn't exists
	 */
	get: function( property ) {
		// Don't bother if this renderer isn't ready (has element and element ready)
		if (!this.isReady) {
			return;
		}

		// TODO: width/height

		// Some properties have to be handled in a specific way
		switch (property) {
			case "currentTime":
				return this.element.getCurrentTime();

			case "duration":
				return this.element.getDuration();

			case "muted":
				return this.element.isMuted();

			case "paused":
				return this.element.getPlayerState() === 2;

			case "volume":
				return this.element.getVolume() / 100;

			default:
				return this.element[property];
		}

	}, // end of get()


	/**
	 * Handle the Youtube's StateChange event
	 *
	 * @param {Number} state The new state code
	 */
	handleStateChange: function( state ) {
		switch (state) {
			case -1: // Unstarted
				// Set a flag to handle some initialization stuff
				this.unstarted = true;
			break;

			case 0: // Ended
				// Dispatch an "ended" event
				this.dispatch( "ended" );
			break;

			case 1: // Playing
				// Escaping from the unstarted state
				if (this.unstarted) {
					// Dispatch a "loadeddata" event
					this.dispatch("loadeddata");

					// Dispatch a "durationchange" event
					this.dispatch( "durationchange" );

					// Clean the instance of this flag
					delete this.unstarted;

					// Prevent automatic autoplay
					if (!this.get( "autoplay" )) {
						// Pause and exit since we aren't playing anymore
						return this.pause();
					}
				}

				// Dispatch a "playing" event
				this.dispatch( "playing" );

				// Set a timer to dispatch the "timeupdate" event
				this.timer = window.setInterval( this.timeupdate, DailymotionMediaRenderer.timeupdateDelay );
			break;

			case 2: // Paused
				// Dispatch a "paused" event
				this.dispatch( "pause" );

				// Clear the "timeupdate" interval
				window.clearInterval( this.timer );
			break;

			case 3: // Buffering
			break;
		}
	}, // end of internalHandler()


	/**
	 * Set a property's value.
	 * @function
	 *
	 * @param {string} property The property name
	 * @param {*} value The new property's value
	 */
	set: function( property, value ) {
		// First, check if the renderer is ready
		if (!this.isReady) {
			// It doesn't seems, store this value in the cache
			this.cache.properties[property] = value;
			return; // Stop here
		}

		// Some properties have to be handled in a specific way
		switch (property) {
			case "currentTime":
				this.element.seekTo( value );
			break;

			case "muted":
				this.element[value ? "mute" : "unMute"]();

				// Dispatch a "volumechange" event
				this.dispatch( "volumechange" );
			break;

			case "src":
				// Store the source value in the DOM (FIXME)
				this.element[property] = value;

				// Get the video ID
				var id = value.match( DailymotionMediaRenderer.RegExp );

				// Set the source using the video ID (if found)
				if (id) {
					this.element.loadVideoById( id[1] );
				}
			break;

			case "volume":
				// Youtube's volume values are between 0 and 100
				this.element.setVolume( value * 100 );

				// Dispatch a "volumechange" event
				this.dispatch( "volumechange" );
			break;

			default:
				// By default, store the property's value in the DOM (FIXME)
				this.element[property] = value;
		}
	}, // end of set()

	// Override API shorthands to match Youtube's methods
	play:  Renderer.createShorthand( "playVideo" ),
	pause: Renderer.createShorthand( "pauseVideo" )

}); // end of Renderer.extend()


window.onDailymotionPlayerReady = function( id ) {
	var
		// Retrieve the instance
		instance = DailymotionMediaRenderer.instances[id],

		// Create an identifier for the internal handler
		handler = "handler_" + (DailymotionMediaRenderer.handlers.length + 1);

	// Abort if we couldn't find the instance
	if (!instance) { return; }

	/*!
	 * Since Youtube's addEventListener method call on window.something
	 * We have to retrieve the right DailymotionMediaRenderer instance.
	 * Using DailymotionMediaRenderer.instances["id"] doesn't work
	 * (the Youtube player cannot call on an array)
	 * We have to create a closure calling the right instance.
	 * This closure will be store in a fake array and will be called
	 * Using DailymotionMediaRenderer.handlers.handler_X (where X is unique).
	 */
	DailymotionMediaRenderer.handlers.length++;
	DailymotionMediaRenderer.handlers[handler] = function() {
		instance.handleStateChange.apply( instance, arguments );
	};

	// Register the event on the player
	instance.element.addEventListener( "onStateChange", "DailymotionMediaRenderer.handlers." + handler );

	// Call the regular's Renderer ready method
	instance.ready();
}; // end of onYouTubePlayerReady()


// Expose
window.DailymotionMediaRenderer = DailymotionMediaRenderer;
