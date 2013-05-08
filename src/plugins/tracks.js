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
