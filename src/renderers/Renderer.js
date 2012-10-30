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
	 * @param {object} config The renderer config
	 *
	 * @returns {object} The initialized instance
	 */
	Renderer.init = function( instance, config ) {
		var
			klass = instance.constructor, // Retrieve the child class constructor
			instances = Renderer.instances[klass.name]; // Retrieve the class' instances caches

		// Handle undefined config
		config = config || {};

		// Initialize the instances cache if it doesn't exists
		if (!instances) {
			instances = { length: 0 }; // Use a fake array
			klass.instances = instances; // Save a static reference to the cache in the class
			Renderer.instances[klass.name] = instances; // Save the instances cache to Renderer
		}

		// Makes sure we have an id
		config.id = config.id || klass.name + "-" + (instances.length + 1);

		// Store the new instance or retrieve from cache
		if (!instances[config.id]) {
			instances[config.id] = instance;
			instances.length++;
		} else {
			return instances[config.id];
		}

		// Store the id and config in the instance
		instance.id = config.id;
		instance.config = config;

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
			ext  = rExt[rExt.length - 1].substring( 1 ), // Get the last extension
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
	};


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
	};


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
	 * Utility function to merge two config objects
	 * @static @function
	 *
	 * @param {object} first The first object config
	 * @param {object} second The second object config
	 *
	 * @returns {object} Returns a new object (don't overwrite the first to keep params clear)
	 */
	Renderer.merge = function( first, second ) {
		var output = {}, key;

		// Handle undefined first
		first = first || {};

		// Simply copy the first (don't modify the reference)
		for (key in first) {
			output[key] = first[key];
		}

		// Merge with the second
		for (key in second) {
			// Merge recursively the objects
			if (typeof second[key] === "object") {
				output[key] = Renderer.merge( first[key], second[key] );
			}

			// The key doesn't exists: merge!
			if (!output[key]) {
				output[key] = second[key];
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
		 * Destroy an instance (remove from cache)
		 * @function
		 */
		destroy: function() {
			var cache = Renderer.instances[this.constructor.name];
			if (cache[this.id]) {
				delete cache[this.id];
				cache.length--;
			}
		}, // end of destroy()


		/**
		 * Dispatch an event on the element
		 * @function
		 *
		 * @param {object} source The source event
		 */
		/*exposeEvent: function(source) {

			// TODO

			// Correct the source (dumb Silverlight)
			if (typeof source === "string") {
				try {
					// Try to parse the JSON using native parsing or eval…
					source = window.JSON ? JSON.parse(source) : (new Function("return " + source))();
				} catch (e) {
					// If it failed the source is an event.type
					source = { type: source };
				}
			}

			// Firefox handle natively the click on plugins
			if (/firefox/i.test(navigator.userAgent) && source.type === "click") {
				return;
			}

			var
				key,
				event, // The event to be dispatched
				eventTmp, // A temporary event for IE for CustomEvents

				// The supported events type and event interfaces
				eventsTypes = {
					FocusEvent: "blur focus focusin focusout",
					MouseEvent: "click dblclick mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup",
					WheelEvent: "wheel",
					KeyboardEvent: "keydown keypress keyup"
				},

				eventInterface, // The Event Interface for the source type
				eventPattern = new RegExp(source.type), // A pattern to easily find the Event Interface

				// The event types which are not cancelable and don't bubbles
				dontBubbles   = /blur|focus|mouseenter|mouseleave/,
				notCancelable = /blur|focus|mouseenter|mouseleave|focusin|focusout/;


			// Correct the source's bubble and cancelable properties
			source.bubble     = !dontBubbles.test(source.type);
			source.cancelable = !notCancelable.test(source.type);

			// Loop through eventsTypes to find the right Event Interface to use
			for (key in eventsTypes) {
				// Found the right interface to use!
				if (eventPattern.test(eventsTypes[key])) {
					eventInterface = key;
					break;
				}
			}

			// Good browsers implement document.createEvent
			if (document.createEvent) {
				// Create a dummy event, creating using the real interface is a nightmare
				event = document.createEvent("Event");

				// Initialize the event
				event.initEvent(source.type, source.bubble, source.cancelable);

				// Dispatch!
				this.element.dispatchEvent(event);
			} else if (document.createEventObject) { // IE use createEventObject
				// Create an event
				event = document.createEventObject();

				// Recopy the source event (initializing)
				for (key in source) {
					event[key] = source[key];
				}

				// Is this a known event?
				if (eventInterface) {
					// IE know this event, so dispatch it
					this.element.fireEvent("on" + source.type, event);
				} else {
					// This is a custom event, we need to create a new event
					eventTmp = document.createEventObject();

					// Save the custom event inside
					eventTmp.originalEvent = event;

					// Dispatch using the right event name
					this.element.fireEvent(source.bubble ? "ondataavailable" : "onlosecapture", eventTmp);
				}
			} // else we're doomed
		},*/ // end of exposeEvent()


		/**
		 * Get a property's value
		 * @function
		 *
		 * @param {string} property The property name
		 *
		 * @returns The property's value or undefined if the property or element doesn't exists
		 */
		get: function( property ) {
			return this.element ? ((typeof this.element.get === "function") ? this.element.get( property ) : this.element[property]) : undefined;
		}, // end of getProperty()


		/**
		 * A method called by a plugin when ready
		 * @function
		 */
		ready: function() {
			// This renderer instance is ready
			this.isReady = true;

			// The plugin and element are ready, set the property we wanted to set
			for (var key in this.propertyCache) {
				this.set( key, this.propertyCache[key] );
			}

			// We don't need this cache anymore
			delete this.propertyCache;
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
				// Initialize the propertyCache if it doesn't exists
				if (!this.propertyCache) {
					this.propertyCache = {};
				}

				// If the element doesn't exists (not ready or not in the DOM), store properties and values in a cache
				this.propertyCache[property] = value;
			}
		}, // end of setProperty()


		// API shorthands
		play:  Renderer.createShorthand( "play" ),
		pause: Renderer.createShorthand( "pause" ),
		load:  Renderer.createShorthand( "load" )
	}; // end of Renderer.prototype

	// Expose
	scope.Renderer = Renderer;

}( window ));
