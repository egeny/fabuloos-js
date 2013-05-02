/*global Renderer */

// Expose
window.fabuloos = window.fab = fab;
window.Fabuloos = window.Fab = Fab;

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
	while (id && (instance = Fab.instances[i++])) {
		if (instance._.id === id) {
			return instance;
		}
	}

	// No instance found, create a new one
	return new Fab(config);
} // end of fab()


/**
 * An unique identifier for this class.
 * Used to link a DOM element to a JS object.
 * @api dev
 * TODO: XXX/MOVE
 */
fab.expando = "fabuloos" + (+new Date());


/**
 * A collection of regexp used to split and trim
 * @static
 * @type RegExp
 * TODO: XXX/MOVE
 */
fab.rSplit = /\s+/;
fab.rTrim  = /^\s+|\s+$/g;


/**
 * The current script's version (http://semver.org)
 * @type {string}
 * TODO: Fab should have access too
 */
fab.version = "@VERSION";


/**
 * The base Fabuloos class
 * @see #fab() for signatures
 */
function Fab(config) {
	this.init(config);
} // end of Fab()


/**
 * A cache for all fabuloos' instances
 * @api dev
 */
Fab.instances = [];


/**
 * A RegExp used to detect the presence of "_super" in a function's content
 * This RegExp will be used to check if we have to create a facade for a method when inheriting
 * @type {RegExp}
 */
var rSuper = /xyz/.test(function() { "xyz"; }) ? /\b_super\b/ : /.*/;


/**
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
 * Extend the Fabuloos' prototype with a given object literal.
 * It will simulate inheritance by giving access to this._super.
 * @api dev
 *
 * @param {object} obj The object literal to merge to the prototype
 * @return {undefined} Return nothing.
 *
 * @example
 *   Fab.extend({
 *     play: function() { console.log("First play"); }
 *   });
 *
 *   Fab.extend({
 *     play: function() {
 *       console.log("Second play");
 *       this._super();
 *     }
 *   });
 *
 *   (new Fab()).play(); // "Second play" then "First play" 
 */
Fab.extend = function extend(obj) {
	// Loop through each property to extend
	for (var prop in obj) {
		// Override the prototype's value with the new value or a facade function if necessary
		Fab.prototype[prop] = (typeof obj[prop] === "function" && rSuper.test(obj[prop])) ? createFacade(obj[prop], Fab.prototype[prop]) : obj[prop];
	}
}; // end of Fab.extend()


// Extend the prototype
Fab.extend({
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
		if (this._ && this._.index !== undefined) {
			this.destroy();
		}

		// Declare a private space (will reset the existing one if any)
		this._ = {
			// Define the index for this instance in the instances' cache
			index: Fab.instances.push(this) - 1,

			// Define the default supported renderers (may be updated when setting the config)
			renderers: Renderer.supported
		};

		// Try to find the element to base on
		this.element(config);

		// Use a closure to prepare a handleManager to correct the "this" keyword when receiving an event from a renderer
		/*this.handleManager = (function( instance ){
			return function() {
				return instance.trigger.apply( instance, arguments );
			};
		}( this ));*/

		// Set the rest of the config (and allow chaining)
		return this.set(config);
	}, // end of init()


	/**
	 * Destroy the instance
	 * Will restore the initial element and remove the instance from the cache.
	 *
	 * @param {undefined}
	 * @return {null}
	 */
	destroy: function destroy() {
		// Restore the old element (if any)
		this.restore();

		// Remove this instance from the caches
		Fab.instances.splice(this._.index, 1);

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
		// Act as getter if there is no arguments
		if (config === undefined) {
			return this._.element;
		}

		var
			// @see #fab()
			elt = config ? config.element || config : {},
			id  = typeof elt === "string" ? elt.replace("#", "") : elt.id;

		// If we are changing the element, restore the old one
		this.restore();

		this._.id  = id || this._.id; // Set the new id or use the default setted by #restore()
		this._.old = this._.element = elt.nodeName ? elt : document.getElementById(id); // Set the current element

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
		// Replace the element with the old one if possible
		if (this.element && this._.element !== this._.old) {
			this._.element.parentNode.replaceChild(this._.old, this._.element);
		}

		// Set a default id since this instance isn't related to any element
		this._.id  = "fabuloos-" + (Fab.instances.length + 1);
		this._.old = this._.element = null;

		return this; // Chaining
	} // end of restore()
}); // end of Fab.extend()
