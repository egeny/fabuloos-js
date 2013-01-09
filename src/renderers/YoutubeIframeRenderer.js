(function( scope ) {

	// Use JavaScript script mode
	"use strict";

	/*global Renderer, YT */

	/**
	 * YoutubeIframeRenderer
	 * @constructor
	 *
	 * @param {object} config The renderer config
	 *
	 * @returns {YoutubeIframeRenderer} A new YoutubeIframeRenderer instance
	 */
	function YoutubeIframeRenderer( config ) {
		var instance = this;

		instance.config = Renderer.merge( config ); // Prepare the config (copy the argument)
		instance        = Renderer.init( this );

		// Prepare the cache for properties and values
		instance.properties = {};

		// Prepare a closure for the timeupdate event
		// (will be called by window, so correct the "this")
		instance.timeupdate = function() {
			// Dispatch a "timeupdate" event
			instance.dispatch( "timeupdate" );
		};

		return instance;
	} // end of YoutubeIframeRenderer constructor


	// Set the constructor name if it doesn't exists (IE)
	// Beware to only set it if undefined, this property is read-only in strict mode
	if (!YoutubeIframeRenderer.name) {
		YoutubeIframeRenderer.name = "YoutubeIframeRenderer";
	}

	YoutubeIframeRenderer.prototype = new Renderer(); // Inherit from Renderer
	YoutubeIframeRenderer.prototype.constructor = YoutubeIframeRenderer; // Don't forget to correct the constructor


	/**
	 * The delay between each timeupdate event
	 * @static
	 * @type {Number}
	 */
	YoutubeIframeRenderer.timeupdateDelay = 250;


	/**
	 * Regular expression to test a youtube URL and/or retrieve the video ID
	 * @static
	 * @type {RegExp}
	 */
	YoutubeIframeRenderer.RegExp = /youtu\.?be(?:\.com)?[\/|:](?:.+)?([\w\d]{11})/;


	/**
	 * Check if a given URL is readable by this renderer
	 * @static @function
	 *
	 * @param {string} url The url to check
	 *
	 * @returns {string} Returns "probably" if the URL seems to be a Youtube valid URL, otherwise return an empty string
	 */
	YoutubeIframeRenderer.canPlay = function( url ) {
		return YoutubeIframeRenderer.RegExp.test( url ) ? "probably" : "";
	};


	/**
	 * The YoutubeIframeRenderer can only play Youtube's video so this method will always return an empty string
	 * @static
	 * @type {function}
	 */
	YoutubeIframeRenderer.canPlayType = function() {
		return "";
	};


	/**
	 * Will this renderer be supported on this browser?
	 * @static
	 * @type {function}
	 */
	YoutubeIframeRenderer.isSupported = !!window.postMessage;

	if (YoutubeIframeRenderer.isSupported) {
		var tag = document.createElement( "script" );
		tag.src = "//www.youtube.com/iframe_api";
		var firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	}


	// Extend the YoutubeIframeRenderer prototype
	Renderer.extend(YoutubeIframeRenderer.prototype, {

		/**
		 * Get a property's value
		 * @function
		 *
		 * @param {string} property The property name
		 *
		 * @returns The property's value or undefined if the property or element doesn't exists
		 */
		get: function( property ) {
			// Don't bother if this renderer isn't ready (has element and element ready)
			if (!this.isReady) {
				return;
			}

			// TODO: width/height

			// Some properties have to be handled in a specific way
			switch (property) {
				case "currentTime":
					return this.api.getCurrentTime();

				case "duration":
					return this.api.getDuration();

				case "muted":
					return this.api.isMuted();

				case "paused":
					return this.api.getPlayerState() === 2;

				case "volume":
					return this.api.getVolume() / 100;

				default:
					return this.properties[property];
			}
		}, // end of get()


		/**
		 * Handle the Youtube's StateChange event
		 *
		 * @param {Number} state The new state code
		 */
		handleStateChange: function( state ) {
			switch (state) {
				case -1: // Unstarted
					// Set a flag to handle some initialization stuff
					this.unstarted = true;
				break;

				case 0: // Ended
					// Dispatch an "ended" event
					this.dispatch( "ended" );
				break;

				case 1: // Playing
					// Escaping from the unstarted state
					if (this.unstarted) {
						// Dispatch a "loadeddata" event
						this.dispatch("loadeddata");

						// Dispatch a "durationchange" event
						this.dispatch( "durationchange" );

						// Clean the instance of this flag
						delete this.unstarted;

						// Prevent automatic autoplay
						/*if (!this.get( "autoplay" )) {
							// Pause and exit since we aren't playing anymore
							return this.pause();
						}*/
					}

					// Dispatch a "playing" event
					this.dispatch( "playing" );

					// Set a timer to dispatch the "timeupdate" event
					this.timer = window.setInterval( this.timeupdate, YoutubeIframeRenderer.timeupdateDelay );
				break;

				case 2: // Paused
					// Dispatch a "paused" event
					this.dispatch( "pause" );

					// Clear the "timeupdate" interval
					window.clearInterval( this.timer );
				break;

				case 3: // Buffering
				break;
			}
		}, // end of handleStateChange()


		/**
		 * TODO
		 */
		pause: function() {
			this.api.pauseVideo();
		}, // end of pause()

		/**
		 * TODO
		 */
		play: function() {
			this.api.playVideo();
		}, // end of play()


		/**
		 * Replace an element with the Youtube's iframe
		 * @function
		 *
		 * @param {string|Element} The element or element ID to replace
		 */
		replace: function( element ) {
			var
				// Store a reference to the current instance (used by some closures)
				instance = this,

				// Create a closure to recall this method (see below)
				self = function() {
					instance.replace( element );
				};

			// If the Youtube's script isn't ready, recall this method in 10ms
			if (!YoutubeIframeRenderer.script) {
				return window.setTimeout( self, 10 );
			}

			// Create a Youtube's iframe
			this.api = new YT.Player(element, {
				// @see https://developers.google.com/youtube/player_parameters#Parameters
				playerVars: {
					autoplay: 0,
					controls: 0,
					disablekb: 1,
					iv_load_policy: 3,
					showinfo: 0,
					rel: 0
				},
				events: {
					onReady: function() {
						instance.ready();
					},
					onStateChange: function( state ) {
						instance.handleStateChange( state.data );
					}
				}
			}); // end of new YT.Player
		}, // end of replace()


		/**
		 * TODO
		 */
		set: function( property, value ) {
			// First, check if the renderer is ready
			if (!this.isReady) {
				// It doesn't seems, store this value in the cache
				this.cache.properties[property] = value;
				return; // Stop here
			}

			// Some properties have to be handled in a specific way
			switch (property) {
				case "currentTime":
					this.api.seekTo( value );
				break;

				case "muted":
					this.api[value ? "mute" : "unMute"]();

					// Dispatch a "volumechange" event
					this.dispatch( "volumechange" );
				break;

				case "src":
					// Get the video ID
					var id = value.match( YoutubeIframeRenderer.RegExp );

					// Store the source value in the cache
					this.properties[property] = id ? value : "";

					// Set the source using the video ID (if found)
					if (id) {
						this.api.loadVideoById( id[1] );
					}
				break;

				case "volume":
					// Youtube's volume values are between 0 and 100
					this.api.setVolume( value * 100 );

					// Dispatch a "volumechange" event
					this.dispatch( "volumechange" );
				break;

				case "width":
				case "height":
					// TODO
					this.properties[property] = value;
					//this.api.setSize( this.get( "width" ), this.get( "height" ) );
				break;

				default:
					// By default, store the property's value in the cache
					this.properties[property] = value;
			}
		} // end of set()

	}); // end of Renderer.extend()

	// Listen for the Youtube's script to be ready
	scope.onYouTubeIframeAPIReady = function() {
		YoutubeIframeRenderer.script = true;
	};


	// Expose
	scope.YoutubeIframeRenderer = YoutubeIframeRenderer;

}( window ));
