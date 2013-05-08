/**
 * The base Item class
 * @constructor
 *
 * @returns {Item} A new Item instance
 */
function Item() {} // end of Item constructor


/**
 * The base List class
 * @constructor
 *
 * @returns {List} A new List instance
 */
function List() {} // end of List constructor


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
}; // end of createFilters()


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
}; // end of createShorthand()


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
}; // end of createShorthands()


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
		if (item === undefined) {
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
		if (filter === undefined) {
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
	 * Retrieve the index of an item
	 * @function
	 *
	 * @params {Item} The item to look for
	 *
	 * @returns {undefined|number} Return undefined (if the arguments isn't an instance of Item) or the index of the item
	 *
	 * @throws {Exception} Throw a NOT_FOUND_ERR if the item wasn't found
	 */
	this.index = function( item ) {
		// Makes sure we're looking for an Item
		if (!(item instanceof this.constructor.item)) {
			return;
		}

		// Look for the index
		// The "continue" is useless but needed for lint
		for (var i = 0, count = list.length; i < count && list[i] !== item; i++) { continue; }

		// Throw a NOT_FOUND_ERR exception if the index wasn't found
		if (i === count) {
			throw new fab.Exception( fab.Exception.NOT_FOUND_ERR );
		}

		// Return the index
		return i;
	}; // end of item();


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
 * The Track class
 * @constructor
 *
 * @param {string} kind The kind of track to create
 * @param {string} [label=""] The label of the track
 * @param {string} [lang=""] The language of the track
 *
 * @returns {Track} A new Track instance
 */
function Track( kind, label, lang ) {
	// A track must have a kind
	if (!kind) {
		throw new fab.Exception( fab.Exception.SYNTAX_ERR );
	}

	// Makes sure we have a label and a lang
	label = label || "";
	lang  = lang  || "";

	var
		cues       = new TrackCueList(),
		activeCues = new TrackCueList();

	// TODO
	//this.oncuechange

	// Define the default mode to hidden
	this.mode = Track.HIDDEN;

	// Creating getters for readonly properties
	this.kind       = function() { return kind; };
	this.label      = function() { return label; };
	this.lang       = function() { return lang; };
	this.language   = this.lang; // lang() is more convenient but keep language() as it is standard
	this.cues       = function() { return cues; };
	this.activeCues = function() { return activeCues; };

	/**
	 * Add a cue to the list of cues.
	 * Implementation of http://dev.w3.org/html5/spec/media-elements.html#dom-texttrack-addcue
	 * @function
	 *
	 * @params {TrackCue} The cue to add. Might be multiple arguments.
	 */
	this.addCue = function() {
		for (var i = 0, count = arguments.length; i < count; i++) {
			// Ignore bad arguments
			if (!(arguments[i] instanceof Item)) { continue; }

			// Try to retrieve on delete the item
			try {
				cues.del( cues.index( arguments[i] ) );
			} catch (e) {}

			// Define the cue's track property to this track
			arguments[i].track = this;

			// Add the cue to the cue list
			cues.add( arguments[i] );
		}
	}; // end of addCue()


	/**
	 * Remove a cue to the list of cues.
	 * Implementation of http://dev.w3.org/html5/spec/media-elements.html#dom-texttrack-removecue
	 * @function
	 *
	 * @params {TrackCue} The cue to remove.
	 *
	 * @throws {Exception} Throw an NOT_FOUND_ERR if the cue wasn't found
	 */
	this.removeCue = function( cue ) {
		// Skip bad argument
		if (!(cue instanceof Item )) { return; }

		try {
			cues.del( cues.index( cue ) );
		} catch (e) {
			throw e;
		}
	}; // end of removeCue()

} // end of Track constructor

Track.prototype = new Item(); // Inherit from Item
Track.prototype.constructor = Track; // Don't forget to correct the constructor

// Statically define the tracks modes
Track.DISABLED = 0;
Track.HIDDEN   = 1;
Track.SHOWING  = 2;


// Add some useful functions to the Track's prototype
Track.prototype = {
	/**
	 * Tells if the track is active (not disabled)
	 * @function
	 *
	 * @return {boolean} Return false if the track is disabled (mode to Track.DISABLED), otherwise return true
	 */
	active: function() {
		return this.mode !== Track.DISABLED;
	}, // end of active()


	/**
	 * Disable the track (set its mode to Track.DISABLED)
	 * @function
	 */
	disable: function() {
		this.mode = Track.DISABLED;
	}, // end of disable()


	/**
	 * Tells if the track is disabled
	 * @function
	 *
	 * @return {boolean} Return true if the track is disabled (mode to Track.DISABLED), otherwise return false
	 */
	disabled: function() {
		return this.mode === Track.DISABLED;
	}, // end of disable()


	/**
	 * Hide the track (set its mode to Track.HIDDEN)
	 * @function
	 */
	hide: function() {
		this.mode = Track.HIDDEN;
	}, // end of hide()


	/**
	 * Tells if the track is hidden
	 * @function
	 *
	 * @return {boolean} Return true if the track is hidden (mode to Track.HIDDEN), otherwise return false
	 */
	hidden: function() {
		return this.mode === Track.HIDDEN;
	}, // end of disable()


	/**
	 * Show the track (set its mode to Track.SHOWING)
	 * @function
	 */
	show: function() {
		this.mode = Track.SHOWING;
	}, // end of show()


	/**
	 * Tells if the track is showing
	 * @function
	 *
	 * @return {boolean} Return true if the track is showing (mode to Track.SHOWING), otherwise return false
	 */
	showing: function() {
		return this.mode === Track.SHOWING;
	} // end of disable()
}; // end of Track.prototype


/**
 * The TrackList class
 * @constructor
 *
 * @returns {TrackList} A new TrackList instance
 */
function TrackList() {
	this.init(); // Initialize the list

	// TODO
	//this.onaddtrack
	//this.onremovetrack
} // end of TrackList constructor

TrackList.item = Track; // The kind of item accepted in the list
TrackList.prototype = new List(); // Inherit from List
TrackList.prototype.constructor = TrackList; // Don't forget to correct the constructor

// Retrieve the static references for filters and shorthands creation (more convenient)
TrackList.createFilters    = List.createFilters;
TrackList.createShorthands = List.createShorthands;

// Create the filters in the prototype
TrackList.createFilters({
	active:   { active:   true },
	disabled: { disabled: true },
	hidden:   { hidden:   true },
	showing:  { showing:  true },

	subtitles:    { kind: "subtitles" },
	captions:     { kind: "captions" },
	descriptions: { kind: "descriptions" },
	chapters:     { kind: "chapters" },
	metadata:     { kind: "metadata" }
});

// Create the shorthands in the prototype
TrackList.createShorthands(["disable", "hide", "show"]);


/**
 * The TrackCue class
 * @constructor
 *
 * @returns {TrackCue} A new TrackCue instance
 */
function TrackCue( startTime, endTime, text ) {
	this.track       = null;

	this.id          = "";
	this.startTime   = startTime;
	this.endTime     = endTime;
	this.pauseOnExit = false;
	this.vertical    = TrackCue.DIRECTION.HORIZONTAL;
	this.snapToLines = true;
	this.line        = -1;
	this.position    = 50;
	this.size        = 100;
	this.align       = TrackCue.ALIGN.MIDDLE;
	this.text        = text || "";

	// TODO
	//this.onenter;
	//this.onexit;
} // end of TrackCue constructor

TrackCue.prototype = new Item(); // Inherit from Item
TrackCue.prototype.constructor = Track; // Don't forget to correct the constructor


/**
 * An hash of possible alignments
 * @static
 * @type {object}
 */
TrackCue.ALIGN = {
	START:  "start",
	MIDDLE: "middle",
	END:    "end",
	LEFT:   "left",
	RIGHT:  "right"
};


/**
 * An hash of possible directions
 * @static
 * @type {object}
 */
TrackCue.DIRECTION = {
	HORIZONTAL:    "",
	VERTICALLEFT:  "rl",
	VERTICALRIGHT: "lr"
};


/**
 * Return a document fragment containing the cue's text.
 * Still WIP since it must implement WebVTT's DOM construction (see http://dev.w3.org/html5/webvtt/#webvtt-cue-text-dom-construction-rules)
 * @function
 *
 * @returns {DocumentFragment}
 */
TrackCue.prototype.getCueAsHTML = function() {
	var
		fragment  = document.createDocumentFragment(),
		container = document.createElement("p");

	container.innerHTML = this.text;
	fragment.appendChild( container );

	return fragment;
}; // end of getCueAsHTML()


/**
 * The TrackCueList class
 * @constructor
 *
 * @returns {TrackCueList} A new TrackCueList instance
 */
function TrackCueList() {
	this.init(); // Initialize the list

	/**
	 * Retrieve a cue by its ID
	 * @function
	 *
	 * @params {string} id The ID of the cue to retrieve
	 *
	 * @returns {TrackCue|null} Return the TrackCue or null if it wasn't found
	 */
	this.getCueById = function( id ) {
		var result = id ? this.get({ id: id }, 0) : null;
		return result instanceof TrackCue ? result : null;
	}; // end of getCueById()

} // end of TrackCueList constructor

TrackCueList.item = TrackCue; // The kind of item accepted in the list
TrackCueList.prototype = new List(); // Inherit from List
TrackCueList.prototype.constructor = TrackCueList; // Don't forget to correct the constructor


// Expose
fab.Item = Item;
fab.List = List;

fab.Track        = Track;
fab.TrackList    = TrackList;
fab.TrackCue     = TrackCue;
fab.TrackCueList = TrackCueList;


/**
 * TODO
 */
function cycle() {
	var
		currentTime = this.currentTime(),
		tracks      = this.tracks.active(),
		i, count = tracks.length(), track, // Loop specific
		j, kount, cue; // Loop specific

	// Loop through each active tracks
	for (i = 0; i < count; i++ ) {
		track = tracks.get( i );

		// Loop through each active cues to disable the outdated
		for (j = 0, kount = track.activeCues().length(); j < kount; j++) {
			cue = track.activeCues().get( j );

			if (currentTime > cue.endTime) {
				// Remove this cue from the activeCues list
				track.activeCues().del( j );

				// FIXME: temporary dispatch a exitcue event
				this.trigger({
					type: "exitcue",
					cue: cue
				});

				// TODO
				//if (cue.onexit) {
					//cue.onexit.call( this );
				//} // end of if (cue.onexit)
			} // if (currentTime > cue.endTime)
		}

		// Loop through each cues to find which one to activate
		for (j = 0, kount = track.cues().length(); j < kount; j++) {
			cue = track.cues().get( j );

			try {
				track.activeCues().index( cue );
				continue;
			} catch (e) {}

			if (currentTime >= cue.startTime && currentTime <= cue.endTime) {
				track.activeCues().add( cue );

				// FIXME: temporary dispatch a entercue event
				this.trigger({
					type: "entercue",
					cue: cue
				});

				// TODO
				//if (cue.onenter) {
					//cue.onenter.call( this );
				//}
			}
		} // end of for
	} // end of for
} // end of cycle()


// Extend the framework with new methods
Fab.extend({
	/**
	 * TODO
	 */
	init: function() {
		// Don't execute while extending
		if (fab.extending) {
			return;
		}

		// Initialize the main track list
		this.tracks = new fab.TrackList();

		// Continue initialization
		this._super.apply( this, arguments );
	}, // end of init()


	/**
	 * TODO
	 */
	config: function( config ) {
		var
			i, count, track, // Loop specific
			j, kount, cue;

		if (config && config.src) {
			this.tracks.del(); // Reset the tracklist when changing the source

			// We have some tracks in the config!
			if (config.tracks) {
				// Loop through tracks to add them
				for (i = 0, count = config.tracks.length; i < count; i++) {
					// Create the new track
					track = this.addTrack( config.tracks[i].kind, config.tracks[i].label, config.tracks[i].lang );

					// Loop through each cue to add them to the track
					for (j = 0, kount = config.tracks[i].cues.length; j < kount; j++) {
						cue = config.tracks[i].cues[j]; // More convenient :)
						track.addCue( new fab.TrackCue( cue.startTime, cue.endTime, cue.text ) );
					} // end of for
				} // end of for
			} // end of if (config.tracks)
		} // end of if (config.src)

		return this._super( config ); // Chaining
	}, // end of config()


	/**
	 * Add a track or a new track to the tracklist of the player.  Warning: breaks the chaining.
	 * @function
	 *
	 * @param {string|Track} kind The kind of track to create or an already created Track
	 * @param {string} [label=""] The label of the track
	 * @param {string} [lang=""] The language of the track
	 *
	 * @returns {Track} Return the added track
	 */
	addTrack: function( kind, label, lang ) {
		var track; // The track we'll add to the track list

		// Use a try/catch since creating a track without a "kind" may throw a SYNTAX_ERR exception
		try {
			track = kind instanceof fab.Track ? kind : new fab.Track( kind, label, lang );
		} catch(e) {
			throw e;
		}

		// Add the track to the list of tracks
		this.tracks.add( track );

		// Trigger a "addtrack" event and pass the new track to the event
		this.trigger({
			type: "addtrack",
			track: track
		});

		// Enable the cues' cycling function
		this.on( "timeupdate", cycle );

		// Return the created track
		return track;
	} // end of addTrack()

}); // end of fab.extend()
