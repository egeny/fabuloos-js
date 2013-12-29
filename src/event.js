var
	/**
	 * The list of accepted properties for an event
	 * @type {array}
	 */
	properties = "bubbles cancelable currentTarget eventPhase relatedTarget target timeStamp".split(" "),

	/**
	 * A collection of regexp used to split and trim
	 * @type {RegExp}
	 */
	rSplit = /\s+/,
	rTrim  = /^\s+|\s+$/g;


/*!
 * Fix a given event to fit to the W3C standard in each browsers (abstraction)
 *
 * @param {string|event} event The event to fix.
 * @return {fab.Event} The fixed event.
 */
function fix(event) {
	// This event is already fixed, don't bother
	if (event[fab.event.expando]) {
		return event;
	}

	var
		original = event,
		property, i = properties.length; // Loop specific

	// Create a new Event based on the original, gives the ability to define read-only properties
	event = new fab.Event(original);

	// Copy the accepted original's properties in the event
	while (i--) {
		property = properties[i];

		// Copy only if the property was set
		if (property in original) {
			event[property] = original[property];
		}
	}

	return event;
} // end of fix()


/*!
 * Launch the registered handlers for the triggered event
 *
 * @param {string|event} event The event triggered.
 * @return Return the value of the last handler executed or true if there were no handlers.
 */
function handle(event) {
	// Fix the event
	event = fix(event);
	event.currentTarget = this;

	var
		handler, // Loop specific
		handlers = fab.event.cache(this).handlers[event.type] || [], // Retrieve the handlers for this type
		result   = true;

	// Work on a copy of the cache
	handlers = handlers.slice(0);

	// Loop through the handlers
	while ((handler = handlers.shift())) {
		// Execute the handler and get the return value
		result = handler.call(this, event);

		// Handle the case of handlers returning false
		if (result === false) {
			event.preventDefault();
			event.stopPropagation();
		}

		// Stop this loop if immediate propagation is stopped
		if (event.isImmediatePropagationStopped()) { break; }
	} // end of while

	return result;
} // end of handle()


/*!
 * A generic function that return false, used for callbacks
 *
 * @param {undefined}
 * @return {boolean} Return false.
 */
function returnFalse() { return false; }


/*!
 * A generic function that return true, used for callbacks
 *
 * @param {undefined}
 * @returns {boolean} Return true.
 */
function returnTrue() { return true; }


