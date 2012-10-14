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


	player.extend({

		/**
		 * Attach all listeners to the player
		 * @function
		 *
		 * @returns {fabuloos} Return the current instance of the player to allow chaining
		 */
		attach: function() {
			// Use the static attach function
			player.event.attach( this );

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
		 * Detach all listeners from the player
		 * @function
		 *
		 * @returns {fabuloos} Return the current instance of the player to allow chaining
		 */
		detach: function() {
			// Use the static detach function
			player.event.detach( this );

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
				Change or get the renderer.
				@function

				@param {Renderer} [renderer=undefined] The new renderer to create

				@returns {fabuloos} Return the current instance of the player to allow chaining
			*/
			renderer: function( renderer ) {
				// No renderer received, acting like a getter
				if (!renderer) {
					return this._renderer;
				}

				// Check if we correctly received a renderer
				if (!renderer.canPlay) {
					throw (renderer.name || renderer) + " is not a valid renderer.";
				}

				// Check if the renderer is supported before creating it
				if (!renderer.isSupported) {
					// TODO
					return this.dispatch( "error" );
				}

				var
					// Prepare the default config for the renderers
					config = {
						id: this.id,
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
				this._renderer = renderer === HTMLMediaRenderer ? new renderer(this.element, config) : new renderer(config);

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
				Set a player's property.
				@function

				@param {string} property The property to set
				@param value The new property's value

				@returns {fabuloos} Return the current instance of the player to allow chaining

				@example
					<code>
						var player = fabuloos("video");
						player.set("autoplay", true);
					</code>
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
				Get the source or set a new source (may change the renderer).
				@function

				@param {string|object} [value=undefined] The new source's value. Can be string or object (see example).

				@returns {string|fabuloos} Return the source if no param or the current instance of the player to allow chaining

				@example
					<code>
						var player = fabuloos( "video" );
						player.src(); // Get the current source

						player.src( "http://example.org/video.mp4" ); // Set the source

						// Set the source using object
						player.src({
							src: "http://example.org/video.mp4"
						});

						// Set the source using object and helping by providing the correct MIME type
						player.src({
							src: "http://example.org/video.mp4",
							type: "video/mp4"
						});
					</code>
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

					// Save the result to check if we didn't find a new renderer (and dispatch error event)
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
					// TODO
					this.dispatch( "error" );
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

}( fabuloos )); // end of API module
