var
/**
 * The fabuloos function
 * Use it to create a new fabuloos player or to get an existing one from the instances' cache.
 *
 * @param {string} id The ID attribute of the element to enhance (might be `<audio>`, `<video>` or any element).
 * @return {fabuloos} Return a new fabuloos instance or an instance from the instances' cache.
 *
 * @param {Element} element The element to enhance (might be `<audio>`, `<video>` or any element).
 * @return {fabuloos} Return a new fabuloos instance or an instance from the instances' cache.
 *
 * @param {object} config The configuration to apply.
 *   If the configuration contains an `element` property the player will be based on this element.
 *   You can specify a string or an Element, just as the previous signatures.
 * @return {fabuloos} Return a new fabuloos instance or an instance from the instances' cache.
 *
 * @param {undefined}
 * @return {fabuloos} Return a new fabuloos instance.
 */
	fab = function fabuloos(config) {
		// Check if we're trying to create an instance of fab
		if (this instanceof fab) {
			// Then, initialize it
			return this.init(config);
		}

		var
			// First, find the element (might be { element: "div" } or "div")
			element = config ? config.element || config : {},

			// Then find the id
			// It might be a string (simply use it after removing the debuting hash)
			// Or an Element, simply try to retrieve its id
			id = element.replace ? element.replace("#", "") : element.id,

			// Loop specific
			i = 0, instance;

		// Search for an instance in the cache having this id
		while (id && (instance = fab.instances[i++])) {
			if (instance._id === id) {
				return instance;
			}
		}

		// No instance found, create a new one
		return new fab(config);
	}, // end of fabuloos()

	/**
	 * The properties we can get
	 * @type {string}
	 */
	getterProperties = "error networkState readyState width height videoWidth videoHeight src currentSrc preload buffered currentTime duration defaultPlaybackRate playbackRate seeking seekable paused played ended poster autoplay controls loop volume muted",

	/**
	 * When setting an hash of properties we may have to ignore some irrelevant properties
	 * @type {string}
	 */
	ignoreProperties = "type",

	/**
	 * The properties we can set
	 * @type {string}
	 */
	setterProperties = "width height src preload currentTime defaultPlaybackRate playbackRate poster autoplay controls loop volume muted",

	/**
	 * Some properties have to be priorized while setting using an hash
	 * @type {object}
	 */
	setterPriorities = {
		first: "on element",
		last:  "src"
	},

	/**
	 * The properties we can toggle
	 * @type {string}
	 */
	togglerProperties = "autoplay controls loop muted",

	/*!
	 * A RegExp used to test if an element is <audio> or <video>
	 * @type {RegExp}
	 */
	rMedia = /audio|video/i,

	/*!
	 * A RegExp used to capture the private properties
	 * @type {RegExp}
	 */
	rPrivate = /^_/,

	/*!
	 * A RegExp used to detect the presence of "_super" in a function's content
	 * This RegExp will be used to check if we have to create a facade for a method when inheriting
	 * @type {RegExp}
	 */
	rSuper = /xyz/.test(function() { "xyz"; }) ? /\b_super\b/ : /.*/;


/*!
 * Create a facade function to simulate inheritance
 * This closure will create this._super and call the wanted method.
 *
 * @param {function} fn The new function to call
 * @param {*} _super The super value (might be of any type)
 * @return {function} Return a facade function for a specific function
 */
function createFacade(fn, _super) {
	return function facade() {
		// Define the _super property (allow this._super inside the method)
		this._super = _super;

		// Launch the method passing the right this and the arguments, store the result for returning
		var result = fn.apply(this, arguments);

		// Delete the _super since we don't need it anymore
		delete this._super;

		// Return the method's result
		return result;
	};
} // end of createFacade()


/*!
 * Measure the width or height of an element
 *
 * @param {element} element The element to measure.
 * @param {string} property The property to measure.
 * @return {number|null} Return the measured size or null if there is no element.
 */
function measure(element, property) {
	// If there is no element, return null (0 is still a size)
	if (!element) { return null; }

	var value = window.getComputedStyle ?
	// Pass a second argument (null) to getComputedStyle for compatibility reasons
	// @see https://developer.mozilla.org/en-US/docs/DOM/window.getComputedStyle
	window.getComputedStyle(element, null).getPropertyValue(property) :
	// Use the scrollWidth/scrollHeight property since it is calculated in a different way in IE
	element["scroll" + property.charAt(0).toUpperCase() + property.slice(1)];

	return parseInt(value, 10) || 0;
} // end of measure()