// Create an "event" namespace into the framework (is independant)
fab.event = {
	/**
	 * The events handlers cache
	 * @type {object}
	 */
	_cache: {},


	/**
	 * Retrieve the handlers cache for an element or an object
	 * Will create a cache if the element doesn't have one yet.
	 *
	 * @param {element|object} element The element or object.
	 * @return Return the cache for the element.
	 */
	cache: function cache(element) {
		var id = element[fab.event.expando]; // Try to retrieve the uid with the expando

		// The element is not expanded yet
		if (!id) {
			// Use an UID to ad id
			id = element[fab.event.expando] = ++fab.event.uid;

			// Prepare the cache
			fab.event._cache[id] = {
				// Prepare the event types and handlers cache
				handlers: {},

				// Prepare the manager to makes sure we always have the right "this" keyword
				manager: function manager(event) {
					return handle.call(element, event);
				}
			};
		}

		return fab.event._cache[id];
	}, // end of cache()


	/**
	 * An unique identifier
	 * Used to link a DOM element to a JS object.
	 * @type {string}
	 */
	expando: "_fab-" + (+new Date()),


	/**
	 * Add an handler for the given event types on the given element
	 *
	 * @param {element|object} element The element on which to listen event (can be an element or an object).
	 * @param {string} types The event types (can be multiple, separated by a space) to listen.
	 * @param {function} handler The function to launch when the event types are trigerred.
	 * @return {undefined} Return nothing.
	 */
	on: function on(element, types, handler) {
		var
			cache = fab.event.cache(element),
			type; // Loop specific

		// Allow multiple events types separated by a space
		types = types.replace(rTrim, "").split(rSplit); // Trim first to avoid bad splitting

		// Loop through each event types
		while ((type = types.shift())) {
			// Is there handlers for this type?
			if (!cache.handlers[type]) {
				// No, initialize
				cache.handlers[type] = [];

				/*!
				 * We add only one listener for each types. We also have to use a closure (@see getCache)
				 * to correct the "this" keywork for IE. The private handle method will launch each listener
				 */

				// if DOM level 2 is supported, then use it
				if (element.addEventListener) {
					element.addEventListener(type, cache.manager, false);
				} else if (element.attachEvent) {
					// Microsoft's old events implementation
					element.attachEvent("on" + type, cache.manager);
				}
			}

			// Cache the handler for this type
			cache.handlers[type].push(handler);
		} // end of while
	}, // end of on()


	/**
	 * Remove an handler for the given types on the given elements
	 * @function
	 *
	 * @param {node|object} element The element on which to listen event (can be a node or an object)
	 * @param {string} [types=""] types The event types for which we want to remove event handlers.
	 *   Can be multiple (separated by a space) or empty to remove the handler for all events
	 * @param {function} [handler=undefined] handler The function attached to be removed, remove all handlers if not provided
	 */
	remove: function( element, types, handler ) {
		console.log("fab.event.remove");
		return;

		var
			cache = getCache( element ),
			type, i = 0, // Loop specific
			handlers, j, count; // Loop specific

		// Don't bother if there is no event registered for this element
		if (!cache) {
			return;
		}

		// No types provided, remove all types
		if (!types) {
			types = "";
			for (type in cache.handlers) {
				types += type + " ";
			}
		}

		// Allow multiple events types separated by a space
		types = types.replace( fab.rTrim, "" ).split( fab.rSplit ); // Trim first to avoid bad splitting

		// Loop through event types
		while ((type = types[i++])) {
			// Don't bother if there is no handlers for this type
			if (!cache.handlers[type]) {
				continue;
			}

			// Asking to remove a specific handler
			if (handler) {
				// Prepare a new handlers cache
				handlers = [];

				// Loop through the handlers cache to find the specific handler
				for (j = 0, count = cache.handlers[type].length; j < count; j++) {
					// Keep the other handlers
					if (cache.handlers[type][j] !== handler) {
						handlers.push( cache.handlers[type][j] );
					}
				}

				// Replace the old cache with the new one
				cache.handlers[type] = handlers;
			} else {
				// Asking to remove all handlers
				cache.handlers[type].length = 0;

				// But re-initialize the custom events handler for IE
				if (type === "dataavailable" || type === "losecapture") {
					cache.handlers[type].push( returnFalse );
				}
			} // end of if (handler)

			// Do we have to clean the handlers cache for this type?
			if (!cache.handlers[type].length) {
				// Delete this cache entry
				delete cache.handlers[type];

				// Remove the handle manager for this type
				if (element.removeEventListener) {
					element.removeEventListener(type, cache.handleManager, false);
				} else if (element.detachEvent) {
					element.detachEvent("on" + type, cache.handleManager);
				}
			} // end of if (!cache.handlers[type].length)
		} // end of while

		// Look if there is types left in the cache (to clean-up)
		types = false;
		for (type in cache.handlers) {
			types = true;
			break;
		}

		// If there is no events types left, clean the cache and the element
		if (!types) {
			// Remove this element from the cache
			delete fab.event.cache[element[ fab.expando ]];

			// Remove the element's expando
			delete element[ fab.expando ];
		}
	}, // end of remove()


	/**
	 * Trigger an event type on the given element
	 *
	 * @param {element|object} element The element triggering the event (can be a node or an object).
	 * @param {string} type The event type to trigger.
	 * @return {*} Return the value of the last handler executed or true if there were no handlers.
	 */
	trigger: function trigger(element, type) {
		return handle.call(element, type);
	}, // end of trigger()


	/**
	 * An UID to mark that an element have handlers in the cache
	 * @type {number}
	 */
	uid: 0
}; // end of fab.event


// Bind static references
fab.on      = fab.event.on;
fab.off     = fab.event.off;
fab.trigger = fab.event.trigger;


// Abstract an event with a custom Event class.
// This is a copy/paste of the jQuery's implementation (don't remake the awesome).
// @see <a href="https://github.com/jquery/jquery/blob/master/src/event.js">jQuery's event source</a>
fab.Event = function(src) {
	// Allow instantiation without the 'new' keyword
	if (!(this instanceof fab.Event)) {
		return new fab.Event(src);
	}

	// src is an Event object
	if (src && src.type) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = (src.defaultPrevented || src.defaultPrevented === undefined && src.getPreventDefault && src.getPreventDefault()) ? returnTrue : returnFalse;
	} else {
		// src is just a string, create a blank event
		this.type = src;
	}

	// Create a timestamp if incoming event doesn't have one
	// Don't use Date.now() because of IE
	this.timeStamp = src && src.timeStamp || +new Date();

	// Mark the event as fixed
	this[fab.event.expando] = true;
}; // end of fab.Event()


// This is the exact copy of the awesome jQuery.Event DOM 3 Events implementation
// @see <a href="https://github.com/jquery/jquery/blob/master/src/event.js">jQuery's event source</a>
// @see <a href="http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html">DOM Level 3 Events ECMAScript Binding</a>
fab.Event.prototype = {
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		// if preventDefault exists run it on the original event
		if (e && e.preventDefault) {
			e.preventDefault();
		}
	},

	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		// if stopPropagation exists run it on the original event
		if (e && e.stopPropagation) {
			e.stopPropagation();
		}
	},

	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	}
}; // end of fab.Event.prototype