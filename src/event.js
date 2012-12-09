// Event module
(function( player ) {

	// Use JavaScript script mode
	"use strict";

	/**
	 * Fix a given event to fit to the W3C standard in each browsers (abstraction)
	 * @private @function
	 *
	 * @param {event} event The event to fix
	 *
	 * @returns {event} The fixed event
	 */
	function fix( event ) {
		// This event is already fixed, don't bother
		if (event[player.expando]) {
			return event;
		}

		// Create a new Event object based on the original event using a custom class,
		// give the ability to define read-only properties (such as currentTarget)
		var
			key,
			originalEvent = event;
			event = player.Event( originalEvent );

		// Copy the original properties to the new event
		for (key in originalEvent) {
			// Copy only if the properties who aren't already defined (by the custom class)
			if (!event[key]) {
				event[key] = originalEvent[key];
			}
		}

		// Fix target property, if necessary
		if (!event.target) {
			event.target = event.srcElement || document;
		}

		return event;
	} // end of fix()


	/**
	 * Retrieve or prepare the handlers cache for an element or an object
	 * @private @function
	 *
	 * @param {node|object} element The element or object
	 * @param {boolean} [create=false] Do we have to create a new cache if doesn't exists?
	 *
	 * @returns Return the cache for the element
	 */
	function getCache( element, create ) {
		var id = element[ player.expando ]; // Try to retrieve the guid with the expando

		// Do we have to create a cache if don't exists?
		create = !!create;

		// The element is not expanded yet
		if (!id && create) {
			// Try to use the element's id or use a guid
			id = element[ player.expando ] = element.id || ++player.event.guid;

			// Prepare the cache
			player.event.cache[id] = {
				// Prepare the event types and handlers cache
				handlers: {},

				// Prepare the handleManager to correct the this keyword in IE
				handleManager: function( event ) {
					return handle.call( element, event );
				}
			};

			/**
			 * Register some default listener for custom events if is IE (old event behaviour)
			 * Beware of Opera which have both addEventListener and attachEvent
			 */
			if (!document.addEventListener && element.attachEvent) {
				// No need to provide handler, returnFalse will be used
				// The handle function will correct the event
				player.event.add( element, "dataavailable losecapture" );
			}
		}

		return player.event.cache[id];
	}


	/**
	 * Launch the registered handlers for the triggered event
	 * @private @function
	 *
	 * @param {event} event The event triggered
	 *
	 * @returns Return the value of the last handler executed or true if there where no handlers
	 */
	function handle( event ) {
		// Makes sure we have an event
		event = event || window.event;

		// Correct the event if it is a custom event (aka "unknown" events for IE)
		event = ((event.type === "dataavailable" || event.type === "losecapture") && event.originalEvent) ? event.originalEvent : event;

		// Fix the event
		event = fix(event);
		event.currentTarget = this;

		var
			cache = getCache( this ), // Get the handlers cache for this element
			handler, i = 0, // Loop specific
			handlers = cache ? (cache.handlers[ event.type ] || []) : [], // Get the cached handlers for this element
			returnValue = true;

		// Loop through handlers
		while ((handler = handlers[i++])) {
			// Execute the handler and get the return value
			returnValue = handler.call( this, event, handler.data );

			// Handle the case of handlers returning false
			if (returnValue === false) {
				event.preventDefault();
				event.stopPropagation();
			}

			// Stop this loop if immediate propagation is stopped
			if (event.isImmediatePropagationStopped()) {
				break;
			}
		}

		return returnValue;
	} // end of handle()


	/**
	 * A generic function that return false, used for callbacks
	 * @private @function
	 * @ignore
	 *
	 * @return {boolean} Return false
	 */
	function returnFalse() {
		return false;
	} // end of returnFalse()


	/**
	 * A generic function that return true, used for callbacks
	 * @private @function
	 * @ignore
	 *
	 * @returns {boolean} Return true
	 */
	function returnTrue() {
		return true;
	} // end of returnTrue()


	// Create an "event" namespace into the player (is independant)
	player.event = {

		/**
		 * The events handlers cache
		 * @type object
		 */
		cache: {},


		/**
		 * A GUID to mark that an element have handlers in the cache
		 * @type number
		 */
		guid: 0,


		/**
		 * Add an handler for the given event types on the given element
		 * @function
		 *
		 * @param {node|object} element The element on which to listen event (can be a node or an object)
		 * @param {string} types The event types (can be multiple, separated by a space) to listen
		 * @param {function} handler The function to launch when the event types are trigerred
		 * @param {object} data The data to pass when calling the listener
		 */
		add: function( element, types, handler, data ) {
			var
				cache = getCache( element, true ), // Get the handlers cache for this element
				type, i = 0; // Loop specific

			// Allow multiple events types separated by a space
			types = types.replace( player.rTrim, "" ).split( player.rSplit ); // Trim first to avoid bad splitting

			// Set a defaut handler in the case we don't need handler (custom events for IE)
			handler = handler || returnFalse;
			handler.data = data; // Save a reference to the data in this handler

			// Loop through each event types
			while ((type = types[i++])) {
				// Is there handlers for this type?
				if (!cache.handlers[type]) {
					// No, initialize
					cache.handlers[type] = [];

					/**
					 * We add only one listener for each types. We also have to use a closure (@see getCache)
					 * to correct the "this" keywork for IE. The private handle method will launch each listener
					 */

					// if DOM level 2 is supported, then use it
					if (element.addEventListener) {
						element.addEventListener( type, cache.handleManager, false );
					} else if (element.attachEvent) {
						// Microsoft's old events implementation
						element.attachEvent( "on" + type, cache.handleManager );
					}
				}

				// Cache the handler for this type
				cache.handlers[type].push( handler );
			} // end of while
		}, // end of add()


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
			types = types.replace( player.rTrim, "" ).split( player.rSplit ); // Trim first to avoid bad splitting

			// Loop through event types
			while ((type = types[i++])) {
				// Asking to remove a specific handler
				if (handler) {
					// Prepare a new handlers cache
					handlers = [];

					// Loop through the handlers cache to find the specific handler
					for (j = 0, count = cache.handlers[type]; j < count; j++) {
						// Keep the other handlers
						if (cache.handlers[type][j] !== handler) {
							handlers.push( cache.handler[type][j] );
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
				delete player.event.cache[element[ player.expando ]];

				// Remove the element's expando
				delete element[ player.expando ];
			}
		}, // end of remove()


		/**
		 * Trigger an event type on the given element
		 * @function
		 *
		 * @param {node|object} element The element on which to listen event (can be a node or an object)
		 * @param {string|object} event The event type or event object to trigger
		 *
		 * @return @see #handle
		 */
		trigger: function( element, event ) {
			event = typeof event === "string" ? player.Event( event ) : event;
			return handle.call( element, event );
		} // end of trigger()

	}; // end of event namespace


	// Bind static references
	player.bind    = player.event.add;
	player.unbind  = player.event.remove;
	player.trigger = player.event.trigger;
	player.attach  = player.event.attach;
	player.detach  = player.event.detach;


	// Abstract an event with a custom Event class.
	// This is a copy/paste of the jQuery's implementation (don't remake the awesome).
	// @see <a href="https://github.com/jquery/jquery/blob/master/src/event.js">jQuery's event source</a>
	player.Event = function( src ) {
		// Allow instantiation without the 'new' keyword
		if (!(this instanceof player.Event)) {
			return new player.Event( src );
		}

		// src is an Event object
		if (src && src.type) {
			this.originalEvent = src;
			this.type = src.type;

			// Events bubbling up the document may have been marked as prevented
			// by a handler lower down the tree; reflect the correct value.
			this.isDefaultPrevented = (src.defaultPrevented || src.returnValue === false || src.getPreventDefault && src.getPreventDefault()) ? returnTrue : returnFalse;
		} else {
			// src is just a string, create a blank event
			this.type = src;
		}

		// Create a timestamp if incoming event doesn't have one
		// Don't use Date.now() because of IE
		this.timeStamp = src && src.timeStamp || +new Date();

		// Mark the event as fixed
		this[ player.expando ] = true;
	};

	// This is the exact copy of the awesome jQuery.Event DOM 3 Events implementation
	// @see <a href="https://github.com/jquery/jquery/blob/master/src/event.js">jQuery's event source</a>
	// @see <a href="http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html">DOM Level 3 Events ECMAScript Binding</a>
	player.Event.prototype = {
		preventDefault: function() {
			this.isDefaultPrevented = returnTrue;

			var e = this.originalEvent;
			if (!e) {
				return;
			}

			// if preventDefault exists run it on the original event…
			if (e.preventDefault) {
				e.preventDefault();
			} else {
				// otherwise set the returnValue property of the original event to false (IE)
				e.returnValue = false;
			}
		},

		stopPropagation: function() {
			this.isPropagationStopped = returnTrue;

			var e = this.originalEvent;
			if (!e) {
				return;
			}

			// if stopPropagation exists run it on the original event…
			if (e.stopPropagation) {
				e.stopPropagation();
			}

			// otherwise set the cancelBubble property of the original event to true (IE)
			e.cancelBubble = true;
		},

		stopImmediatePropagation: function() {
			this.isImmediatePropagationStopped = returnTrue;
			this.stopPropagation();
		},

		isDefaultPrevented: returnFalse,
		isPropagationStopped: returnFalse,
		isImmediatePropagationStopped: returnFalse
	};

}( fabuloos )); // end of Event module