/**
 * Extend some objects or the fabuloos' prototype
 * It will simulate inheritance by giving access to this._super.
 * Be careful when passing more than two arguments since this method
 * add some properties from the last argument, to the first : obj1 <- obj2 <- obj3.
 *
 * @param {object} obj The object to merge to the prototype.
 * @return {undefined} Return nothing.
 *
 * @param {object} ... The objects to merge together.
 * @return {undefined} Return nothing.
 *
 * @example
 *   // Extend the fabuloos' prototype (adding the play method if it doesn't exists)
 *   fab.extend({
 *     play: function() { console.log("First play"); }
 *   });
 *
 *   // Still extending the fabuloos' prototype (replacing the play method with this one)
 *   fab.extend({
 *     play: function() {
 *       console.log("Second play");
 *       this._super();
 *     }
 *   });
 *
 *   fab().play(); // "Second play" then "First play"
 *
 *   // Extending the fabuloos "class"
 *   fab.extend(fab, {
 *     clear: function() {
 *       console.log("Clear");
 *     }
 *   });
 *
 *   fab.clear(); // "Clear"
 */
fab.extend = function extend() {
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
			target[prop] = (typeof source[prop] === "function" && rSuper.test(source[prop])) ? createFacade(source[prop], target[prop]) : source[prop];
		}
	}
}; // end of fab.extend()


// Extend the fabuloos' "class" with static members
fab.extend(fab, {
	/**
	 * A cache for all fabuloos' instances
	 * @type {array}
	 */
	instances: [],


	/**
	 * Create a closure calling a method on the renderer
	 *
	 * @param {string} method The method name to call.
	 * @return {function} A closure calling the method.
	 */
	shorthand: function shorthand(method) {
		return function() {
			// Call the method only if available
			if (this._renderer && typeof this._renderer[method] === "function") {
				this._renderer[method]();
			}

			return this; // Chaining
		};
	}, // end of shorthand()


	/**
	 * A simple useful wrapper to cast to array
	 * Useful when you need to cast a list (arguments, NodeList) to an array
	 *
	 * @param {*} obj The object to cast to array.
	 * @return {array} Return the object casted.
	 */
	toArray: function toArray(obj) {
		return Array.prototype.slice.call(obj);
	}, // end of toArray()


	/**
	 * A simple instance counter
	 * Used to make sure we generate an unique default ID when needed
	 * @type {number}
	 */
	UID: 0,


	/**
	 * The current script's version (http://semver.org)
	 * @type {string}
	 */
	version: "@VERSION"
}); // end of fab.extend(fab)


