/* global ActiveXObject */

/**
 * The base Renderer class
 * @abstract @constructor
 */
function Renderer() {}


/**
 * An hash of MIME types associated to extensions
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


var
	/*!
	 * A RegExp used to append type on multiple MIME types
	 * @type {RegExp}
	 */
	rAppendType = /([^,]+)/g,

	/*!
	 * A RegExp used to extract the file extension from an URL
	 * @type {RegExp}
	 */
	rExt = /\.([\w\d])+(?=\/|\?|#|$)/g,

	/*!
	 * A RegExp to retrieve a function's name
	 * @type {RegExp}
	 */
	rFunction = /function (\w+)/,

	/**
	 * A collection of RegExp used to split and trim
	 * @type {RegExp}
	 */
	rSplit = /\s+/,
	rTrim  = /^\s+|\s+$/g,

	/**
	 * A RegExp to retrieve version's numbers
	 * @type {RegExp}
	 */
	rVersion = /\d+/g;


/**
 * Extend some objects or the this' prototype
 * Be careful when passing more than two arguments since this method
 * add some properties from the last argument, to the first : obj1 <- obj2 <- obj3.
 *
 * @param {object} obj The object to merge to the prototype.
 * @return {undefined} Return nothing.
 *
 * @param {object} ... The objects to merge together.
 * @return {undefined} Return nothing.
 */
Renderer.extend = function extend() {
	var
		args = Array.prototype.slice.call(arguments), // Cast arguments to array
		i, source, target, prop; // Loop specific

	// If we have only one argument we want to augment the prototype
	if (args.length === 1) {
		args.unshift(this.prototype);
	}

	// Loop through arguments from the end
	for (i = args.length - 1; i > 0; i--) {
		source = args[i]; // More convenient
		target = args[i - 1]; // More convenient

		// Loop through each property to extend
		for (prop in source) {
			// Override the target's value with the new value or a facade function if necessary
			target[prop] = source[prop];
		}
	}
}; // end of Renderer.extend()


// Extend the Renderer's "class" with static members
Renderer.extend(Renderer, {
	/**
	 * Check if a given URL is readable by this renderer
	 *
	 * @param {string} url The url to check
	 * @param {string|array} type The MIME type(s) associated to this URL
	 * @return {string} Return "probably" or "maybe" if the MIME type is supported, "" (empty string) otherwise
	 */
	canPlay: function canPlay(url, type) {
		var
			// Get or guess the MIME type (we can receive "undefined", treat it like a MIME)
			mime = arguments.length === 2 ? type : Renderer.guessType(url),
			i = 0, count, // Loop specific
			result, canPlayType = ""; // Prepare the result (default to "" if we doesn't have any MIME type)

		// Work only with array, more convenient
		mime = mime || []; // Don't bother to loop if we doesn't have a MIME type
		mime = mime.push ? mime : [mime]; // "cast" regular MIME type to array

		// Loop through MIME types (for some extensions we can have multiple MIME types)
		for (count = mime.length; i < count; i++) {
			// Test the MIME type
			result = this.canPlayType(mime[i]);

			// Ouh, nice result, exit
			if (result === "probably") {
				return result;
			}

			// Meh. Continue in case we found a probably
			canPlayType = canPlayType || result;
		}

		// Return the result (may be "", "maybe" or "probably")
		return canPlayType;
	}, // end of Renderer.canPlay()


	/**
	 * Check if a given MIME type is readable by this renderer
	 *
	 * @param {string} type The MIME type to check
	 * @return {string} Returns "maybe" or "probably" is the MIME type is supported, "" otherwise
	 */
	canPlayType: function canPlayType(type) {
		return this.types[type] || "";
	}, // end of Renderer.canPlayType()


	/**
	 * Try to guess the MIME type based on an extension or an URL
	 *
	 * @param {string} ext The extension or URL to use to guess MIME type
	 * @return {string|array|false} Returns a string or an array of MIME types. undefined if the extension is unknown.
	 */
	guessType: function guessType(ext) {
		var type, key;

		// Treat ext as full URL if its length is more than 5 characters
		if (ext && ext.length > 5) {
			ext = ext.match(rExt); // Get the probable extensions
			ext = ext ? ext[ext.length - 1].substring(1) : ""; // Keep the last one
		}

		// Exit if we don't have an extension to test
		if (!ext) { return; }

		// Transforming the extension to a RegExp, easier to find in Renderer.mimes' keys
		ext = new RegExp(ext, "i");

		for (type in Renderer.mimes) {
			for (key in Renderer.mimes[type]) {
				// Check if this key is the extension we're looking for
				if (ext.test(key)) {
					// Check if the MIME is an array
					if (Renderer.mimes[type][key].push) {
						// Before returning, append the type in front of MIMEs
						return Renderer.mimes[type][key].join().replace(rAppendType, type + "/$1").split(",");
					} else {
						return type + "/" + Renderer.mimes[type][key];
					}
				}
			} // end of for (ext in Renderer.mimes[type])
		} // end of for (type in Renderer.mimes)

		// Return undefined if extension is unknown
		return;
	}, // end of Renderer.guessType()


	/**
	 * Inherit from a class
	 * This function seems strange because it is.
	 * It is only a sugar to ease developper's pain.
	 *
	 * @param {function} base The base class to inherit to.
	 * @return {undefined} Return nothing.
	 *
	 * @example
	 *   function LambdaRenderer() {} // Create a new "class"
	 *   LambdaRenderer.inherit = Renderer.inherit; // LambdaRenderer now know to inherit
	 *   LambdaRenderer.inherit(Renderer); // Inherit from Renderer
	 */
	inherit: function inherit(base) {
		// Set the constructor's name if it doesn't exists (IE)
		// Beware to only set it if undefined, this property is read-only in strict mode
		if (!this.name) {
			var name = rFunction.exec(this.toString()); // Search for the function name
			this.name = name ? name[1] : "unknown"; // Define the name or define to "unknown"
		}

		this.prototype = new base(); // Inherit from the base
		this.prototype.constructor = this; // Correct the constructor
	}, // end of Renderer.inherit()


	/**
	 * Utility function to check if a plugin is supported
	 *
	 * @param {object} info The plugin info (minVersion, plugin name and activeX name)
	 * @return {boolean} Is this plugin supported?
	 */
	isPluginSupported: function isPluginSupported(info) {
		var
			version, // The plugin version
			minVersion = info.minVersion, // The min plugin version
			ax, // ActiveX
			diff, // The difference between two version, used to check versions
			i = 0, count; // Loop specific

		// Check if the plugin exists on good browsers
		if (navigator.plugins && navigator.plugins[info.plugin]) {
			// It seems. Get the description (include the version)
			version = navigator.plugins[info.plugin].description;
		} else if (window.ActiveXObject) {
			// Bad browsers use ActiveX, use a try/catch to avoid error when plugin doesn't exists
			try {
				ax = new ActiveXObject(info.activex);

				// Check if this ActiveX has a IsVersionSupported
				try {
					// IsVersionSupported seems to be an ActiveX function
					if (typeof ax.IsVersionSupported(minVersion) === "boolean") {
						return ax.IsVersionSupported(minVersion);
					}
				} catch (e2) {}

				// Otherwise try to retrieve the version
				version = ax.getVariable("$version");
			} catch (e1) {}
		}

		// A version was found
		if (version) {
			// Split the versions
			version    = version.match(rVersion);
			minVersion = minVersion.match(rVersion);

			// Loop through the minVersion to check with the current installed
			for (count = minVersion.length; i < count; i++) {
				// Calculate the difference between installed and target version
				diff = (parseInt(version[i], 10) || 0) - (parseInt(minVersion[i], 10) || 0);

				// The installed match the target version, continue to next version number
				if (diff === 0) { continue; }

				// The installed doesn't match, so it can be greater or lower, just return this result
				return (diff > 0);
			}

			return true; // The minVersion === version
		}

		return false; // No version found or plugin not installed
	}, // end of Renderer.isPluginSupported()


	/**
	 * Add a renderer to the list of supported renderers
	 *
	 * @param {Renderer} renderer The renderer to register.
	 * @return {undefined} Return nothing.
	 */
	register: function register(renderer) {
		if (renderer.isSupported) {
			// Add this renderer to the stack of supported renderers
			this.supported.push(renderer);

			// Keep a static reference to the renderer's class
			// This allow calling LambdaRenderer using Renderer.LambdaRenderer
			// Only Renderer need to be exposed
			Renderer[renderer.name] = renderer;
		}
	}, // end of Renderer.register()


	/**
	 * An instance cache, used to retrieve an instance from a plugin
	 * @type {object}
	 */
	instances: {},


	/**
	 * Create a closure calling a method on the API
	 *
	 * @param {string} method The method name to call
	 * @return {function} A closure calling the method
	 */
	shorthand: function shorthand(method) {
		return function() {
			return (this.api && typeof this.api[method] === "function") ? this.api[method].apply(this.api, arguments) : undefined;
		};
	}, // end of shorthand()


	/**
	 * A list of currently supported renderers
	 * @type {array}
	 */
	supported: []
}); // end of Renderer.extend(Renderer)


// Extend the HTMLRenderer's prototype
Renderer.extend({
	/**
	 * Renderer initialization
	 *
	 * @param {object} config The configuration of the renderer.
	 *   @param {string} id The id the renderer's markup will have.
	 *   @param {number} height The renderer's height (might be 0).
	 *   @param {number} width The renderer's width (might be 0).
	 * @return {Renderer} Return the current instance to allow chaining.
	 */
	init: function init(config) {
		var
			renderer  = this.constructor, // Retrieve the renderer's "class"
			instances = Renderer.instances[renderer.name]; // Retrieve the instances cache for this kind of renderers

		// Prepare the instance
		this.callbacks = []; // The callbacks to launch when the renderer is ready
		this.config    = config; // Save a reference to the configuration (do NOT modify this hash)
		this.events    = {}; // A cache to remember which event type the renderer is already listening

		// This renderer was never instanciated, initialize a cache
		if (!instances) {
			/*!
			 * Use an hash as fake array for cache.
			 * Some renderers will call a method on window. We need a way to point to the right instance.
			 * So we expose something like Renderer.instances.LambdaRenderer.myPlayer = this.
			 * Save also this cache reference to the renderer.
			 */
			Renderer.instances[renderer.name] = renderer.instances = instances = {};
		}

		// Store this instance in the cache (even if it already exists)
		instances[config.id] = this;

		return this; // Chaining
	}, // end of init()


	/**
	 * Ask the element to listen for an event type
	 *
	 * @param {string} types The event type(s) to listen.
	 *   You may provide multiple event types by separating them with a space.
	 * @return {Renderer} Return the current instance to allow chaining.
	 */
	bind: function bind(types) {
		var type; // Loop specific

		// Allow multiple events types separated by a space
		types = types ? types.replace(rTrim, "").split(rSplit) : []; // Trim first to avoid bad splitting

		// Loop through each event types
		while ((type = types.shift())) {
			// Is this renderer already listening for this type?
			// Is there an API to call?
			// Is there an unbind method in the API?
			if (!this.events[type] && this.api && typeof this.api.bind === "function") {
				// Ask the renderer to actually bind this type
				this.api.bind(type);

				// Mark this type as "currently listening"
				this.events[type] = true;
			}
		} // end of while

		return this; // Chaining
	}, // end of bind()


	/**
	 * Create a closure to launch a method on the current instance
	 *
	 * @param {string} method The method to launch.
	 * @param {*} [...] The other arguments to pass to the method.
	 * @return {function} Return a closure which will call the method.
	 */
	closure: function closure(method) {
		var
			that = this, // Save a reference to this instance
			args = Array.prototype.slice.call(arguments); // Convert arguments to a real array

		// Remove the first argument (the method name)
		args.shift();

		return function closure() {
			// Call the method (if it exists), pass the arguments (args and these arguments)
			return that[method] ? that[method].apply(that, args.concat(Array.prototype.slice.call(arguments))) : undefined;
		};
	}, // end of closure()


	/**
	 * Destroy the instance
	 * Will simply remove itself from the cache.
	 *
	 * @param {undefined}
	 * @return {null} Return `null` to stop chaining.
	 */
	destroy: function destroy() {
		var cache = Renderer.instances[this.constructor.name];
		if (cache[this.config.id]) {
			delete cache[this.config.id];
		}

		// It is more convenient to return null (end chaining)
		return null;
	}, // end of destroy()


	/**
	 * A flag to check if this renderer is ready (wait for plugin initialization)
	 * @type {boolean}
	 */
	isReady: false,


	// API shorthands
	load:  Renderer.shorthand("load"),
	pause: Renderer.shorthand("pause"),
	play:  Renderer.shorthand("play"),


	/**
	 * Get a property's value
	 *
	 * @param {string} property The property's value to get.
	 * @return {*|undefined} Return the property's value or undefined if the renderer isn't ready.
	 */
	get: function get(property) {
		// Let the time to the renderer to finish initializing
		if (this.isReady) {
			return (typeof this.api.get === "function") ? this.api.get(property) : this.api[property];
		}
	}, // end of get()


	/**
	 * Add a callback to launch when ready or set this renderer as ready
	 *
	 * @param {function} callback The callcack to add to the stack of callbacks to launch when ready.
	 * @return {boolean|undefined} When adding a callback, return `true` if the callback is correctly registered, `false` if it is not a function.
	 *   Otherwise, return `undefined`.
	 */
	ready: function ready(callback) {
		// If the renderer is already ready, simply launch the callback
		if (this.isReady) {
			return (typeof callback === "function") ? callback.call(this) && undefined : undefined;
		}

		// If we are receiving a callback, simply push it to the stack
		if (callback) {
			return (typeof callback === "function") ? !!this.callbacks.push(callback) : false;
		}

		// Loop through the callbacks and launch them
		while (this.callbacks && (callback = this.callbacks.shift())) {
			callback.call(this);
		}

		// We don't need the callbacks stack anymore
		delete this.callbacks;

		// This renderer is now ready
		this.isReady = true;
	}, // end of ready()


	/**
	 * Set a property's value
	 *
	 * @param {string} property The property to change.
	 * @param {*} value The new property's value.
	 * @return {*|undefined} Return the value corrected by the renderer or undefined if the renderer isn't ready.
	 */
	set: function set(property, value) {
		// Don't bother if the renderer isn't ready
		if (!this.isReady) { return; }

		// Use the set method of the element (plugins) if exists
		if (typeof this.api.set === "function") {
			return this.api.set(property, value);
		} else {
			// Otherwise try to set the property in the api
			// This may fail sometimes depending on the properties (ex: setting currentTime too soon)
			try {
				this.api[property] = value;
			} catch (e) {}

			// Return the corrected value
			return this.api[property];
		}
	}, // end of set()


	/**
	 * Trigger an event
	 * Beware to return nothing since this method can be called from ExternalInterface
	 * and returning the whole instance will slow down *a lot* flash
	 *
	 * @param {string} type The event type to dispatch
	 * @return {undefined} Return nothing.
	 */
	trigger: function trigger(type) {
		// Check if we have a triggerer (we never know)
		if (this.triggerer) {
			this.triggerer(type);
		}
	}, // end of trigger()


	/**
	 * Stop listening for an event type
	 *
	 * @param {string} types The event type(s) to listen.
	 *   You may provide multiple event types by separating them with a space.
	 * @return {Renderer} Return the current instance to allow chaining.
	 */
	unbind: function unbind(types) {
		var type; // Loop specific

		// Allow multiple events types separated by a space
		types = types ? types.replace(rTrim, "").split(rSplit) : []; // Trim first to avoid bad splitting

		// Loop through each event types
		while ((type = types.shift())) {
			// Is this renderer listening for this type?
			// Is there an API to call?
			// Is there an unbind method in the API?
			if (this.events[type] && this.api && typeof this.api.unbind === "function") {
				// Ask the renderer to actually unbind this type
				this.api.unbind(type);

				// Clean the cache for this event type
				delete this.events[type];
			}
		} // end of while

		return this; // Chaining
	} // end of unbind()
}); // end of Renderer.extend()

// Expose
window.Renderer = Renderer;