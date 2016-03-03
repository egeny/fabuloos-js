/*global Renderer, FlashRenderer, DM */

/**
 * DailymotionRenderer
 * @constructor
 *
 * @param {object} config The renderer config
 *
 * @returns {DailymotionRenderer} A new DailymotionRenderer instance
 */
function DailymotionRenderer( config ) {
	var
		instance = this,
		script, firstScript; // iframe mode only

	instance.config = Renderer.merge( config, DailymotionRenderer.config ); // Merge the config with defaults
	instance        = (DailymotionRenderer.mode === "flash" ? FlashRenderer : Renderer).init( instance );

	// Append the "playerapiid" to the URL to correctly dispatch events
	instance.config.data += "&playerapiid=" + instance.config.id;

	// On iframe mode, prepend the iframe's API script to the list of script tags
	if (DailymotionRenderer.mode === "iframe") {
		script     = document.createElement( "script" );
		script.src = "//api.dmcdn.net/all.js";
		// Handle the script error
		script.onerror = function() {
			DailymotionRenderer.script = false;
		};

		firstScript = document.getElementsByTagName( "script" )[0];
		firstScript.parentNode.insertBefore( script, firstScript );
	}

	// Prepare a closure for the timeupdate event
	// (will be called by window, so correct the "this")
	instance.timeupdate = function() {
		// Dispatch a "timeupdate" event
		instance.dispatch( "timeupdate" );
	};

	return instance;
} // end of DailymotionRenderer constructor


/**
 * Detect the API mode (iframe or flash)
 * It have to be done right after the constructor since even the inheritance depend on this
 * @static
 * @type {string}
 */
DailymotionRenderer.mode = !!window.postMessage ? "iframe" : (FlashRenderer.isSupported ? "flash" : "");


// Set the constructor name if it doesn't exists (IE)
// Beware to only set it if undefined, this property is read-only in strict mode
if (!DailymotionRenderer.name) {
	DailymotionRenderer.name = "DailymotionRenderer";
}

DailymotionRenderer.prototype = DailymotionRenderer.mode === "flash" ? new FlashRenderer() : new Renderer(); // Inherit from Renderer
DailymotionRenderer.prototype.constructor = DailymotionRenderer; // Don't forget to correct the constructor


/**
 * Default plugin configuration
 * @static
 * @type {object}
 */
DailymotionRenderer.config = {
	data: "http://www.dailymotion.com/swf?chromeless=1&enableApi=1"
};


/**
 * The delay between each timeupdate event
 * @static
 * @type {Number}
 */
DailymotionRenderer.timeupdateDelay = 250;


/**
 * Regular expression to test a youtube URL or retrieve the video ID
 * @static
 * @type {RegExp}
 */
DailymotionRenderer.RegExp = /dailymotion(?:.+)video\/([\w+]{6})/;


/**
 * Check if a given URL is readable by this renderer
 * @static @function
 *
 * @param {string} url The url to check
 *
 * @returns {string} Returns "probably" if the URL seems to be a Youtube valid URL, otherwise return an empty string
 */
DailymotionRenderer.canPlay = function( url ) {
	return DailymotionRenderer.RegExp.test( url ) ? "probably" : "";
};


/**
 * The DailymotionRenderer can only play Youtube's video so this method will always return an empty string
 * @static
 * @type {function}
 */
DailymotionRenderer.canPlayType = function() {
	return "";
};


/**
 * A cache for the internal handlers
 * @see #onYouTubePlayerReady
 * @static
 * @type {object}
 */
DailymotionRenderer.handlers = { length: 0 };


/**
 * Will this renderer be supported on this browser?
 * @static
 * @type {function}
 */
DailymotionRenderer.isSupported = !!DailymotionRenderer.mode;

// If supported, append this renderer to the supported renderers stack
if (DailymotionRenderer.isSupported) {
	Renderer.supported.push( DailymotionRenderer );
}


