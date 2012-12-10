// Tracks module
(function( player ) {

	// Use JavaScript script mode
	"use strict";

	// Extend the player with new methods
	player.extend({
		/**
		 * TODO
		 */
		init: function() {
			// Don't execute while extending
			if (player.extending) {
				return;
			}

			// Initialize first
			this._super.apply( this, arguments );

			// Initialize the main track list
			this.tracks = new player.TrackList();
		}, // end of init()


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
				track = kind instanceof player.Track ? kind : new player.Track( kind, label, lang );
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

			// Return the created track
			return track;
		} // end of addTrack()

	}); // end of player.extend()

}( fabuloos )); // end of Tracks module
