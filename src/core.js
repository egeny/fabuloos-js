/*jshint newcap: false */
/*global Renderer */

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
function fab(config) {
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
		id = typeof element === "string" ? element.replace("#", "") : element.id,

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
} // end of fab()


/*!
 * A RegExp used to detect the presence of "_super" in a function's content
 * This RegExp will be used to check if we have to create a facade for a method when inheriting
 * @type {RegExp}
 */
var rSuper = /xyz/.test(function() { "xyz"; }) ? /\b_super\b/ : /.*/;


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


/**
 * Extend some objects or the fabuloos' prototype
 * It will simulate inheritance by giving access to this._super.
 * Be careful when passing more than two arguments since this method
 * add some properties from the last argument, to the first : obj1 <- obj2 <- obj3.
 * @api dev
 *
 * @param {object} obj The object literal to merge to the prototype
 * @return {undefined} Return nothing.
 *
 * @param {object} ... The objects literal to merge together
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
fab.extend = function extend(obj) {
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
	 * @api dev
	 * @type {array}
	 */
	instances: [],


	/**
	 * An unique identifier for this class.
	 * Used to link a DOM element to a JS object.
	 * @api dev
	 * TODO: XXX/MOVE
	 */
	expando: "fabuloos" + (+new Date()),


	/**
	 * A collection of regexp used to split and trim
	 * @static
	 * @type RegExp
	 * TODO: XXX/MOVE
	 */
	rSplit: /\s+/,
	rTrim: /^\s+|\s+$/g,


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
});


// Extend the fabuloos' prototype
fab.extend({
	/**
	 * Initialize an instance
	 * This method exists so you can extend it and handle specific cases in your plugin.
	 * Calling this method on an existing instance will reset it.
	 * @api dev
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

		// Define an hash for the renderers' configuration
		this._config = {};

		// Define the index for this instance in the instances' cache
		this._index = fab.instances.push(this) - 1;

		// Define the default supported renderers (may be updated when setting the config)
		this._renderers = Renderer.supported;

		/*!
		 * Use a closure to create an event trigerrer
		 * Used when a renderer have to trigger an event on this instance
		 * The "this" keyword will be corrected
		 */
		this._triggerer = (function(instance) {
			return function trigerrer() {
				return instance.trigger.apply(instance, arguments);
			};
		}(this));

		// Define an UID for this instance (used to define a default ID when needed)
		this._uid = ++fab.UID;

		// Try to find the element to base on
		this.element(config);

		// Set the rest of the config (and allow chaining)
		//return this.set(config);
		return this;
	}, // end of init()


	/**
	 * Destroy the instance
	 * Will restore the initial element and remove the instance from the cache.
	 *
	 * @param {undefined}
	 * @return {null}
	 */
	destroy: function destroy() {
		var instance, i = this._index; // Loop specific

		// Restore the old element (if any)
		this.restore();

		// Remove this instance from the caches
		fab.instances.splice(this._index, 1);

		// Correct the indexes of the instances following the one we just removed
		while ((instance = fab.instances[i])) {
			instance._index = i++;
		}

		// It is more convenient to return null (end chaining)
		return null;
	}, // end of destroy()


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
	 * @param {object} config The configuration to apply.
	 *   To define which element to base on you must provide an `element` property.
	 *   Its value can be the same as previous signatures (string or Element).
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
			elt = config ? config.element || config : {},
			id  = typeof elt === "string" ? elt.replace("#", "") : elt.id;

		// If we are changing the element, restore the old one
		if (this._old) {
			this.restore();
		}

		this._id  = id || "fabuloos-" + this._uid; // Set the new id or use the default setted by #restore()
		this._old = this._element = elt.nodeName ? elt : document.getElementById(id); // Set the current element

		// An audio or video element was found, try to read its config
		/*if (this.element && /audio|video/i.test( this.element.nodeName )) {
			// Watch for defined attributes
			for (count = this.element.attributes.length; i < count; i++) {
				property = this.element.attributes[i].name;
				value    = this.element.getAttribute( property ); // Use getAttribute to handle browser vendor specific attribute

				// Don't override if the property already exists
				if (!(property in config) && value) {
					_config[property] = value;
				}
			}
		}*/

		return this; // Chaining
	}, // end of element()


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
		this._id  = "fabuloos-" + this._uid;
		this._old = this._element = null;

		return this; // Chaining
	} // end of restore()
}); // end of fab.extend()

// Expose
window.fabuloos = window.fab = fab;

/**
 * Exception class
 * @constructor
 *
 * @params {number} code The error code to create
 *
 * @returns {Exception} A new Exception instance
 */
function Exception( code ) {
	this.name = "fabuloos error";
	this.code = code;

	// Loop through each property to find the static var related to this code
	for (var prop in Exception) {
		if (Exception[prop] === code) {
			this.message = prop;
		}
	}
} // end of Exception constructor

Exception.prototype = new Error(); // Inherit from Error
Exception.prototype.constructor = Exception; // Don't forget to correct the constructor

// Mimic the DOMException error codes
Exception.NOT_FOUND_ERR = 8;
Exception.SYNTAX_ERR    = 12;

// Expose
fab.Exception  = Exception;