// Extend the DailymotionRenderer prototype
Renderer.extend(DailymotionRenderer.prototype, {

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

		// Thanks to Dailymotion, the iframe API is totally different from the flash one
		if (DailymotionRenderer.mode === "iframe") {
			switch (property) {
				case "currentTime":
					return this.api.currentTime;

				case "muted":
					return this.api.muted;

				case "src":
					return this.cache.properties.src;

				case "volume":
					return this.api.volume;

				default:
					return this.api[property];
			}

			// Skip the flash API
			return;
		}

		// Some properties have to be handled in a specific way
		switch (property) {
			case "currentTime":
				return this.api.getCurrentTime();

			case "duration":
				return this.api.getDuration();

			case "muted":
				return this.api.isMuted();

			case "paused":
				return this.api.getPlayerState() === 2;

			case "volume":
				return this.api.getVolume() / 100;

			default:
				return this.api[property];
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
				this.timer = window.setInterval( this.timeupdate, DailymotionRenderer.timeupdateDelay );
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
		var id;

		// First, check if the renderer is ready
		if (!this.isReady) {
			// It doesn't seems, store this value in the cache
			this.cache.properties[property] = value;
			return; // Stop here
		}

		// Thanks to Dailymotion, the iframe API is totally different from the flash one
		if (DailymotionRenderer.mode === "iframe") {
			switch (property) {
				case "currentTime":
					this.api.seek(value);
				break;

				case "muted":
					// In the documentation we should have a "muted" method but we don't
					// The setMuted can only mute (not unmute) so use toggleMute
					if (value !== this.api.muted) {
						this.api.toggleMuted();
						this.api.muted = !!value; // This value is never updated so update it manually
					}
				break;

				case "src":
					// Ignore asking to change for the same source
					// Will prevent defining the same source on initializing
					if (value === this.cache.properties.src) {
						break;
					}

					// Get the video ID
					id = value.match(DailymotionRenderer.RegExp);

					// Store the source value in the cache
					this.cache.properties[property] = id ? value : "";

					// Set the source using the video ID (if found)
					if (id) {
						this.api.load(id[1]);
					}
				break;

				case "volume":
					this.api.setVolume(value);
				break;

				default:
					// By default, store the property's value in the cache
					this.cache.properties[property] = value;
			}

			// Skip the flash API
			return;
		}

		// Some properties have to be handled in a specific way
		switch (property) {
			case "currentTime":
				this.api.seekTo(value);
			break;

			case "muted":
				this.element[value ? "mute" : "unMute"]();

				// Dispatch a "volumechange" event
				this.dispatch( "volumechange" );
			break;

			case "src":
				// Get the video ID
				id = value.match(DailymotionRenderer.RegExp);

				// Store the source value in the cache
				this.cache.properties[property] = id ? value : "";

				// Set the source using the video ID (if found)
				if (id) {
					this.api.loadVideoById(id[1]);
				}
			break;

			case "volume":
				// Youtube's volume values are between 0 and 100
				this.element.setVolume( value * 100 );

				// Dispatch a "volumechange" event
				this.dispatch( "volumechange" );
			break;

			default:
				// By default, store the property's value in the cache
				this.cache.properties[property] = value;
		}
	}, // end of set()

	play: function() {
		return this.api["play" + (DailymotionRenderer.mode === "flash" ? "Video" : "")]();
	},

	pause: function() {
		return this.api["pause" + (DailymotionRenderer.mode === "flash" ? "Video" : "")]();
	}

}); // end of Renderer.extend()


// Override the "replace" method on iframe mode
if (DailymotionRenderer.mode === "iframe") {
	/**
	 * Replace an element with the Dailymotion's iframe
	 * @function
	 *
	 * @param {string|Element} The element or element ID to replace
	 */
	DailymotionRenderer.prototype.replace = function(element) {
		var
			// Store a reference to the current instance (used by some closures)
			instance = this,

			// Create a closure to recall this method (see below)
			self = function() {
				instance.replace( element );
			};

		// If the Dailymotion's script isn't ready, recall this method in 10ms
		if (!DailymotionRenderer.script) {
			// Recall only if the "script" property doesn't exists (prevent script error)
			return DailymotionRenderer.script === undefined ? window.setTimeout(self, 10) : undefined;
		}

		var id = this.config.src ? this.config.src.match(DailymotionRenderer.RegExp) : null;

		this.api = DM.player(element, {
			video: id[1],
			width:  this.config.width,
			height: this.config.height,
			params: {
				api:        1,
				chromeless: 1,
				info:       0,
				logo:       0,
				related:    0
			}
		});

		this.api.addEventListener("apiready", function() {
			instance.ready();
		});

		var event, events = ["play", "playing", "pause", "ended", "canplay", "canplaythrough", "timeupdate", "progress", "seeking", "seeked", "volumechange", "durationchange", "fullscreenchange", "error"];
		while ((event = events.shift())) {
			this.api.addEventListener(event, this.handler);
		}
	}; // end of replace()
}


window.onDailymotionPlayerReady = function( id ) {
	var
		// Retrieve the instance
		instance = DailymotionRenderer.instances[id],

		// Create an identifier for the internal handler
		handler = "handler_" + (DailymotionRenderer.handlers.length + 1);

	// Abort if we couldn't find the instance
	if (!instance) { return; }

	/**
	 * Since Youtube's addEventListener method call on window.something
	 * We have to retrieve the right DailymotionRenderer instance.
	 * Using DailymotionRenderer.instances["id"] doesn't work
	 * (the Youtube player cannot call on an array)
	 * We have to create a closure calling the right instance.
	 * This closure will be store in a fake array and will be called
	 * Using DailymotionRenderer.handlers.handler_X (where X is unique).
	 */
	DailymotionRenderer.handlers.length++;
	DailymotionRenderer.handlers[handler] = function() {
		instance.handleStateChange.apply( instance, arguments );
	};

	// Register the event on the player
	instance.element.addEventListener( "onStateChange", "DailymotionRenderer.handlers." + handler );

	// Create a shorthand for the API
	instance.api = instance.element;

	// Call the regular's Renderer ready method
	instance.ready();
}; // end of onYouTubePlayerReady()

// Listen for the Youtube's iframe script to be ready
window.dmAsyncInit = function() {
	DailymotionRenderer.script = true;
};

// Expose
window.DailymotionRenderer = DailymotionRenderer;
