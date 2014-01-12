/**
 * The base List class
 * @abstract @constructor
 */
function List() {}


// List can extend and will extend itself (statically)
List.extend = fab.extend;
List.extend(List, {
	/**
	 * Create a closure filtering the list with the given filter
	 *
	 * @param {object} filter The filter to pass to #get().
	 * @return {function} Return a closure calling #get() passing the filter.
	 */
	filter: function filter(_filter) {
		return function filter() {
			return this.get(_filter);
		};
	}, // end of filter()


	/**
	 * Create some filters methods in the prototype
	 *
	 * @param {object} filters The filters to create.
	 * @return {undefined} Return nothing.
	 */
	filters: function filters(_filters) {
		for (var method in _filters) {
			this.prototype[method] = this.filter(_filters[method]);
		}
	}, // end of filters()


	/**
	 * Create a closure calling the asked method on items
	 * The number of item will depend on the argument passed to the closure
	 * @see #get() for closure's signature
	 *
	 * @param {string} method The method name to launch on items.
	 * @return {function} Return a closure calling the method on the items of the list.
	 */
	shorthand: function shorthand(method) {
		return function shorthand(filter) {
			// Don't bother if we're trying to call an unknown method on the items
			if (!this.constructor.item.prototype[method]) { return; }

			var
				items = this.get(filter), // Get the items (may be all, none or just one)
				item, i = 0; // Loop specific

			// Do we have a list to iterate?
			if (items.length) {
				// Loop through
				while ((item = items.get(i++))) {
					item[method]();
				}
			} else if (item !== undefined) {
				// We found just one item so launch the method on it
				item[method]();
			}
		};
	}, // end of shorthand()


	/**
	 * Create some shorthands methods in the prototype
	 *
	 * @param {array} methods The methods to create.
	 * @return {undefined} Return nothing.
	 */
	shorthands: function shorthands(methods) {
		var method, i = 0; // Loop specific

		// Loop through received methods
		while ((method = methods[i++])) {
			this.prototype[method] = this.shorthand(method);
		}
	} // end of shorthands()
}); // end of List.extend(List)


// Extend the List's prototype
List.extend({
	/**
	 * Add an item to the list
	 *
	 * @param {Item} ... The item(s) to add.
	 * @return {List} Return the current instance to allow chaining.
	 */
	add: function add() {
		var
			list = this.list = this.list || [], // Makes sure we have an internal list
			i = 0, count = arguments.length; // Loop specific

		// Loop through items
		for (; i < count; i++) {
			// Only allow adding supported items
			if (arguments[i] instanceof this.constructor.item) {
				list.push(arguments[i]);
			}
		} // end of for

		return this; // Chaining
	}, // end of add()


	/**
	 * Delete one or more items
	 *
	 * @param {Item} item The item to delete.
	 * @return {List} Return the current instance to allow chaining.
	 *
	 * @param {number} index The item's index to delete.
	 * @return {List} Return the current instance to allow chaining.
	 *
	 * @param {undefined}
	 * @return {List} Return the current instance to allow chaining.
	 */
	del: function del(item) {
		var
			list = this.list = this.list || [], // Makes sure we have an internal list
			i = list.length; // Loop specific

		if (item === undefined) {
			// No argument, we will reset all the list
			list.length = 0;
		} else if (typeof item === "number") {
			// The argument is a number, simply drop the index
			list.splice(item, 1);
		} else if (item instanceof this.constructor.item) {
			// The argument is an Item instance, look for it and removes it
			// Loop through the list to find the ones to remove
			while (i--) {
				if (list[i] === item) {
					list.splice(i, 1); // Dump the item
					// Don't break since we may have more than one item occurence
				}
			} // end of while
		}

		return this; // Chaining
	}, // end of del()


	/**
	 * Get a list of items or a single item, depending on the filter
	 *
	 * @param {object} filter The filter to apply.
	 * @return {List} Return the list of item found.
	 *
	 * @param {number} index The item's index to look for.
	 * @return {Item|undefined} Return the item or `undefined` if there is no item for this index.
	 *
	 * @param {undefined}
	 * @return {List} Return the current list.
	 *
	 * @example
	 *   list.get() // Will return the whole list
	 *   list.get(0) // Will return the first item (or undefined if the list is empty)
	 *   list.get({ foo: "bar" }) // Will return the list of items having a property "foo" having "bar" as value
	 */
	get: function get(filter) {
		var
			list = this.list = this.list || [], // Makes sure we have an internal list
			i = 0, count = list.length, result, match, prop, value; // Loop specific

		// No filter means act like a getter
		if (filter === undefined) {
			return this; // Return the whole List instance
		} else if (typeof filter === "number") {
			// If the filter is a number, return the item of the list associated to the index
			return list[filter];
		} else if (filter && filter.constructor === Object) {
			// If the filter is an object, prepare to filter according to this object
			result = new this.constructor(); // Prepare the return value (always a List)

			// Loop throught the items to find the one matching
			for (; i < count; i++) {
				match = false; // Initialize the match flash

				// Loop through the filter's properties
				for (prop in filter) {
					// Retrieve the item's value (may have to call a function)
					value = typeof list[i][prop] === "function" ? list[i][prop]() : list[i][prop];
					match = filter[prop] === value; // Try to match the value against the filter's value

					// If this property doesn't match, don't bother trying the others
					if (!match) { break; }
				} // end of for

				// If we have a match, save this item reference to the result list
				if (match) {
					result.add(list[i]);
				}
			} // end of for

			return result;
		}
	}, // end of get()


	/**
	 * Retrieve the index of an item
	 *
	 * @param {Item} The item to look for.
	 * @return {number} Return the index of the item or -1 if item cannot be found.
	 */
	index: function index(item) {
		var
			list = this.list = this.list || [], // Makes sure we have an internal list
			i = list.length; // Loop specific

		// Don't bother if the item isn't a valid item
		if (!(item instanceof this.constructor.item)) { return -1; }

		// Look for the index
		// The "continue" is useless but needed for lint
		for (; i > -1 && list[i] !== item; i--) { continue; }

		return i;
	}, // end of index()


	/**
	 * Get or set the number of item in the list
	 *
	 * @param {undefined}
	 * @return {number} Return the number of item in the list.
	 *
	 * @param {number} length The number of item to keep.
	 * @return {number} Return the number of item in the list.
	 */
	length: function length(_length) {
		var list = this.list = this.list || []; // Makes sure we have an internal list
		return typeof _length === "number" ? (list.length = _length) : list.length;
	}, // end of length()


	/**
	 * Replace an item
	 *
	 * @param {number} index The index of the item to replace.
	 * @param {Item} item The new item.
	 * @return {List} Return the current instance to allow chaining.
	 */
	set: function set(index, item) {
		var list = this.list = this.list || []; // Makes sure we have an internal list
		if (typeof index === "number" && item instanceof this.constructor.item) {
			list[index] = item;
		}
	} // end of set()
}); // end of List.extend()


