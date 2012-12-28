/**
 * @author <a href="mailto:nico@egeny.net">Nicolas Le Gall</a>
 * @version @VERSION
 */

(function( scope ) {

	// Use JavaScript script mode
	"use strict";

	/*global ActiveXObject */

	/**
	 * The base Renderer class
	 * @abstract @constructor
	 *
	 * @returns {Renderer} A new Renderer instance
	 */
	function Renderer() {}


	/**
	 * An instance cache, used to retrieve an instance from a plugin
	 * @static
	 * @type {object}
	 */
	Renderer.instances = {};


	/**
	 * An hash of MIME types associated to extensions
	 * @static
	 * @type {object}
	 */
	Renderer.mimes = {
		application: {
			m3u8: "vnd.apple.mpegurl",
			f4m: "f4m+xml",
			"smil, csmil": ["smil+xml", "smil"]
		},
		video: {
			"3gp": "3gpp",
			"3g2": "3gpp2",
			flv: "x-flv",
			m4v: ["x-m4v", "m4v"],
			ogv: "ogg",
			"mp4, f4v, f4p": "mp4",
			"mov, qt": "quicktime",
			webm: "webm",
			wmv: "x-ms-wmv"
		},
		audio: {
			f4a: "mp4",
			mp3: "mpeg",
			m4a: "x-m4a",
			"ogg, oga": "ogg",
			wav: ["wav", "wave", "x-wav"],
			weba: "webm",
			wma: "x-ms-wma"
		}
	};


	/**
	 * Renderer initialization
	 * @static @function
	 *
	 * @param {object} instance The instance to extend
	 */
	Renderer.init = function( instance ) {
		var
			klass     = instance.constructor, // Retrieve the child class constructor
			instances = Renderer.instances[klass.name]; // Retrieve the class' instances cache

		// Initialize the instances cache if it doesn't exists
		if (!instances) {
			// Save a fake array as static reference in the class and instance cache
			Renderer.instances[klass.name] = klass.instances = instances = { length: 0 };
		}

		// Handle undefined config
		instance.config = instance.config || {};

		// Makes sure we have an id
		instance.config.id = instance.config.id || klass.name + "-" + (instances.length + 1);

		// Store the new instance or retrieve from cache
		if (!instances[instance.config.id]) {
			instances[instance.config.id] = instance;
			instances.length++;
		} else {
			return instances[instance.config.id];
		}

		// Initialize the event handler
		instance.handler = null;

		// Initialize a cache for event and property (very useful when plugin aren't ready)
		instance.cache = {
			events:     {},
			properties: {}
		};

		return instance;
	}; // end of Renderer.init()


	/**
	 * Check if a given URL is readable by this renderer
	 * @static @function
	 *
	 * @param {string} url The url to check
	 *
	 * @returns {string} Returns "maybe" or "probably" is the MIME type is supported, "" otherwise
	 */
	Renderer.canPlay = function( url ) {
		var
			rExt = url.match( /\.([\w\d]+)(?=\/|\?|#|$)/g ), // Find the extension (.mp3, .avi)
			ext  = rExt ? rExt[rExt.length - 1].substring( 1 ) : "", // Get the last extension
			mime = Renderer.guessType( ext ), // Try to guess the MIME type
			i = 0, count, canPlayType, result;

		// No MIME type found, extension unknown, can't read
		if (!mime) {
			return "";
		} else if (typeof mime === "string") {
			// One MIME type found, check if can play
			return this.canPlayType( mime );
		} else {
			// Multiple MIME types associated to the extension, loop through
			for (count = mime.length; i < count; i++) {
				// Test the MIME type
				result = this.canPlayType( mime[i] );

				// Ouh, nice result, exit
				if (result === "probably") {
					return result;
				}

				// Meh. Continue in case we found a probably
				canPlayType = canPlayType || result;
			}

			// Return the result
			return canPlayType;
		}
	}; // end of Renderer.canPlay()


	/**
	 * Check if a given MIME type is readable by this renderer
	 * @static @function
	 *
	 * @param {string} type The MIME type to check
	 *
	 * @returns {string} Returns "maybe" or "probably" is the MIME type is supported, "" otherwise
	 */
	Renderer.canPlayType = function( type ) {
		return this.types[type] || "";
	}; // end of Renderer.canPlayType()


	/**
	 * Utility function to create a closure to call a method on the element
	 * @static @function
	 *
	 * @param {string} method The method name to call
	 *
	 * @returns A closure
	 */
	Renderer.createShorthand = function( method ) {
		return function() {
			return (this.element && typeof this.element[method] === "function") ? this.element[method].apply( this.element, arguments ) : undefined;
		};
	}; // end of Renderer.createShorthand()


	/**
	 * Utility function to extend an object with another object.
	 * Overwrite existing properties.
	 * @static @function
	 *
	 * @param {object} target The object to be extended
	 * @param {object} source The source object
	 */
	Renderer.extend = function( target, source ) {
		for (var prop in source) {
			target[prop] = source[prop];
		}
	}; // end of Renderer.extend()


	/**
	 * Utility function to format an object to a string
	 * @static @function
	 *
	 * @param {string} mode The mode to format to
	 * @param {object} obj The object to format to the given mode
	 *
	 * @returns {string} The formated object as string
	 *
	 * @example
	 *   <code>Renderer.formatTo("attribute", { id: "foo", width: 300 }) // id="foo" width="300"</code>
	 *   <code>Renderer.formatTo("param", { id: "foo" }); // &lt;param name="id" value="foo" /&gt;</code>
	 */
	Renderer.formatTo = function( mode, obj ) {
		var
			config = {
				attribute:  ['%attribute%="%value%"', " "],
				param:      ['<param name="%param%" value="%value%" />', "\n"],
				flashvars:  ['%flashvars%=%value%', "&"],
				initparams: ['%initparams%=%value%', ","]
			},
			template = config[mode][0],
			glue     = config[mode][1],
			output   = [],
			key, value;

		for (key in obj) {
			// Ignore "params" key
			if (key === "params") {
				continue;
			}

			// Get the value or format it if it's an object
			value = (typeof obj[key] === "object") ? Renderer.formatTo( key, obj[key] ) : obj[key];

			// Handle exceptions for boolean values on attributes
			if (mode === "attribute" && typeof value === "boolean") {
				if (value === true) {
					output.push( key ); // Keep autoplay/controls/etc. without value
				}
				continue;
			}

			// Format using the template
			output.push( template.replace( "%" + mode + "%", key ).replace( "%value%", value ) );
		}

		return output.join( glue );
	}; // end of Renderer.formatTo()


	/**
	 * Try to guess the MIME type with a file extension
	 * @static @function
	 *
	 * @param {string} ext The extension to use to guess MIME type
	 *
	 * @returns {array|string|false} Returns a string or an array of MIME type. False if the extension is unknown
	 */
	Renderer.guessType = function() {
		var
			rExt = new RegExp( arguments[0], "i" ), // A RegExp based on the extension
			rReplace = /([^,]+)/g, // A RegExp used to append type on multiple MIME
			type, ext;

		for (type in Renderer.mimes) {
			for (ext in Renderer.mimes[type]) {

				// Check if this key is the extension we're looking for
				if (rExt.test( ext )) {
					// Check if the MIME is an array
					if (Renderer.mimes[type][ext].join) {
						// Before returning, append the type in front of MIMEs
						return Renderer.mimes[type][ext].join().replace( rReplace, type + "/$1" ).split( "," );
					} else {
						return type + "/" + Renderer.mimes[type][ext];
					}
				}

			} // end of for (ext in Renderer.mimes[type])
		} // end of for (type in Renderer.mimes)

		// Return false if extension is unknown
		return false;
	}; // end of Renderer.guessType()


	/**
	 * Utility function to check if a plugin is supported
	 * @static @function
	 *
	 * @param {object} pluginInfo The plugin info (minVersion, plugin name and activeX name)
	 *
	 * @returns {boolean} Is this plugin supported?
	 */
	Renderer.isPluginSupported = function( pluginInfo, versionSwitcher ) {
		var
			version, // The plugin version
			minVersion = pluginInfo[versionSwitcher] || pluginInfo.minVersion, // The min plugin version
			rVersion = /\d+/g, // A regexp to retrieve version
			ax, // ActiveX
			diff, // The difference between two version, used to check versions
			i, count; // Loop specific

		// Check if the plugin exists on good browsers
		if (navigator.plugins && navigator.plugins[pluginInfo.plugin]) {
			// It seems. Get the description (include the version)
			version = navigator.plugins[pluginInfo.plugin].description;
		} else if (window.ActiveXObject) {
			// Bad browsers use ActiveX, use a try/catch to avoid error when plugin doesn't exists
			try {
				ax = new ActiveXObject( pluginInfo.activex );

				// Check if this ActiveX has a IsVersionSupported
				try {
					// IsVersionSupported seems to be an ActiveX function
					if (typeof ax.IsVersionSupported( minVersion ) === "boolean") {
						return ax.IsVersionSupported( minVersion );
					}
				} catch (e2) {}

				// Otherwise try to retrieve the version
				version = ax.getVariable( "$version" );
			} catch (e1) {}
		}

		// A version was found
		if (version) {
			// Split the versions
			version    = version.match( rVersion );
			minVersion = minVersion.match( rVersion );

			// Loop through the minVersion to check with the current installed
			for (i = 0, count = minVersion.length; i < count; i++) {
				// Calculate the difference between installed and target version
				diff = (parseInt(version[i], 10) || 0) - (parseInt(minVersion[i], 10) || 0);

				// The installed match the target version, continue to next version number
				if (diff === 0) {
					continue;
				}

				// The installed doesn't match, so it can be greater or lower, just return this result
				return (diff > 0);
			}

			return true; // The minVersion === version
		}

		return false; // No version found or plugin uninstalled
	}; // end of Renderer.isPluginSupported()


	/**
	 * Utility function to merge objects
	 * @static @function
	 *
	 * @param {object} ... The objects to merge
	 *
	 * @returns {object} Returns a new object (don't overwrite the properties if exists)
	 */
	Renderer.merge = function() {
		var
			output = {}, // Prepare the output
			i = 0, count = arguments.length, key; // Loop specific

		// Loop through each arguments
		for (; i < count; i++) {
			// Loop through each arguments' properties
			for (key in arguments[i]) {
				// Add the value if the key doesn't exists
				if (!output.hasOwnProperty( key )) {
					output[key] = arguments[i][key];
				} else if (typeof output[key] === "object") {
					// If the key exists, check if we have to call recursively
					output[key] = Renderer.merge( output[key], arguments[i][key] );
				}
			}
		}

		return output;
	}; // end of Renderer.merge()


	Renderer.prototype = {
		/**
		 * A flag to check if this renderer is ready (wait for plugin initialization)
		 * @type {boolean}
		 */
		isReady: false,


		/**
		 * Ask the element to listen for an event type. When the event will be triggered it will call this.handler.
		 * @function
		 *
		 * @param {string} type The event type to listen
		 */
		bind: function( type) {
			// Ask the element to listen only when it wasn't already listening
			if (!this.cache.events[type] && this.element && this.element.bind) {
				this.element.bind( type );
			}

			// Remember we're listening for this type
			this.cache.events[type] = true;
		}, // end of bind()


		/**
		 * Destroy an instance (remove from cache)
		 * @function
		 */
		destroy: function() {
			var cache = Renderer.instances[this.constructor.name];
			if (cache[this.config.id]) {
				delete cache[this.config.id];
				cache.length--;
			}
		}, // end of destroy()


		/**
		 * Dispatch an event type
		 * @function
		 *
		 * @param {string|object} event The event (object) or event type (string) to dispatch
		 */
		dispatch: function( event ) {
			// Correcting the event object in case we receive a string
			event = typeof event === "string" ? { type: event } : event;

			// If we have an handler we can call it!
			if (this.handler) {
				this.handler.call( this, event );
			}
		}, // end of dispatch()


		/**
		 * Get a property's value
		 * @function
		 *
		 * @param {string} property The property name
		 *
		 * @returns The property's value or undefined if the property or element doesn't exists
		 */
		get: function( property ) {
			// Width and height must be found in a specific way
			if (property === "width" || property === "height") {
				// Don't bother if we haven't any element to measure
				if (!this.element) { return 0; }

				var value = window.getComputedStyle ?
					// Pass a second argument (null) to getComputedStyle for compatibility reasons
					// @see https://developer.mozilla.org/en-US/docs/DOM/window.getComputedStyle
					window.getComputedStyle( this.element, null ).getPropertyValue( property ) :
					// Use the scrollWidth/scrollHeight property since it is calculated in a different way in IE
					this.element["scroll" + property.charAt( 0 ).toUpperCase() + property.slice( 1 )];

				// parseFloat to avoid units (px, em, etc.)
				return parseFloat( value );
			}

			return this.element ? ((typeof this.element.get === "function") ? this.element.get( property ) : this.element[property]) : undefined;
		}, // end of get()


		/**
		 * A method called by a plugin when ready
		 * @function
		 */
		ready: function() {
			// This renderer instance is ready
			this.isReady = true;

			var
				cache = this.cache, // Retrieve the events and properties cache
				type, key; // Loop specific

			// Ask the plugin to listen for this types
			for (type in cache.events) {
				this.bind( type, cache.events[type] );
			}

			// The plugin and element are ready, set the property we wanted to set
			for (key in cache.properties) {
				this.set( key, cache.properties[key] );
			}

			// We don't need this cache anymore
			delete this.cache.properties;
		}, // end of ready()


		/**
		 * Set a property's value.
		 * @function
		 *
		 * @param {string} property The property name
		 * @param {*} value The new property's value
		 */
		set: function( property, value ) {
			// Check if the renderer is ready
			if (this.isReady) {
				// Use the set method of the element (plugins) if exists
				if (typeof this.element.set === "function") {
					this.element.set( property, value );
				} else {
					this.element[property] = value;
				}
			} else {
				// If the element doesn't exists (not ready or not in the DOM), store properties and values in a cache
				this.cache.properties[property] = value;
			}
		}, // end of set()


		/**
		 * Stop listening for an event type.
		 * @function
		 *
		 * @param {string} type The event type to clear
		 */
		unbind: function( type ) {
			// An handler was already set and we have an element
			if (this.cache.events[type] && this.element && this.element.unbind) {
				// Tell to the plugin to stop listening for this type
				this.element.unbind( type );
			}

			// Clean the cache for this event type
			delete this.cache.events[type];
		}, // end of unbind()


		// API shorthands
		play:  Renderer.createShorthand( "play" ),
		pause: Renderer.createShorthand( "pause" ),
		load:  Renderer.createShorthand( "load" )
	}; // end of Renderer.prototype

	// Expose
	scope.Renderer = Renderer;

}( window ));
