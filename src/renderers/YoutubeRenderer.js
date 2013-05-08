/*global Renderer, FlashRenderer, YT */

/**
 * YoutubeRenderer
 * @constructor
 *
 * @param {object} config The renderer config
 *
 * @returns {YoutubeRenderer} A new YoutubeRenderer instance
 */
function YoutubeRenderer( config ) {
	var
		instance = this,
		script, firstScript; // iframe mode only

	instance.config = Renderer.merge( config, YoutubeRenderer.config ); // Merge the config with defaults
	instance        = (YoutubeRenderer.mode === "flash" ? FlashRenderer : Renderer).init( instance );

	// Append the "playerapiid" to the SWF URL to correctly dispatch events (flash API)
	instance.config.data += "&playerapiid=" + instance.config.id;

	// On iframe mode, prepend the iframe's API script to the list of script tags
	if (YoutubeRenderer.mode === "iframe") {
		script     = document.createElement( "script" );
		script.src = "//www.youtube.com/iframe_api";
		// Handle the script error
		script.onerror = function() {
			YoutubeRenderer.script = false;
		};

		firstScript = document.getElementsByTagName( "script" )[0];
		firstScript.parentNode.insertBefore( script, firstScript );
	}

	// Prepare a closure for the timeupdate event
	// (will be called by window using a setInterval, so correct the "this")
	instance.timeupdate = function() {
		// Dispatch a "timeupdate" event
		instance.dispatch( "timeupdate" );
	};

	return instance;
} // end of YoutubeRenderer constructor


/**
 * Detect the API mode (iframe or flash)
 * It have to be done right after the constructor since even the inheritance depend on this
 * @static
 * @type {string}
 */
YoutubeRenderer.mode = !!window.postMessage ? "iframe" : (FlashRenderer.isSupported ? "flash" : "");


// Set the constructor name if it doesn't exists (IE)
// Beware to only set it if undefined, this property is read-only in strict mode
if (!YoutubeRenderer.name) {
	YoutubeRenderer.name = "YoutubeRenderer";
}

// Inherit from FlashRenderer or Renderer depending on the API mode
YoutubeRenderer.prototype = YoutubeRenderer.mode === "flash" ? new FlashRenderer() : new Renderer();
YoutubeRenderer.prototype.constructor = YoutubeRenderer; // Don't forget to correct the constructor


/**
 * Default plugin configuration
 * @static
 * @type {object}
 */
YoutubeRenderer.config = {
	data: "http://www.youtube.com/apiplayer?enablejsapi=1&version=3"
};


/**
 * The delay between each timeupdate event
 * @static
 * @type {Number}
 */
YoutubeRenderer.timeupdateDelay = 250;


/**
 * Regular expression to test a youtube URL and/or retrieve the video ID
 * @static
 * @type {RegExp}
 */
YoutubeRenderer.RegExp = /youtu\.?be(?:\.com)?[\/|:](?:.+)?([\w\d]{11})/;


/**
 * Check if a given URL is readable by this renderer
 * @static @function
 *
 * @param {string} url The url to check
 *
 * @returns {string} Returns "probably" if the URL seems to be a Youtube valid URL, otherwise return an empty string
 */
YoutubeRenderer.canPlay = function( url ) {
	return YoutubeRenderer.RegExp.test( url ) ? "probably" : "";
};


/**
 * The YoutubeRenderer can only play Youtube's video so this method will always return an empty string
 * @static @function
 *
 * @returns {string} Always return an empty string
 */
YoutubeRenderer.canPlayType = function() {
	return "";
};


/**
 * A cache for the internal handlers
 * @see #onYouTubePlayerReady
 * @static
 * @type {object}
 */
YoutubeRenderer.handlers = { length: 0 };


/**
 * Will this renderer be supported on this browser?
 * @static
 * @type {boolean}
 */
YoutubeRenderer.isSupported = !!YoutubeRenderer.mode;

// If supported, append this renderer to the supported renderers stack
if (YoutubeRenderer.isSupported) {
	Renderer.supported.push( YoutubeRenderer );
}