/**
 * The Track class
 * @constructor
 *
 * @param {string} kind The kind of track to create.
 * @param {string} label="" The label of the track.
 * @param {string} lang="" The language of the track.
 * @return {Track} A new Track instance.
 */
function Track(kind, label, lang) {
	if (!kind) {
		throw "A track must have a kind";
	}

	this.kind  = kind;
	this.label = label || "";
	this.lang  = lang  || "";
	this.cues       = new TrackCueList();
	this.activeCues = new TrackCueList(); // TODO: change name
} // end of Track()


// Track can extend and will extend itself (statically)
Track.extend = fab.extend;
Track.extend(Track, {
	/**
	 * The different modes supported
	 * @type {number}
	 */
	DISABLED: 0,
	HIDDEN:   1,
	SHOWING:  2
}); // end of Track.extend(Track)


// Extend Track's prototype
Track.extend({
	/**
	 * Check if the track is currently active
	 *
	 * @param {undefined}
	 * @return {boolean} Return false if the track is disabled (mode to Track.DISABLED).
	 */
	active: function active() {
		return this.mode !== Track.DISABLED;
	}, // end of active()


	/**
	 * Add a cue to the list of cues.
	 *
	 * @param {TrackCue} ... The cues to add.
	 * @return {Track} Return the current instance to allow chaining.
	 */
	add: function add() {
		var
			cues = fab.toArray(arguments), // Copy the received cues
			cue; // Loop specific

		// Loop through received cues
		while ((cue = cues.shift())) {
			// Ignore bad arguments
			if (!(cue instanceof TrackCue)) { continue; }

			// If this cue is already in the list, removed it
			this.cues.del(cue);

			// This cue now belongs to this track
			cue.track = this;

			// Add the cue to the list
			this.cues.add(cue);
		} // end while

		return this; // Chaining
	}, // end of add()


	/**
	 * Delete a cue to the list of cues.
	 *
	 * @param {TrackCue} cue The cue to delete.
	 * @return {Track} Return the current instance to allow chaining.
	 */
	del: function del(cue) {
		this.cues.del(cue);
		return this; // Chaining
	}, // end of del()


	/**
	 * Disable the track (set its mode to Track.DISABLED)
	 *
	 * @param {undefined}
	 * @return {Track} Return the current instance to allow chaining.
	 */
	disable: function disable() {
		this.mode = Track.DISABLED;
		return this; // Chaining
	}, // end of disable()


	/**
	 * Check if the track is currently disabled
	 *
	 * @param {undefined}
	 * @return {boolean} Return true if the track is disabled (mode to Track.DISABLED).
	 */
	disabled: function disabled() {
		return this.mode === Track.DISABLED;
	}, // end of disabled()


	/**
	 * Hide the track (set its mode to Track.HIDDEN)
	 *
	 * @param {undefined}
	 * @return {Track} Return the current instance to allow chaining.
	 */
	hide: function hide() {
		this.mode = Track.HIDDEN;
		return this; // Chaining
	}, // end of hide()


	/**
	 * Check if the track if currently hidden
	 *
	 * @param {undefined}
	 * @return {boolean} Return true if the track is hidden (mode to Track.HIDDEN).
	 */
	hidden: function hidden() {
		return this.mode === Track.HIDDEN;
	}, // end of hidden()


	/**
	 * The default mode for each tracks
	 * @type {number}
	 */
	mode: Track.HIDDEN,


	/**
	 * Show the track (set its mode to Track.SHOWING)
	 *
	 * @param {undefined}
	 * @return {Track} Return the current instance to allow chaining.
	 */
	show: function show() {
		this.mode = Track.SHOWING;
		return this; // Chaining
	}, // end of show()


	/**
	 * Check if the track is currently showing
	 *
	 * @param {undefined}
	 * @return {boolean} Return true if the track is showing (mode to Track.SHOWING).
	 */
	showing: function showing() {
		return this.mode === Track.SHOWING;
	} // end of showing()
}); //end of Track.extend()


