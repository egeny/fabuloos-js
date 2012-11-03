// API module
(function( player ) {

	// Use JavaScript script mode
	"use strict";

	/*jshint newcap: false */
	/*global HTMLMediaRenderer */

	var
		/**
		 * The properties we can get
		 * @type {string}
		 */
		getterProperties = "error networkState readyState width height videoWidth videoHeight src currentSrc preload buffered startOffsetTime initialTime currentTime duration defaultPlaybackRate playbackRate seeking seekable paused played ended poster autoplay controls loop volume muted",

		/**
		 * The properties we can set
		 * @type {string}
		 */
		setterProperties = "width height src preload currentTime defaultPlaybackRate playbackRate poster autoplay controls loop volume muted",

		/**
		 * The properties we can toggle
		 * @type {string}
		 */
		togglerProperties = "autoplay controls loop muted";


	// Extend the player with new methods
	player.extend({

		/**
		 * Attach all listeners to the renderer
		 * @function
		 *
		 * @returns {fabuloos} Return the current instance of the player to allow chaining
		 */
		attach: function() {
			var
				type, // Loop specific
				cache = player.event.cache[this[ player.expando ]] || []; // Retrieve the events' handlers cache for this instance

			// Loop through each handlers types
			for (type in cache.handlers) {
				// Ask the renderer to bind this type to the internal handler manager
				this._renderer.bind( type, this.handleManager );
			}

			return this; // Chaining
		}, // end of attach()


		/**
		 * Get or set the configuration
		 * @function
		 *
		 * @param {object} [config=undefined] The configuration to apply. If none will behave as a getter.
		 *
		 * @returns {fabuloos} Return the current instance of the player to allow chaining
		 */
		config: function( config ) {
			// No argument, acting like a getter
			if (!config) {
				return this._config;
			}

			var
				// Loop specific
				property,

				// The "src" property has to be delayed
				delayed = false;

			// Loop through the received config
			for (property in config) {
				if (property === "src") {
					delayed = true;
					continue;
				}

				this.set( property, config[property] );
			} // end of for

			// After setting the config, we ask for a new source (and/or a new renderer)
			if (delayed) {
				this.set( "src", config.src );
			}

			return this; // Chaining
		}, // end of config()


		/**
		 * Detach all listeners from the renderer
		 * @function
		 *
		 * @returns {fabuloos} Return the current instance of the player to allow chaining
		 */
		detach: function() {
			var
				type, // Loop specific
				cache = player.event.cache[this[ player.expando ]] || []; // Retrieve the events' handlers cache for this instance

			// Loop through each handlers types
			for (type in cache.handlers) {
				// Ask the renderer to unbind this type to the internal handler manager
				this._renderer.unbind( type, this.handleManager );
			}

			return this; // Chaining
		}, // end of detach()


		/**
		 * Get a player's property. Warning: breaks the chaining.
		 * @function
		 *
		 * @param {string} property The property's value to return
		 *
		 * @returns Return the property's value
		 *
		 * @example
		 *  <code>
		 *    var player = fabuloos( "media" );
		 *    player.get( "paused" ); // true or false
		 *  </code>
		 */
		get: function( property ) {
			return (new RegExp( property ).test( getterProperties ) && this._renderer) ? this._renderer.get( property ) : this._config[property];
		}, // end of get()


		/**
		 * Load the source.
		 * @function
		 *
		 * @returns {fabuloos} Return the current instance of the player to allow chaining
		 *
		 * @example
		 *  <code>
		 *    var player = fabuloos( "media" );
		 *    player
		 *      .set( "src", "http://localhost/file.mp4" )
		 *      .set( "autoplay", true )
		 *      .load();
		 *  </code>
		 */
		load: function() {
			if (this._renderer) {
				this._renderer.load();
			}

			return this; // Chaining
		}, // end of load()


		/**
		 * Register an handler for a given event
		 * @function
		 *
		 * @param {string} type Event type(s)
		 * @param {function} handler The function to call when the event type is fired
		 * @param {object} data The data to pass to the handler when calling it
		 *
		 * @returns {fabuloos} Return the current instance of the player to allow chaining
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
			var type, i = 0; // Loop specific

			// Register the handler for this type
			player.event.add( this, types, handler, data );

			// Allow multiple events types separated by a space
			types = types.replace( player.rTrim, "" ).split( player.rSplit ); // Trim first to avoid bad splitting

			// Ask the renderer (if any) to bind this event type to the instance's handle manager
			while (this._renderer && (type = types[i++])) {
				this._renderer.bind( type, this.handleManager );
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
			var type, i = 0; // Loop specific

			// Unregister the handler for this type
			player.event.remove( this, types, handler );

			// Allow multiple events types separated by a space
			types = types.replace( player.rTrim, "" ).split( player.rSplit ); // Trim first to avoid bad splitting

			// Ask the renderer (if any) to unbind this event type to the instance's handle manager
			while (this._renderer && (type = types[i++])) {
				this._renderer.unbind( type, this.handleManager );
			}

			return this; // Chaining
		}, // end of off()


		/**
		 * Pause the playback.
		 * @function
		 *
		 * @returns {fabuloos} Return the current instance of the player to allow chaining
		 *
		 * @example
		 *  <code>
		 *    var player = fabuloos( "media" );
		 *    player.pause(); // Pause the playback
		 *  </code>
		 */
		pause: function() {
			if (this._renderer) {
				this._renderer.pause();
			}

			return this; // Chaining
		}, // end of pause()


		/**
		 * Launch the playback on the player.
		 * A source or object can be directly given as parameter.
		 * @function
		 *
		 * @param {string|object} [source=undefined] The source to play. The MIME type will be guessed if not provided.
		 *
		 * @param {string} [source=undefined] The source to play
		 *
		 * @param {string} source.src The source to play
		 * @param {string} [source.type=undefined] The source's MIME type
		 *
		 * @returns {fabuloos} Return the current instance of the player to allow chaining

		 * @example
		 *  <code>
		 *    var player = fabuloos( "video" );
		 *    player.play(); // Launch the playback
		 *    player.play( "http://example.org/file.mp4" ); // Launch a specific source

		 *    // Launch a specific source by providing MIME type
		 *    player.play({
		 *      src:  "http://example.org/file.mp4",
		 *      type: "video/mp4"
		 *    });
		 *  </code>
		 */
		play: function( source ) {
			if (source) {
				this.src( source );
			}

			if (this._renderer) {
				this._renderer.play();
			}

			return this; // Chaining
		}, // end of play()


		/**
		 * Change or get the renderer.
		 * @function
		 *
		 * @param {Renderer} [renderer=undefined] The new renderer to create
		 *
		 * @returns {fabuloos} Return the current instance of the player to allow chaining
		 */
		renderer: function( renderer ) {
			// No renderer received, acting like a getter
			if (!renderer) {
				return this._renderer;
			}

			// Check if we correctly received a renderer
			if (!renderer.canPlay) {
				// TODO: Is it wise to throw an Exception?
				throw (renderer.name || renderer) + " is not a valid renderer.";
			}

			// Check if the renderer is supported before creating it
			if (!renderer.isSupported) {
				// TODO: Trigger a better event
				return this.trigger( "error" );
			}

			var
				// Prepare the default config for the renderers
				config = {
					id:     this.id,
					width:  this._config.width  || 0,
					height: this._config.height || 0
				};

			// Detach all listeners
			this.detach();

			// Destroy the current renderer (clean the renderers instances cache)
			if (this._renderer) {
				this._renderer.destroy();
			}

			// Create the new renderer. HTMLMediaRenderer need the element to determine which tag to create
			// TODO: The new HTMLMediaRenderer should reflect the source MIME type
			this._renderer = renderer === HTMLMediaRenderer ? new renderer( this.element, config ) : new renderer( config );

			// Replace the old renderer markup
			this._renderer.replace( this.element );

			// Apply the current config
			for (var property in this._config) {
				this.set( property, this._config[property] );
			}

			// Keep a reference of the element (just in case)
			this.element = this._renderer.element;

			// Attach all listeners
			this.attach();

			return this; // Chaining
		}, // end of renderer()


		/**
		 * Set a player's property.
		 * @function
		 *
		 * @param {string} property The property to set
		 * @param {*} value The new property's value
		 *
		 * @returns {fabuloos} Return the current instance of the player to allow chaining
		 *
		 * @example
		 * <code>
		 *   var player = fabuloos( "video" );
		 *   player.set( "autoplay", true );
		 * </code>
		 */
		set: function( property, value ) {
			var
				// Loop specific
				i = 0, count,

				// A stack of supported renderers (when defining renderers)
				renderers = [];

			// Some properties have to be handled specifically
			switch (property) {
				case "renderers":
					// Makes sure we receive an array
					value = (value.push) ? value : [value];

					// Loop through each renderers to test them
					for (i = 0, count = value.length; i < count; i++) {
						if (value[i].isSupported) {
							// This renderer is supported, add it to the stack
							renderers.push( value[i] );
						}
					}

					// Override the value with the supported renderers
					value = renderers;
				break;

				case "src":
					// Prefer the most specific function for "src" property
					this.src( value );
				break;
			}

			// If the API allow to set this property ask the renderer (if any) to set it
			if (new RegExp( property ).test( setterProperties ) && this._renderer) {
				// Ask the renderer to change the property's value
				this._renderer.set( property, value );

				// Retrieve the value corrected by the renderer
				value = this._renderer.get( property );
			}

			// Store a copy of this value
			this._config[property] = value;

			return this; // Chaining
		}, // end of set()


		/**
		 * Get the source or set a new source (may change the renderer).
		 * @function
		 *
		 * @param {string|object} [value=undefined] The new source's value. Can be string or object (see example).
		 *
		 * @returns {string|fabuloos} Return the source if no param or the current instance of the player to allow chaining
		 *
		 * @example
		 * <code>
		 *   var player = fabuloos( "video" );
		 *   player.src(); // Get the current source
		 *
		 *   player.src( "http://example.org/video.mp4" ); // Set the source
		 *
		 *   // Set the source using object
		 *   player.src({
		 *     src: "http://example.org/video.mp4"
		 *   });
		 *
		 *   // Set the source using object and helping by providing the correct MIME type
		 *   player.src({
		 *     src: "http://example.org/video.mp4",
		 *     type: "video/mp4"
		 *   });
		 * </code>
		 */
		src: function( value ) {
			// Check if we have a new source
			if (!value || (typeof value !== "string" && !value.src)) {
				// Don't seems, it's a getter
				return this.get( "src" );
			}

			var
				// A neat version of value
				source = {
					src:  (typeof value === "string") ? value : value.src,
					type: value.type
				},

				// Loop specific
				i = 0, count = this._config.renderers.length, renderer,

				// Used to store the canPlayUsing result and guess if we changed the renderer
				canPlay,

				// A small utility function
				canPlayUsing = function( renderer ) {
					return renderer[source.type ? "canPlayType" : "canPlay"](source.type || source.src);
				};

			// Try using the current renderer if any and can play
			if (this._renderer && canPlayUsing( this._renderer.constructor )) {
				this._renderer.set( "src", source.src ); // Simply change the source
				return this; // Chaining
			}

			// Loop through each renderers
			for (; i < count; i++) {
				// Admit it, it's much easier to read like that
				renderer = this._config.renderers[i];

				// Skip the current renderer since it failed sooner
				if (this._renderer && this._renderer.constructor === renderer) {
					continue;
				}

				// Save the result to check if we didn't find a new renderer (and trigger error event)
				canPlay = canPlayUsing( renderer );

				// Test if the renderer can play the source
				if (canPlay) {
					// This renderer seems good, change for it
					this.renderer( renderer );

					// Don't try other renderer
					break;
				}
			} // end of for

			// No renderer found capable of playing this source
			if (!canPlay) {
				// TODO: Trigger another kind of event
				this.trigger( "error" );
			}

			return this; // Chaining
		}, // end of src()


		/**
		 * Toggle a player's property's value
		 * @function
		 *
		 * @param {string} property The property to toggle
		 *
		 * @returns {fabuloos} Return the current instance of the player to allow chaining
		 *
		 * @example
		 *  <code>
		 *    var player = fabuloos( "video" );
		 *    player.toggle( "autoplay" );
		 *  </code>
		 */
		toggle: function( property ) {
			if (new RegExp( property ).test( togglerProperties ) && this._renderer) {
				// Set the property by toggleing its value
				this._renderer.set( property, !this._renderer.get( property ) );
			}

			return this; // Chaining
		}, // end of toggle()


		/**
		 * Trigger the listeners for a type. Warning: breaks the chaining.
		 * @function
		 *
		 * @param {string} type Event type
		 *
		 * @returns Return the last listener result or false
		 */
		trigger: function( type ) {
			return player.event.trigger( this, type );
		} // end of trigger()

	}); // end of player.extend()


	// Extending the player with getters, setters and togglers
	(function() {

		var
			obj = {}, // An empty object which will contain the getters/setters/togglers method, will be merge with the player's prototype
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
		function createToggler(property) {
			return function() {
				return this.toggle( property );
			};
		}

		// Loop through each properties
		for (; i < count; i++) {
			property = properties[i]; // The property
			Property = property.charAt( 0 ).toUpperCase() + property.slice( 1 ); // Camelcase the property name to append to "toggle"

			// Generate the getter/setter method, ignore existing properties
			if (!player.prototype[property]) {
				obj[property] = create( property );
			}

			// Does this property has a toggler too?
			// Check if there is already a toggle with this name (handle manually written togglers)
			if (new RegExp( property).test( togglerProperties ) && !player.prototype["toggle" + Property]) {
				// Let's make the method (after, we'll go to the mall)
				obj["toggle" + Property] = createToggler( property );
			}
		}

		// Extend the prototype with the shorthands generated
		player.extend( obj );

	}()); // end of scope used to create getters/setters/togglers

}( fabuloos )); // end of API module