// Extend the fabuloos' prototype
fab.extend({
	/**
	 * Initialize an instance
	 * This method exists so you can extend it and handle specific cases in your plugin.
	 * Calling this method on an existing instance will reset it.
	 *
	 * @see #fab() for signatures
	 */
	init: function init(config) {
		// We're trying to initialize an existing instance, destroy it first
		if (this._id) {
			this.destroy();

			// Since we're re-initializing this instance, delete _element in order to correctly get a new one
			delete this._element;
		}

		var _config = {}, prop;

		// Create a local copy of config
		if (config && config.constructor === Object) {
			for (prop in config) {
				if (config.hasOwnProperty(prop)) {
					_config[prop] = config[prop];
				}
			}
		}

		/*!
		 * Try to retrieve an element to base on
		 * If none, we're creating a new player (the element should be defined later)
		 * By setting _config.element we force at least one call to element() who will generate an ID
		 */
		_config.element = _config.element || config || null;

		// Add this instance to the instances' cache
		fab.instances.push(this);

		// Create a closure so the renderers will be able to trigger events on the right instance
		this._triggerer = this.closure("trigger");

		// Define an UID for this instance (used to define a default ID when needed)
		this._uid = "fabuloos-" + (++fab.UID);

		// Set the configuration
		this.config(_config);

		return this; // Chaining
	}, // end of init()


	/**
	 * Attach all listeners to the renderer
	 *
	 * @param {undefined}
	 * @return {fabuloos} Return the current instance to allow chaining.
	 */
	attach: function attach() {
		var
			cache = fab.event.cache(this), // Get the events cache
			type; // Loop specific

		if (this._renderer) {
			// Tell the renderer to listen for all the types
			for (type in cache.handlers) {
				this._renderer.bind(type);
			}
		}

		return this; // Chaining
	}, // end of attach()


	/**
	 * Create a closure to launch a method
	 *
	 * @param {string} method The method to launch.
	 * @param {*} [...] The other arguments to pass to the method.
	 * @return {function} Return a closure which will call the method.
	 *
	 * @example
	 *   var player = fab();
	 *   player.on("ended", player.closure("src", "http://fabuloos.org/video.mp4")); // Automatically change the source when the first is finished
	 *   player.on("ended", player.closure("currentTime", 0)); // Rewind when the media end
	 *   fab.bind(btn, "click", player.closure("play")); // Bind a button to launch a method
	 */
	closure: function closure(method) {
		var
			that = this, // Save a reference to this instance
			args = fab.toArray(arguments); // Convert arguments to a real array

		// Remove the first argument (the method name)
		args.shift();

		return function closure() {
			// Call the method (if it exists), pass the arguments (args and these arguments)
			return that[method] ? that[method].apply(that, args.concat(fab.toArray(arguments))) : undefined;
		};
	}, // end of closure()


	/**
	 * Launch a method on the instance
	 *
	 * @param {string} method The method to launch.
	 * @param {*} [...] The other arguments to pass to the method.
	 * @return {*} Return the result of the method or undefined if the method doesn't exists.
	 *
	 * @example
	 *   var player = fab("media");
	 *   player.cmd("pause"); // Return player to allow chaining
	 *   player.cmd("paused"); // Return true or false
	 *   player.cmd("src", "http://fabuloos.org/video.mp4"); // Return player to allow chaining
	 *   player.cmd("foo"); // Return undefined
	 */
	cmd: function cmd(method) {
		var args = fab.toArray(arguments); // Convert arguments to a real array
		args.shift(); // Remove the first argument (the method name)

		return this[method] ? this[method].apply(this, args) : undefined;
	}, // end of cmd()


	/**
	 * An alias for the #set() method
	 */
	config: function config() {
		return arguments.length ? this.set.apply(this, arguments) : this._config;
	}, // end of config()


	/**
	 * Destroy the instance
	 * Will restore the initial element and remove the instance from the cache.
	 *
	 * @param {undefined}
	 * @return {null} Return `null` to stop chaining.
	 */
	destroy: function destroy() {
		var i = 0, count = fab.instances.length, prop; // Loop specific

		// Restore the old element (if any)
		this.restore();

		// Loop through all instances and remove this instance when found
		for (; i < count; i++) {
			if (fab.instances[i] === this) {
				fab.instances.splice(i, 1);
				break;
			}
		}

		// Delete all private properties
		for (prop in this) {
			if (rPrivate.test(prop)) {
				delete this[prop];
			}
		}

		// It is more convenient to return null (end chaining)
		return null;
	}, // end of destroy()


	/**
	 * Detach all listeners from the renderer
	 *
	 * @param {undefined}
	 * @return {fabuloos} Return the current instance to allow chaining.
	 */
	detach: function detach() {
		var
			cache = fab.event.cache(this), // Get the events cache
			type; // Loop specific

		if (this._renderer) {
			// Tell the renderer to stop listening for all the types
			for (type in cache.handlers) {
				this._renderer.unbind(type);
			}
		}

		return this; // Chaining
	}, // end of detach()


	/**
	 * Getter and setter for the current element
	 * Get the element reflecting the player (depend on the renderer in use).
	 * Set the element to replace with a player.
	 *
	 * @param {string} id The ID attribute of the element to enhance (might be `<audio>`, `<video>` or any element).
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {Element} element The element to enhance (might be `<audio>`, `<video>` or any element).
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {undefined}
	 * @return {Element|null} Return the current element reflecting the player.
	 */
	element: function element(config) {
		// Act as getter if there is no arguments and if there is an element (might be null)
		if (config === undefined && "_element" in this) {
			return this._element;
		}

		var
			// @see #fab()
			elt = config || {},
			id  = elt.replace ? elt.replace("#", "") : elt.id,
			attributes, attribute, // Loop specific
			sources, source; // Loop specific

		// If we are changing the element, restore the old one
		if (this._old) {
			this.restore();
		}

		this._id     = id || this._uid; // Set the new id or use the default setted by #restore()
		this._old    = this._element = elt.nodeName ? elt : document.getElementById(id); // Set the current element
		this._config = {}; // Define an hash for the renderers' configuration (reflecting the element)

		/*!
		 * If this._element is an <audio> or <video> tag, read its attributes and <source>
		 * We cannot use this._element instanceof HTMLMediaElement or this._element.canPlayType
		 * since we have to read the attributes despite the fact the browser support HTMLMediaElement.
		 * Simply fallback to testing the nodeName against a RegExp
		 *
		 * The sources will only be searched if there is no current sources
		 */
		if (this._element && rMedia.test(this._element.nodeName)) {
			attributes = fab.toArray(this._element.attributes);

			// Watch for attributes
			while ((attribute = attributes.shift())) {
				/*!
				 * Store the attribute's name and value in _config
				 * It will be used by renderers to create the right markup
				 * If the value is falsy, set it to true since an attribute without a value is often considered as true
				 */
				this._config[attribute.name] = attribute.value || true;
			}

			// Check if there was a "src" attribute.
			// Otherwise look for <source> tags.
			if (!this._config.src) {
				this._config.src = []; // Prepare the sources stack
				sources = fab.toArray(this._element.getElementsByTagName("source")); // Get the tags

				// Loop through each tags
				while ((source = sources.shift())) {
					attributes = fab.toArray(source.attributes);
					source     = {};

					// Loop through each tag's attribute
					while ((attribute = attributes.shift())) {
						// Store the attribute's name and value in an hash
						source[attribute.name] = attribute.value || true;
					}

					// Add this source to the sources stack
					this._config.src.push(source);
				} // end of while
			} // end of if

			// Analyze the available sources
			this.src(this._config.src);
		} // end of if

		return this; // Chaining
	}, // end of element()


	/**
	 * Get a player's property
	 * Warning: breaks the chaining.
	 *
	 * @param {string} property The property's value to get.
	 * @return {*} Return the property's value.
	 */
	get: function get(property) {
		return this._renderer ? this._renderer.get(property) : undefined;
	}, // end of get()


	/**
	 * Get or set the height of the player
	 *
	 * @param {number} value The new height to apply.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {undefined}
	 * @return {number} Return the height of the player.
	 */
	height: function height(value) {
		return this.size("height", value);
	}, // end of height()


	/**
	 * Load the current source
	 *
	 * @param {undefined}
	 * @return {fabuloos} Return the current instance to allow chaining.
	 */
	load: fab.shorthand("load"),


	/**
	 * Unregister an handler for a given event
	 *
	 * @param {string} types The event type(s) to stop listening.
	 * @param {function} handler The handler previously attached.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {string} types The event type(s) to stop listening.
	 * @param {null} handler Passing `null` will remove all handlers associated to this/these type(s).
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {null} types Passing `null` will remove the given handler for all types.
	 * @param {function} handler The handler previously attached.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {object} obj An hash of types and handlers to remove.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {undefined}
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @example
	 *   fabuloos(…)
	 *    .off() // Will remove all listeners
	 *    .off("", handle) // Will remove "handle" for each types
	 *    .off("pause") // Will remove all listeners for the "pause" event type
	 *    .off("pause", handle) // Will remove "handle" for the "pause" event type
	 *    .off("play pause") // Will remove all listeners for the "play" and "pause" event types
	 *    .off("play pause", handle); // Will remove "handle" for the "play" and "pause" event types
	 */
	off: function off(types, handler) {
		var
			cache      = fab.event.cache(this), // Get the events cache
			previously = [], // The list of currently listening event types
			type; // Loop specific

		// Support receiving object literals
		if (arguments[0] && arguments[0].constructor === Object) {
			// Simply loop through the hash and call itself
			for (type in arguments[0]) {
				this.off(type, arguments[0][type]);
			}

			return this; // Chaining
		}

		// Generate the list of event types we are currently listening
		for (type in cache.handlers) {
			previously.push(type);
		}

		// Unregister this handler for this/these type(s)
		fab.event.off(this, types, handler);

		// If we have a renderer, tell him to stop listening if there is no more handler for this/these type(s)
		if (this._renderer) {
			// Loop through the event types we were listening before removing some
			while ((type = previously.shift())) {
				// Check if the event type still exists
				if (!cache.handlers[type]) {
					// If not, tell the renderer to stop listening
					this._renderer.unbind(type);
				}
			}
		}

		return this; // Chaining
	}, // end of off()


	/**
	 * Register an handler for a given event
	 *
	 * @param {string} types The event type(s) to listen.
	 *   You may provide multiple event types by separating them with a space.
	 * @param {function} handler The function to call when the event type is fired.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {object} obj An hash of types and handlers.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @example
	 *   fab(…)
	 *    .on("play", function() { console.log("play event"); })
	 *    .on("pause", handlePause);
	 *
	 *   // We can also register multiple events for the same handler:
	 *   fab(…).on("play pause", handleTogglePlay);
	 */
	on: function on(types, handler) {
		// Support receiving object literals
		if (arguments.length === 1) {
			// Simply loop through the hash and call itself
			for (var type in arguments[0]) {
				this.on(type, arguments[0][type]);
			}

			return this; // Chaining
		}

		// Prevent bad arguments
		if (typeof types !== "string" || typeof handler !== "function") {
			return this; // Chaining
		}

		// Register this handler for this/these type(s)
		fab.event.on(this, types, handler);

		// If we have a renderer, tell him to listen for this/these type(s)
		// If there is no renderer (first, we cannot receive events) the types will be set using attach
		if (this._renderer) {
			this._renderer.bind(types);
		}

		return this; // Chaining
	}, // end of on()


	/**
	 * Pause the playback
	 *
	 * @param {undefined}
	 * @return {fabuloos} Return the current instance to allow chaining.
	 */
	pause: fab.shorthand("pause"),


	/**
	 * Launch the playback
	 *
	 * @param {undefined}
	 * @return {fabuloos} Return the current instance to allow chaining.
	 */
	play: fab.shorthand("play"),


	/**
	 * Change or get the renderer
	 *
	 * @param {Renderer} renderer The new renderer to use.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {string} renderer The renderer's identifier to use.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {undefined}
	 * @return {Renderer|undefined} Return the current renderer.
	 */
	renderer: function renderer(_renderer) {
		var that = this;

		// No renderer received, acting like a getter
		if (!_renderer) {
			return this._renderer;
		}

		// Try to retrieve the renderer if we received a string
		if (typeof _renderer === "string") {
			_renderer = Renderer[_renderer];
		}

		// Check if we correctly received a renderer
		if (!_renderer || !_renderer.canPlay) {
			throw "This renderer isn't valid.";
		}

		// Check if the renderer is supported before creating it
		if (!_renderer.isSupported) {
			return this.trigger("renderer.unsupported");
		}

		// Dispatch a "renderer.changing" event
		this.trigger("renderer.changing");

		// Makes sure the renderer will receive an ID and a size (mandatory for most of the renderers)
		this._config.id     = this._id;
		this._config.width  = this._config.width  || 0;
		this._config.height = this._config.height || 0;

		// Detach all listeners
		this.detach();

		// Destroy the current renderer
		if (this._renderer) {
			this._renderer.destroy();
		}

		// Create the new renderer
		this._renderer = new _renderer(this._config);

		// Define the triggerer
		this._renderer.triggerer = this._triggerer;

		// Replace the old renderer markup
		this._renderer.replace(this._element);

		// Wait for the renderer to be ready
		this._renderer.ready(function() {
			// Keep a reference to the element
			that._element = this.element;

			// Attach all listeners
			that.attach();

			// Dispatch a "rendererready" event
			that.trigger("renderer.ready");
		});

		return this; // Chaining
	}, // end of renderer()


	/**
	 * Define the list of supported renderers
	 *
	 * @param {array} renderers The renderers to define as available.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {Renderer} renderer The only renderer to define as available.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {string} renderer The only renderer (by identifier) to define as available.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {undefined}
	 * @return {array|undefined} Return the available renderers.
	 */
	renderers: function renderers(_renderers) {
		// Act as a getter if there is no arguments
		if (!_renderers) {
			return this._renderers;
		}

		// Don't bother checking supported renderers if we received the default supported renderers
		if (_renderers === Renderer.supported) {
			this._renderers = Renderer.supported;
			return this; // Chaining
		}

		var
			// List of supported renderers (copying the received arguments)
			supported = _renderers.push ? _renderers.slice(0) : [_renderers],
			i = 0, renderer; // Loop specific

		// Loop through each renderers to test them
		while ((renderer = supported[i])) {
			// Support renderer's identifiers
			renderer = typeof renderer === "string" ? Renderer[renderer] : renderer;

			// Handle falsy values
			renderer = renderer || {};

			// Test the renderer and remove it if unsupported
			i += "isSupported" in renderer && renderer.isSupported ? 1 : (supported.splice(i, 1)).length - 1;
		}

		// Save the supported renderers list in the config
		this._renderers = supported;

		return this; // Chaining
	}, // end of renderers()


	/**
	 * Restore the initial element
	 *
	 * @param {undefined}
	 * @return {fabuloos} Return the current instance to allow chaining.
	 */
	restore: function restore() {
		// Replace the element with the old one if necessary
		if (this._element && this._old && this._element !== this._old) {
			this._element.parentNode.replaceChild(this._old, this._element);
		}

		// Set a default id since this instance isn't related to any element
		this._id  = this._uid;
		this._old = this._element = null;

		return this; // Chaining
	}, // end of restore()


	/**
	 * Set a player's property
	 * You can pass a key/value pair or an hash to set multiple properties.
	 *
	 * @param {string} property The property to set.
	 * @param {*} value The new property's value.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {object} obj An object literal of properties and their values.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @example
	 *   fab().set("autoplay", true); // Setting the "autoplay" property to "true"
	 *   fab().set({
	 *     width: 720,
	 *     autoplay: true
	 *   });
	 */
	set: function set(property, value) {
		// Support receiving object literals
		if (arguments.length === 1) {
			var
				prop, position, // Loop specific
				copy   = {}, // A copy of the received hash
				values = {}, // The prioritized hash
				first  = fab.toArray(setterPriorities.first.split(" ")), // The list of properties to set first
				last   = fab.toArray(setterPriorities.last.split(" ")), // The list of properties to set last
				order  = ["first", "middle", "last"]; // The order of the priorities

			// Copy the properties/values since we have to prioritize
			for (prop in arguments[0]) {
				copy[prop] = arguments[0][prop];
			}

			// Loop through the properties to set first
			while ((prop = first.shift())) {
				// Makes sure we have this property to set
				if (prop in copy) {
					// Makes sure we have a "first" hash where to store the properties/values
					values.first = values.first || {};

					// Store the property/value
					values.first[prop] = copy[prop];

					// Delete the property from the hash since we just prioritized it
					delete copy[prop];
				}
			} // end of while ((prop = first.shift()))

			// Loop through the properties to set last
			while ((prop = last.shift())) {
				// Makes sure we have this property to set
				if (prop in copy) {
					// Makes sure we have a "last" hash where to store the properties/values
					values.last = values.last || {};

					// Store the property/value
					values.last[prop] = copy[prop];

					// Delete the property from the hash since we just prioritized it
					delete copy[prop];
				}
			}

			// Define the properties/values to set in the middle (no particuliar priority)
			values.middle = copy;

			// Loop through orders to set sequentially
			while ((position = order.shift())) {
				// Get the group of properties/values to set for this position
				for (prop in values[position]) {
					value = values[position][prop];

					// Small exception for "src"
					// Sometimes it is better to send the whole configuration
					if (prop === "src") {
						value = value && value.substr ? arguments[0] : value;
					}

					// Set the property using the other signature
					this.set(prop, value);
				}
			}

			return this; // Chaining
		} // end of if (arguments.length === 1)

		// We can ignore some properties
		// The "type" property is useless until related to an "src" property
		if (new RegExp(property).test(ignoreProperties)) {
			return this; // Chaining
		}

		// Prefer specialized method having the property's name
		// Prevent calling automatically created accessor's method (will cause infinite calls)
		if (typeof this[property] === "function" && !this[property].accessor) {
			this[property](value);
		} else if (new RegExp(property).test(setterProperties)) {
			// If we're allowed to set this property define the property and value in the _config hash
			// Store the value corrected by the renderer (if any)
			this._config[property] = this._renderer ? this._renderer.set(property, value) : value;
		} else {
			// In the other cases store the value in the instance, prefixed with an underscore
			this["_" + property] = value;
		}

		return this; // Chaining
	}, // end of set()


	/**
	 * Measure or set the size of the player
	 *
	 * @param {string} property The property to get (`width` or `height`).
	 * @return {number} Return the width or the height of the player.
	 *
	 * @param {string} property The property to set (`width` or `height`).
	 * @param {number} value The value to apply for the property.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {object} properties The properties to set (`width` and/or `height`).
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {undefined}
	 * @return {object} Return the width and height of the player.
	 */
	size: function size(property, value) {
		// Support receiving object literals
		if (arguments[0] && arguments[0].constructor === Object) {
			// Loop through the received properties
			for (var prop in arguments[0]) {
				// Call itself
				this.size(prop, arguments[0][prop]);
			}

			return this; // Chaining
		}

		// No arguments means get the width and height
		if (!arguments.length) {
			return {
				width:  measure(this._element, "width"),
				height: measure(this._element, "height")
			};
		}

		// Support only "width" and "height"
		if (property === "width" || property === "height") {
			// If there is no value, act as a getter
			if (value === undefined) {
				// Return the desire size
				return measure(this._element, property);
			} else {
				// Otherwise, act as a setter and set the size if there is an element
				if (this._element) {
					this._element[property] = parseInt(value, 10) || 0;
				}
			}
		}

		return this; // Chaining
	}, // end of size()


	/**
	 * Analyze the sources against the renderers
	 * This method will NOT change the current source, it will only analyze them.
	 *
	 * @param {string} value The URL to analyze.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {object} value An object literal representing the source (might have additional properties).
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {array} value A list of source to analyze (items can be string or object as described above).
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {undefined}
	 * @return {array} Return the analyzed sources.
	 */
	sources: function sources(value) {
		// Act as a getter if there is no arguments
		if (value === undefined) {
			return this._sources;
		}

		// The supported renderer may not be initialized yet
		if (this._renderers === undefined) {
			this.renderers(Renderer.supported);
		}

		// Reset the sources stack if there is no sources to test
		if (value === null || value.length === 0) {
			this._sources = [];
			return this; // Chaining
		}

		var
			// An array is more convenient (remember to clone existing one in order to keep the original clean)
			_sources = value.push ? value.slice(0) : [value],
			_source, source, renderers, renderer; // Loop specific

		// Initialize the sources stack
		this._sources = [];

		// Loop through sources
		while ((source = _sources.shift())) {
			_source = {};

			// Makes sure we have what we need
			_source.src       = source.src  || (source.substr ? source : null); // Search for the URL
			_source.type      = source.type || Renderer.guessType(_source.src); // Use or guess the type
			_source.solutions = {}; // Prepare the solutions hash

			// Copy the renderers
			renderers = this._renderers.slice(0);

			// Loop through renderers
			while ((renderer = renderers.shift())) {
				// Ask the renderer if it can play this source and store the result
				_source.solutions[renderer.id] = renderer.canPlay(_source.src, _source.type);
			}

			// Push this source to the stack
			this._sources.push(_source);
		}

		return this; // Chaining
	}, // end of sources()


	/**
	 * Get the source or set a new source
	 * This will change the renderer (if necessary) and define the source to play.
	 * #sources() will only find the solutions available for the given source.
	 * #src() will call #sources() internally if necessary and define the source.
	 *
	 * @param {string} value The URL of the new source.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {object} value An object literal representing the new source (might have additional properties).
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {array} value A list of possible sources (items can be string or object as described above).
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {undefined}
	 * @return {string} Return the current source.
	 *
	 * @example
	 *   fab().src("http://fabuloos.org/video.mp4"); // Will find a renderer for this source, create it and define the source
	 *
	 *   // You can help the algorith by defining the MIME type (sometime there is no extension on the URL)
	 *   fab().src({
	 *     src: "http://fabuloos.org/video.mp4"
	 *     type: "video/mp4"
	 *   });
	 *
	 *   // Define the list of possible sources (give more chance to be cross-platform)
	 *   fab().src([
	 *     "http://fabuloos.org/video.mp4",
	 *     "http://fabuloos.org/video.ogv"
	 *   ]);
	 *
	 *   // Define the list of possible sources, give some hints for the algorithm
	 *   fab().src([
	 *     { src: "http://fabuloos.org/video.mp4", type: "video/mp4" },
	 *     { src: "http://fabuloos.org/video.ogv", type: "video/ogv" }
	 *   ]);
	 */
	src: function src(value) {
		// Acting as a getter
		if (value === undefined) {
			return this.get("src");
		}

		// Expand the sources if necessary
		if (value !== this._sources) {
			this.sources(value); // Will find the source's type and ask the renderers if they can play it
		}

		var
			i = 0, source, // Loop specific
			j = 0, renderer; // Loop specific

		// Loop through each sources to find a playable one
		while ((source = this._sources[i++])) {
			// Test if the current renderer (if any) can handle this source
			if (this._renderer && source.solutions[this._renderer.constructor.id]) {
				this._renderer.set("src", source.src); // Simply ask him to change the source
				return this; // Chaining
			}

			// Loop through each active renderer
			while ((renderer = this._renderers[j++])) {
				// Skip the current renderer since it was tested first
				if (this._renderer && this._renderer.constructor === renderer) { continue; }

				// The renderers list may have been changed since the sources solutions have been found
				if (source.solutions[renderer.id] === undefined) {
					source.solutions[renderer.id] = renderer.canPlay(source.src, source.type);
				}

				// This renderer seems to be able to play this source
				if (source.solutions[renderer.id]) {
					this._config.src = source.src; // FIXME
					return this.renderer(renderer); // Change the renderer for this one
				}
			} // end of while
		} // end of while

		// If we reached this point it means no renderer could be found
		this.trigger("no.renderer");

		return this; // Chaining
	}, // end of src()


	/**
	 * Toggle a player's property's value
	 *
	 * @param {string} property The property to toggle.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @example
	 *   var player = fab("media");
	 *   player.toggle("autoplay");
	 */
	toggle: function toggle(property) {
		if (new RegExp(property).test(togglerProperties) && this._renderer) {
			// Set the property by toggleing its value
			this.set(property, !this.get(property));
		}

		return this; // Chaining
	}, // end of toggle()


	/**
	 * Trigger the listeners for a type
	 * You can trigger some types at once by separating them with a space.
	 *
	 * @param {string} type The type(s) of event to trigger.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 */
	trigger: function trigger(type) {
		// Trigger!
		fab.event.trigger(this, type);

		return this; // Chaining
	}, // end of trigger()


	/**
	 * Wait before launching the rest of the chain
	 *
	 * @param {string} event The event to wait to automatically release the rest of the chain.
	 * @return {function} Return a function releasing the rest of the chain.
	 *
	 * @param {number} time The time to wait (ms) before automatically release the rest of the chain.
	 * @return {function} Return a function releasing the rest of the chain.
	 *
	 * @param {undefined}
	 * @return {function} Return a function releasing the rest of the chain.
	 */
	wait: function wait() {
		var
			that  = this, // Keep a reference to the current instance, used in the releaser
			queue = [],   // Prepare the queue of methods to call later
			fn; // Loop specific

		// Prepare a function which will release the queue
		function release() {
			var
				result = that,
				item; // Loop specific

			// Loop through each function to call in the queue
			while ((item = queue.shift())) {
				// Call the function, apply the arguments and store the result for the next call
				result = result[item.fn].apply(result, item.args);
			}

			// Always return the current instance
			return that;
		}

		// Create a dummy function to fake the chaining
		function dummy(fn) {
			return function() {
				// The dummy function just store the arguments received
				// These arguments will be passed on release time
				queue.push({ fn: fn, args: arguments });

				// Return the release function to continue the (fake) chaining
				return this;
			};
		}

		// Loop through each method currently available in the prototype
		for (fn in this.constructor.prototype) {
			// Process only functions
			if (typeof this.constructor.prototype[fn] !== "function") { continue; }

			// Add a dummy function having the same method's name
			// The purpose is to keep the chaining but fake it
			release[fn] = dummy(fn);
		}

		// We can release automagically
		switch (typeof arguments[0]) {
			case "string":
				// Automatically release when received this event
				this.on(arguments[0], release);
			break;

			case "number":
				// Automatically release in x milliseconds
				window.setTimeout(release, arguments[0]);
			break;
		}

		// Return the release function having the same properties as the prototype
		return release;
	}, // end of wait()


	/**
	 * Get or set the width of the player
	 *
	 * @param {number} value The new width to apply.
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {undefined}
	 * @return {number} Return the width of the player.
	 */
	width: function width(value) {
		return this.size("width", value);
	} // end of width()
}); // end of fab.extend()


// Create getters and setters
(function() {
	var
		properties = getterProperties.split(" "), // All of the properties
		property, // Loop specific
		obj = {}; // Will be used to extend fabuloos' prototype

	// Create a closure for getter/setter on a property
	function accessor(property) {
		var fn = function() {
			return this[arguments.length ? "set" : "get"](property, arguments[0]);
		};

		// Set a flag to later prevent set() to call fn() indefinitely
		fn.accessor = true;
		return fn;
	}

	// Loop through all properties
	while ((property = properties.shift())) {
		// Create an accessor only if not already created manually
		if (!fab.prototype[property]) {
			obj[property] = accessor(property);
		}
	} // end of while

	// Extend fabuloos' prototype with these methods!
	fab.extend(obj);
}());


// Expose
window.fabuloos = window.fab = fab;