/**
 * The Track class
 * @constructor
 */
function TrackList() {}


// The only allowed item in this list is Track
TrackList.item = Track;

TrackList.extend = fab.extend; // TrackList can extend itself and/or its prototype
TrackList.extend(TrackList, List); // Copy List's static methods in TrackList
TrackList.extend(List.prototype); // Copy List's prototype's methods in TrackList's prototype

// Create some filters in the prototype
TrackList.filters({
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

// Create some shorthands methods
TrackList.shorthands(["disable", "hide", "show"]);


/**
 * The TrackCue class
 * @constructor
 */
function TrackCue(start, end, text) {
	this.track       = null;

	this.id          = "";
	this.start       = start;
	this.end         = end;
	this.pauseOnExit = false;
	this.vertical    = TrackCue.DIRECTION.HORIZONTAL;
	this.snapToLines = true;
	this.line        = -1;
	this.position    = 50;
	this.size        = 100;
	this.align       = TrackCue.ALIGN.MIDDLE;
	this.text        = text || "";
} // end of TrackCue()


// TrackCue can extend and will extend itself (statically)
TrackCue.extend = fab.extend;
TrackCue.extend(TrackCue, {
	/**
	 * An hash of possible alignments
	 * @type {object}
	 */
	ALIGN: {
		START:  "start",
		MIDDLE: "middle",
		END:    "end",
		LEFT:   "left",
		RIGHT:  "right"
	},

	/**
	 * An hash of possible directions
	 * @type {object}
	 */
	DIRECTION: {
		HORIZONTAL:    "",
		VERTICALLEFT:  "rl",
		VERTICALRIGHT: "lr"
	}
}); // end of TrackCue.extend(TrackCue)


// Extend the TrackCue's prototype
TrackCue.extend(fab.event.api); // Add the event listener interface (on(), off() and trigger())
TrackCue.extend({
	/**
	 * Return a document fragment containing the cue's text.
	 * Still WIP since it must implement WebVTT's DOM construction (see http://dev.w3.org/html5/webvtt/#dfn-webvtt-cue-text-dom-construction-rules)
	 *
	 * @param {undefined}
	 * @return {DocumentFragment} Return a document fragment containing the cue's text.
	 */
	getCueAsHTML: function getCueAsHTML() {
		var
			fragment  = document.createDocumentFragment(),
			container = document.createElement("p");

		container.innerHTML = this.text;
		fragment.appendChild(container);

		return fragment;
	} // end of getCueAsHTML()
});


/**
 * The TrackCueList class
 * @constructor
 */
function TrackCueList() {}


// The only allowed item in this list is Track
TrackCueList.item = TrackCue;

TrackCueList.extend = fab.extend; // TrackCueList can extend itself and/or its prototype
TrackCueList.extend(TrackList, List); // Copy List's static methods in TrackCueList
TrackCueList.extend(List.prototype); // Copy List's prototype's methods in TrackCueList's prototype

// Extend TrackCueList's prototype
TrackCueList.extend({
	/**
	 * Search for a TrackCue having a given id
	 * This is basically the same as calling get({id: "foo"})
	 *
	 * @param {string} id The id to look for.
	 * @return {TrackCue|null} Return the `TrackCue` found or `null`.
	 */
	getCueById: function getCueById(id) {
		return this.get({ id: id }).get(0) || null;
	} // end of getCueById()
}); //end of TrackCueList.extend()


// Expose
fab.List         = List;
fab.Track        = Track;
fab.TrackList    = TrackList;
fab.TrackCue     = TrackCue;
fab.TrackCueList = TrackCueList;