// Extend the YoutubeRenderer prototype
Renderer.extend(YoutubeRenderer.prototype, {

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
				return this.cache.properties[property];
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
					this.dispatch( "loadeddata" );

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
				this.timer = window.setInterval( this.timeupdate, YoutubeRenderer.timeupdateDelay );
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
	}, // end of handleStateChange()


	/**
	 * TODO
	 */
	pause: function() {
		this.api.pauseVideo();
	}, // end of pause()

	/**
	 * TODO
	 */
	play: function() {
		this.api.playVideo();
	}, // end of play()


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
				this.api.seekTo( value );
			break;

			case "muted":
				this.api[value ? "mute" : "unMute"]();

				// Dispatch a "volumechange" event
				this.dispatch( "volumechange" );
			break;

			case "src":
				// Get the video ID
				var id = value.match( YoutubeRenderer.RegExp );

				// Store the source value in the cache
				this.cache.properties[property] = id ? value : "";

				// Set the source using the video ID (if found)
				if (id) {
					this.api.loadVideoById( id[1] );
				}
			break;

			case "volume":
				// Youtube's volume values are between 0 and 100
				this.api.setVolume( value * 100 );

				// Dispatch a "volumechange" event
				this.dispatch( "volumechange" );
			break;

			default:
				// By default, store the property's value in the cache
				this.cache.properties[property] = value;
		}
	} // end of set()

}); // end of Renderer.extend()


// Override the "replace" method on iframe mode
if (YoutubeRenderer.mode === "iframe") {
	/**
	 * Replace an element with the Youtube's iframe
	 * @function
	 *
	 * @param {string|Element} The element or element ID to replace
	 */
	YoutubeRenderer.prototype.replace = function( element ) {
		var
			// Store a reference to the current instance (used by some closures)
			instance = this,

			// Create a closure to recall this method (see below)
			self = function() {
				instance.replace( element );
			};

		// If the Youtube's script isn't ready, recall this method in 10ms
		if (!YoutubeRenderer.script) {
			// Recall only if the "script" property doesn't exists (prevent script error)
			return YoutubeRenderer.script === undefined ? window.setTimeout( self, 10 ) : undefined;
		}

		// Create a Youtube's iframe
		this.api = new YT.Player(element, {
			// @see https://developers.google.com/youtube/player_parameters#Parameters
			playerVars: {
				autoplay: 0,
				controls: 0,
				disablekb: 1,
				iv_load_policy: 3,
				showinfo: 0,
				rel: 0
			},
			events: {
				onReady: function() {
					instance.ready();
				},
				onStateChange: function( state ) {
					instance.handleStateChange( state.data );
				}
			}
		}); // end of new YT.Player
	}; // end of replace()
}


// Listen for the Youtube's flash API to be ready
window.onYouTubePlayerReady = function( id ) {
	var
		// Retrieve the instance
		instance = YoutubeRenderer.instances[id],

		// Create an identifier for the internal handler
		handler = "handler_" + (YoutubeRenderer.handlers.length + 1);

	// Abort if we couldn't find the instance
	if (!instance) { return; }

	/*!
	 * Since Youtube's addEventListener method call on window.something
	 * We have to retrieve the right YoutubeFlashRenderer instance.
	 * Using YoutubeFlashRenderer.instances["id"] doesn't work
	 * (the Youtube player cannot call on an array)
	 * We have to create a closure calling the right instance.
	 * This closure will be store in a fake array and will be called
	 * Using YoutubeFlashRenderer.handlers.handler_X (where X is unique).
	 */
	YoutubeRenderer.handlers.length++;
	YoutubeRenderer.handlers[handler] = function() {
		instance.handleStateChange.apply( instance, arguments );
	};

	// Register the event on the player
	instance.element.addEventListener( "onStateChange", "YoutubeRenderer.handlers." + handler );

	// Create a shorthand for the API
	instance.api = instance.element;

	// Call the regular's Renderer ready method
	instance.ready();
}; // end of onYouTubePlayerReady()

// Listen for the Youtube's iframe script to be ready
window.onYouTubeIframeAPIReady = function() {
	YoutubeRenderer.script = true;
};

// Expose
window.YoutubeRenderer = YoutubeRenderer;
