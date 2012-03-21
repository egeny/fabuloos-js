// API module
(function( player ) {

	// Use JavaScript script mode
	"use strict";

	/*jshint curly: true, noempty: true, strict: true, boss: true, evil: false, smarttabs: true, sub: false */
	/*global browser, rhino */
	/*global HTMLMediaRenderer, FlashMediaRenderer, SilverlightMediaRenderer */

	var
		/**
			The properties we can get
			@type {string}
		*/
		getterProperties = "error networkState readyState width height videoWidth videoHeight src currentSrc preload buffered startOffsetTime initialTime currentTime duration defaultPlaybackRate playbackRate seeking seekable paused played ended poster autoplay controls loop volume muted",

		/**
			The properties we can set
			@type {string}
		*/
		setterProperties = "width height src preload currentTime defaultPlaybackRate playbackRate poster autoplay controls loop volume muted",

		/**
			The properties we can toggle
			@type {string}
		*/
		togglerProperties = "autoplay controls loop muted";


	player.extend(
		/**
			@lends fabuloos.prototype
		*/
		{

			/**
				Get or set the configuration
				@function

				@param {object} [config=undefined] The configuration to apply. If none will behave as a getter.

				@returns {fabuloos} Return the current instance of the player to allow chaining
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
				Get a player's property. Warning: breaks the chaining.
				@function

				@param {string} property The property's value to return

				@returns Return the property's value

				@example
					<code>
						var player = fabuloos("video");
						player.get("paused"); // true or false
					</code>
			*/
			get: function( property ) {
				return (new RegExp( property ).test( getterProperties ) && this.renderer) ? this.renderer.get( property ) : this._config[property];
			}, // end of get()


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
				if (new RegExp( property ).test( setterProperties ) && this.renderer) {
					// Ask the renderer to change the property's value
					this.renderer.set( property, value );

					// Retrieve the value corrected by the renderer
					value = this.renderer.get( property );
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
						var player = ftvPlayer("video");
						player.src(); // Get the current source

						player.src("http://example.org/video.mp4"); // Set the source

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
					return this.get("src");
				}

				
			} // end of src()

		}
	); // end of player.extend()

}(fabuloos)); // end of API module