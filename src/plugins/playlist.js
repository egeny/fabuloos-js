/**
 * The Playlist class
 * @constructor
 */
function Playlist() {}


// The only allowed item in this list is Object (well, basically accept anything)
Playlist.item = Object;

Playlist.extend = fab.extend; // Playlist can extend itself and/or its prototype
Playlist.extend(Playlist, List); // Copy List's static methods in Playlist
Playlist.extend(List.prototype); // Copy List's prototype's methods in Playlist's prototype

// Extend the Playlist's prototype
Playlist.extend({
	/**
	 * The current item
	 * @type {number}
	 */
	current: 0,


	/**
	 * Get a list of items or a single item, depending on the filter
	 *
	 * @param {string} filter A filter keyword.
	 *   Possible values are: "first", "prev", "previous", "current", "next" and "last"
	 * @return {Object|undefined} Return a configuration object or `undefined` if the asked filter doesn't exists.
	 *
	 * @see #List.prototype.get() for other signatures.
	 */
	get: function get(filter) {
		// If the filter isn't a keyword calm down and carry on.
		if (typeof filter !== "string") {
			return this._super(filter);
		}

		// Prepare the index we're looking for
		var index = -1; // -1 means if we received an unknown filter we'll return undefined

		// This part doesn't need to be commented, otherwise you should consider changing your job.
		switch (filter) {
			case "first":
				index = 0;
			break;

			case "prev":
			case "previous":
				index = this.current - 1;
			break;

			case "current":
				index = this.current;
			break;

			case "next":
				index = this.current + 1;
			break;

			case "last":
				index = this.length() - 1;
			break;
		}

		// Return the item (or not, that is the question)
		return this._super(index);
	} // end of get()
}); // end of Playlist.extend()


/*!
 * Change the playlist's current item for a new one
 *
 * @param {string|object|number} filter The filter to use to find the new item.
 * @return {fabuloos} Return the current instance to allow chaining.
 */
function change(filter) {
	var
			playlist = this.playlist(), // Get the playlist (or create a new one)
			item     = playlist.get(filter); // Try to retrieve the asked item

		// If there is an item, set it as current and pass it to config()
		if (item) {
			playlist.current = playlist.index(item);
			this.config(item);
		}

		return this; // Chaining
} // end of change()


// Extend the fabuloos' prototype
fab.extend({
	/**
	 * Pass to #config() the first item of the playlist
	 *
	 * @param {undefined}
	 * @return {fabuloos} Return the current instance to allow chaining.
	 */
	first: function first() {
		return change.call(this, 0);
	}, // end of first()


	/**
	 * Pass to #config() the previous item of the playlist
	 *
	 * @param {undefined}
	 * @return {fabuloos} Return the current instance to allow chaining.
	 */
	previous: function previous() {
		return change.call(this, "previous");
	}, // end of previous()


	/**
	 * Pass to #config() the next item of the playlist
	 *
	 * @param {undefined}
	 * @return {fabuloos} Return the current instance to allow chaining.
	 */
	next: function next() {
		return change.call(this, "next");
	}, // end of next()


	/**
	 * Pass to #config() the last item of the playlist
	 *
	 * @param {undefined}
	 * @return {fabuloos} Return the current instance to allow chaining.
	 */
	last: function last() {
		return change.call(this, "last");
	}, // end of last()


	/**
	 * Get or set the playlist of media to play
	 *
	 * @param {array} config The items to play.
	 *   Each item may be a simple string (the source URL to play) or an object to apply using #config().
	 * @return {fabuloos} Return the current instance to allow chaining.
	 *
	 * @param {undefined}
	 * @return {Playlist} Return the current playlist.
	 */
	playlist: function playlist(config) {
		var
			_playlist = this._playlist = this._playlist || new Playlist(), // Makes sure we always have an internal playlist
			_config   = config ? (config.push ? config.slice(0) : [config]) : [], // Makes sure we always have an array
			i = 0, count = _config.length, item; // Loop specific

		// No config, act as a getter
		if (config === undefined) {
			return this._playlist;
		}

		// Loop through each item of the config
		for (; i < count; i++) {
			item = config[i]; // More convenient

			if (!item) { continue; }

			// Handling string would be too complex, simple convert to an object
			if (typeof item === "string") {
				item = { src: item };
			}

			// Add the item (other types will be ignored)
			_playlist.add(item);
		}

		// Set the first item
		this.first();

		// When a source is complete, pass to the next one
		this.on("ended", this.closure("next"));

		return this; // Chaining
	} // end of playlist()
}); // end of fab.extend()