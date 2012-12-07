// Tracks polyfill
(function( player ) {

	// Use JavaScript script mode
	"use strict";

	/**
	 * The base Item class
	 * @abstract @constructor
	 *
	 * @returns {Item} A new Item instance
	 */
	function Item() {} // end of Item()


	/**
	 * The base List class
	 * @abstract @constructor
	 *
	 * @returns {List} A new List instance
	 */
	function List() {} // end of List()


	/**
	 * Create a filter closure
	 * @static @function
	 *
	 * @params filter The filter to pass to the filter function
	 *
	 * @returns {function} Return a closure used to filter
	 */
	List.createFilter = function( filter ) {
		return function() {
			var args = Array.prototype.slice.call( arguments ); // Convert the arguments to Array
			args.unshift( filter ); // Prepend the original filter

			return this.get.apply( this, args ); // Filter!
		};
	}; // end of createFilter()


	/**
	 * Create the filters methods in the prototype
	 * @static @function
	 *
	 * @params filters The methods and filters to create
	 */
	List.createFilters = function( filters ) {
		for (var method in filters) {
			this.prototype[method] = List.createFilter( filters[method] );
		}
	};


	/**
	 * Create a shorthand closure
	 * @static @function
	 *
	 * @params method The shorthand method to create
	 *
	 * @returns {function} Retunr a closure used to launch the shorthan method on the tracks
	 */
	List.createShorthand = function( method ) {
		return function() {
			var
				// Retrieve the tracks (or unique track)
				tracks = this.get.apply( this, arguments ),
				i = 0, count; // Loop specific

			// Do we have to iterate through a TrackList?
			if (tracks.length) {
				// Loop through each tracks
				for (count = tracks.length(); i < count; i++) {
					// Get the single track and launch the method on it
					tracks.get( i )[method]();
				}
			} else {
				// Single track, just launch the method on it
				tracks[method]();
			}
		};
	}; // end of createShorthand


	/**
	 * Create the shorthands methods in the prototype
	 * @static @function
	 *
	 * @params shorthands The methods to create
	 */
	List.createShorthands = function( shorthands ) {
		for (var method in shorthands) {
			this.prototype[shorthands[method]] = List.createShorthand( shorthands[method] );
		}
	};


	/**
	 * List initialization
	 * @function
	 *
	 * @returns {object} The initialized instance
	 */
	List.prototype.init = function() {
		var list = []; // The internal list

		/**
		 * Add an item to the list
		 * @function
		 *
		 * @params {Item} The item to add. You can add multiple items at once by providing multiple arguments.
		 *
		 * @example
		 *   <code>
		 *     list.add( new Item ) // Add a new item
		 *     list.add( new Item, new Item, new Item ) // Add three new items
		 *   </code>
		 */
		this.add = function() {
			// Loop through arguments to add Item to the internal list
			for (var i = 0, count = arguments.length; i < count; i++) {
				// Allow only Item instances
				if (arguments[i] instanceof this.constructor.item) {
					list.push( arguments[i] );
				}
			}
		}; // end of add()


		/**
		 * Delete one or more items
		 * @function
		 *
		 * @params {undefined|number|Item} item The item to delete from the list.
		 *   Might be undefined (will reset the list), a number (will be used as index) or an item (will search for it)
		 */
		this.del = function( item ) {
			if (!item) {
				// No argument, we will reset all the list
				this.length( 0 );
			} else if (typeof item === "number") {
				// The argument is a number, simply drop the index
				list.splice( item, 1 );
			} else if (item instanceof Item) {
				// The argument is an Item instance, look for it and removes it
				var
					tmp = [], // The new list
					i = 0, count = list.length; // Loop specific

				for (; i < count; i++) {
					// Keeps all items except the one we're trying to remove
					if (list[i] !== item) {
						tmp.push( list[i] );
					}
				}

				// Override the old list with the new one
				list = tmp;
			}
		}; // end of del()


		/**
		 * Get a list of items or a single item, depending on the filter
		 * @function
		 *
		 * @params {undefined|number|object} filter The filter to apply when retrieving the items
		 *   Might be undefined (will return the whole list), a number (will be used as an index to retrieve the item),
		 *   or an object (will parse each property to match with each items).
		 *   Multiple arguments can be provided, the function will be called recursively.
		 *
		 * @returns {List|Item|undefined} Can return a List or an unique item.
		 *
		 * @example
		 *   <code>
		 *     list.get() // Will return the whole list
		 *     list.get( 0 ) // Will return the first item
		 *     list.get({ foo: "bar" }) // Will return a list of matching items
		 *     list.get({ foo: "bar" }, { baz: "qux" }, 0) // Will return the first item if some match
		 *   </code>
		 */
		this.get = function( filter ) {
			var
				result,
				i = 0, count; // Loop specific

			// Add some sugar, handle multiple arguments (will call recursively)
			if (arguments.length > 1) {
				// Start by working on the current instance
				result = this;

				// Loop through arguments, while result have items to filter on
				for (count = arguments.length; i< count && result.length && result.length(); i++) {
					// Filter the current item, then re-filter on the result
					result = result.get( arguments[i] );
				}

				// Return the recusively filtered result (may be List or Item instance)
				return result;
			}

			// No filter means act like a getter
			if (!filter) {
				return this; // Return the whole List instance
			} else if (typeof filter === "number") {
				// If the filter is a number, return the item of the list associated to the index
				return list[filter];
			} else if (typeof filter === "object") {
				// If the filter is an object, prepare to filter according to this object
				var match, prop, value; // Loop specific

				// Prepare the return value (always a List)
				result = new this.constructor();

				// Loop throught the items to find the one matching
				for (i = 0, count = list.length; i < count; i++) {
					match = false; // Initialize the match flash

					for (prop in filter) {
						// Retrieve the item's value for this property, may have to call a getter
						value = typeof list[i][prop] === "function" ? list[i][prop]() : list[i][prop];
						match = filter[prop] === value; // Try to match the value and the filter's value for this property

						// If this property doesn't match, don't bother trying the others
						if (!match) {
							break;
						}
					} // end of for

					// If we have a match, save this item reference to the result list
					if (match) {
						result.add( list[i] );
					}
				} // end of for

				return result;
			}
		}; // end of get()


		/**
		 * Get or set the number of item in the list. Act as a getter without arguments.
		 * @function
		 *
		 * @params {number} [length=undefined] The number of item to keep
		 *
		 * @returns {number} Return the number of item in the list
		 */
		this.length = function( length ) {
			return typeof length === "number" ? (list.length = length) : list.length;
		}; // end of length()


		/**
		 * Replace an item
		 * @function
		 *
		 * @params {number} The index of the item to replace
		 * @params {Item} The new item
		 */
		this.set = function( index, item ) {
			if (typeof index === "number" && item instanceof this.constructor.item) {
				list[index] = item;
			}
		}; // end of set()

	}; // end of init()

	// The kind of item accepted in the list
	List.item = Item;





	/**
	 * TODO
	 */
	function Track( kind, label, language ) {
		var
			cues       = new TrackCueList(),
			activeCues = new TrackCueList();

		// TODO
		//oncuechange

		// Define the default mode to disabled
		this.mode = Track.DISABLED;

		// Creating getters for readonly properties
		this.kind       = function() { return kind; };
		this.label      = function() { return label; };
		this.lang       = function() { return language; };
		this.language   = this.lang; // lang() is more convenient but keep language() as it is standard
		this.cues       = function() { return cues; };
		this.activeCues = function() { return activeCues; };

		/**
		 * TODO
		 */
		this.addCue = function() {
			return cues.add.apply( cues, arguments );
		}; // end of addCue()


		/**
		 * TODO
		 */
		this.removeCue = function( cue ) {
			return cues.del( cue );
		}; // end of removeCue()

	} // end of Track

	Track.prototype = new Item(); // Inherit from Item
	Track.prototype.constructor = Track; // Don't forget to correct the constructor

	// Statically define the tracks modes
	Track.DISABLED = 0;
	Track.HIDDEN   = 1;
	Track.SHOWING  = 2;


	// Add some useful functions to the Track's prototype
	Track.prototype = {
		disable: function() {
			this.mode = Track.DISABLED;
		},

		hide: function() {
			this.mode = Track.HIDDEN;
		},

		show: function() {
			this.mode = Track.SHOWING;
		}
	};


	/**
	 * TODO
	 */
	function TrackList() {
		this.init(); // Initialize the list

		// TODO
		//onaddtrack
		//onremovetrack
	} // end of TrackList()

	TrackList.item = Track; // The kind of item accepted in the list
	TrackList.prototype = new List(); // Inherit from Renderer
	TrackList.prototype.constructor = TrackList; // Don't forget to correct the constructor

	// Retrieve the static references for filters and shorthands creation (more convenient)
	TrackList.createFilters    = List.createFilters;
	TrackList.createShorthands = List.createShorthands;

	// Create the filters in the prototype
	TrackList.createFilters({
		showing:  { mode: Track.SHOWING },
		hidden:   { mode: Track.HIDDEN },
		disabled: { mode: Track.DISABLED },

		subtitles:    { kind: "subtitles" },
		captions:     { kind: "captions" },
		descriptions: { kind: "descriptions" },
		chapters:     { kind: "chapters" },
		metadata:     { kind: "metadata" },
		functions:    { kind: "functions" }
	});

	// Create the shorthands in the prototype
	TrackList.createShorthands(["disable", "hide", "show"]);


	function TrackCue() {}
	function TrackCueList() {}


	player.Track        = Track;
	player.TrackList    = TrackList;
	player.TrackCue     = TrackCue;
	player.TrackCueList = TrackCueList;

}( fabuloos )); // end of Tracks polyfill
