// Extend the framework with new methods
fab.extend({


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
	 * Register an handler for a given event
	 *
	 * @param {string} types Event type(s).
	 *   You may provide multiple event types by separating them with a space.
	 * @param {function} handler The function to call when the event type is fired
	 * @param {object} data=undefined The data to pass to the handler when calling it
	 *
	 * @return {fabuloos} Return the current instance of the player to allow chaining
	 *
	 * @example
	 * <code>
	 *   fabuloos(…)
	 *    .on( "play", function() { console.log("play event"); } )
	 *    .on( "pause", handlePause );
	 * </code>
	 * We can also register multiple events for the same handler:
	 * <code>
	 *   fabuloos(…).on( "play pause", handleTogglePlay );
	 * </code>
	 */
	on: function( types, handler, data ) {
		var type, i = 0;

		// Allow calling using an object litteral
		if (typeof types !== "string") {
			for (type in types) {
				this.on( type, types[type] );
			}

			return this; // Chaining
		}

		// Allow multiple events types separated by a space
		types = types.replace( fab.rTrim, "" ).split( fab.rSplit ); // Trim first to avoid bad splitting

		// Loop through each types
		while ((type = types[i++])) {
			// Register the handler for this type
			fab.event.add( this, type, handler, data );

			// Ask the renderer (if any) to bind this event type to the instance's handle manager
			if (this._renderer) {
				this._renderer.bind( type );
			}
		}

		return this; // Chaining
	}, // end of on()


	/**
	 * Unregister an handler for a given event
	 * @function
	 *
	 * @param {string} types Event type(s), may be null (will remove all handlers)
	 * @param {function} handler The handler previously attached, may be null (will remove all handlers for the type)
	 *
	 * @returns {fabuloos} Return the current instance of the player to allow chaining
	 *
	 * @example
	 * <code>
	 *   fabuloos(…)
	 *    .off() // Will remove all listeners
	 *    .off( "", handle ) // Will remove "handle" for each types
	 *    .off( "pause" ) // Will remove all listeners for the "pause" event type
	 *    .off( "pause", handle ) // Will remove "handle" for the "pause" event type
	 *    .off( "play pause" ) // Will remove all listeners for the "play" and "pause" event types
	 *    .off( "play pause", handle ); // Will remove "handle" for the "play" and "pause" event types
	 * </code>
	 */
	off: function( types, handler ) {
		var
			cache = fab.event.cache[ this[ fab.expando ] ],
			type, i = 0; // Loop specific

		// No types provided, remove all types
		if (!types) {
			types = "";

			// If there is a cache, get all the types
			if (cache) {
				for (type in cache.handlers) {
					types += type + " ";
				}
			}
		}

		// Allow multiple events types separated by a space
		types = types.replace( fab.rTrim, "" ).split( fab.rSplit ); // Trim first to avoid bad splitting

		// Prefer fab.event.remove on each type instead of automatic mode
		while (cache && (type = types[i++])) {
			// Unregister the handler for this type
			fab.event.remove( this, type, handler );

			// Retrieve the cache to see if we have to stop listening for this type
			cache = fab.event.cache[ this[ fab.expando ] ];

			// Ask the renderer to unbind if the cache doesn't exists anymore or if there is a cache but not for this type
			if (this._renderer && (!cache || (cache && !cache.handlers[type]))) {
				this._renderer.unbind( type );
			}
		} // end of while

		return this; // Chaining
	}, // end of off()

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


// Extending the API with getters, setters and togglers
(function() {

	var
		obj = {}, // An empty object which will contain the getters/setters/togglers method, will be merge with the current prototype
		i = 0, // Loop specific
		properties = getterProperties.split( " " ), // The getters properties (basically, all properties)
		count = properties.length, // Count the properties to loop into
		property, Property; // Loop specific (neater)

	// Create a magic function to create a getter/setter
	function create( property ) {
		return function() {
			return this[(arguments.length ? "set" : "get")]( property, arguments[0] );
		};
	}

	// Create a magic function to create toggler
	function createToggler( property ) {
		return function() {
			return this.toggle( property );
		};
	}

	// Loop through each properties
	for (; i < count; i++) {
		property = properties[i]; // The property
		Property = property.charAt( 0 ).toUpperCase() + property.slice( 1 ); // Camelcase the property name to append to "toggle"

		// Generate the getter/setter method, ignore existing properties
		if (!fab.prototype[property]) {
			obj[property] = create( property );
		}

		// Does this property has a toggler too?
		// Check if there is already a toggle with this name (handle manually written togglers)
		if (new RegExp( property).test( togglerProperties ) && !fab.prototype["toggle" + Property]) {
			// Let's make the method (after, we'll go to the mall)
			obj["toggle" + Property] = createToggler( property );
		}
	}

	// Extend the prototype with the shorthands generated
	fab.extend( obj );

}()); // end of scope used to create getters/setters/togglers
