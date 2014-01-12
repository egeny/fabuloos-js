/* global FlashRenderer, YT */

/**
 * The YoutubeRenderer class
 * @constructor
 *
 * @see #Renderer.init() for signatures
 */
function YoutubeRenderer(config) {
	var script, first;

	// Do the basic renderers' needed stuff
	this.init(config);

	// On iframe mode, load the iframe's API script
	if (YoutubeRenderer.mode === "iframe" && !window.YT) {
		script     = document.createElement("script");
		script.src = "//www.youtube.com/iframe_api";

		// Handle a loading error
		script.onerror = function() {
			YoutubeRenderer.script = false;
		};

		first = document.getElementsByTagName("script")[0];
		first.parentNode.insertBefore(script, first);
	}
} // end of YoutubeRenderer()


/**
 * Detect the API mode (iframe or flash)
 * It have to be done right after the constructor since even the inheritance depend on this
 * @type {string}
 */
YoutubeRenderer.mode = !!window.postMessage ? "iframe" : (FlashRenderer.isSupported ? "flash" : "");

/**
 * The URL of the SWF file (Chromeless player)
 * @type {string}
 */
YoutubeRenderer.swf = "http://www.youtube.com/v/{id}?version=3";

// YoutubeRenderer can inherit and will inherit from Renderer
YoutubeRenderer.inherit = Renderer.inherit;
YoutubeRenderer.inherit(Renderer);

// YoutubeRenderer can extend and will extend itself (statically)
YoutubeRenderer.extend = Renderer.extend;
YoutubeRenderer.extend(YoutubeRenderer, {
	/**
	 * Check if a given URL is readable by this renderer
	 * @see #Renderer.canPlay()
	 */
	canPlay: function canPlay(url, type) {
		if (type) {
			return this.canPlayType(type);
		} else {
			return YoutubeRenderer.rYoutube.test(url) ? "probably" : "";
		}
	}, // end of canPlay()


	/**
	 * Check if a given MIME type is readable by this renderer
	 * @see #Renderer.canPlayType()
	 */
	canPlayType: function canPlayType(type) {
		return type === "video/youtube" ? "probably" : "";
	}, // end of YoutubeRenderer.canPlayType()


	/**
	 * Will this renderer be supported on this browser?
	 * @type {boolean}
	 */
	isSupported: !!YoutubeRenderer.mode,


	/*!
	 * A RegExp used to test a youtube URL and/or retrieve the video ID
	 * @type {RegExp}
	 */
	rYoutube: /.*youtu\.?be(?:\.com)?[\/|:](?:.+)?([\w\d\-]{11})/,


	/**
	 * The delay between each timeupdate event
	 * @type {Number}
	 */
	timeupdateDelay: 250
}); // end of YoutubeRenderer.extend(YoutubeRenderer)


// Extend the YoutubeRenderer's prototype
YoutubeRenderer.extend({
	/**
	 * Get a property's value
	 * @see #Renderer.get()
	 */
	get: function get(property) {
		// Don't bother if the renderer isn't ready
		if (!this.isReady) { return; }

		// TODO: implement the other getters
		switch (property) {
			case "autoplay":
			case "buffered":
			case "controls":
			case "currentSrc":
			break;

			case "currentTime":
				return this.api.getCurrentTime();

			case "defaultPlaybackRate":
			break;

			case "duration":
				return this.api.getDuration();

			case "ended":
			case "error":
			case "loop":
			break;

			case "muted":
				return this.api.isMuted();

			case "networkState":
			case "loop":
			break;

			case "paused":
				return this.api.getPlayerState() === 2;

			case "preload":
			case "playbackRate":
			case "played":
			case "poster":
			case "readyState":
			case "seekable":
			case "seeking":
			case "src":
			case "videoHeight":
			case "videoWidth":
			break;

			case "volume":
				return this.api.getVolume() / 100;
		} // end of switch (property)
	}, // end of get()


	/**
	 * Handle the Youtube's StateChange event
	 *
	 * @param {number} state The new state.
	 * @return {undefined} Return nothing.
	 */
	handleStateChange: function handleStateChange(state) {
		state = state.data || state; // iframe and flash events are differents

		// TODO: implement the required events
		switch (state) {
			case -1: // Unstarted
				this.dispatch("durationchange");
			break;

			case 0: // Ended
				this.trigger("ended");
			break;

			case 1: // Playing
				this.trigger("playing");

				// Manually set a timer to dispatch a "timeupdate" event
				this.timer = window.setInterval(this.closure("trigger", "timeupdate"), YoutubeRenderer.timeupdateDelay);
			break;

			case 2: // Paused
				this.trigger("pause");

				// Clear the timer
				window.clearInterval(this.timer);
			break;

			case 3: // Buffering
				// Clear the timer
				window.clearInterval(this.timer);
			break;
		} // end of switch (state)
	}, // end of handleStateChange()


	// API shorthands
	pause: Renderer.shorthand("pauseVideo"),
	play:  Renderer.shorthand("playVideo"),


	/**
	 * Replace an element with the renderer's markup
	 * @see #FlashRenderer.replace()
	 */
	replace: function replace(element) {
		var
			// Try to extract the videoId from the source
			id = this.config.src.replace(YoutubeRenderer.rYoutube, "$1"),

			// @see https://developers.google.com/youtube/player_parameters#Parameters
			parameters = {
				autoplay: this.config.autoplay ? 1 : 0, // Boolean doesn't seems to work
				controls: this.config.controls ? 1 : 0,
				disablekb: 1, // Prefer allowing the developper to use their owns
				enablejsapi: 1, // Always enable the JS API
				iv_load_policy: 3, // Disable annotations
				loop: this.config.loop ? 1 : 0,
				rel: 0, // Do not show related videos
				showinfo: 0 // Do not show video's title
			},

			parameter; // Loop specific

		// Use FlashRenderer's replace method when mode is flash
		if (YoutubeRenderer.mode === "flash") {
			var
				old = YoutubeRenderer.swf, // Remember the base SWF URL, we have to change it and revert it back
				swf = YoutubeRenderer.swf; // We have to change the SWF's URL to add some parameters

			// Prepare the SWF URL
			swf  = swf.replace("{id}", id); // Replace a token for the videoId ({id}) with the actual id
			swf += "&playerapiid=" + this.config.id; // Append the "playerapiid" to the SWF's URL to correctly dispatch events

			// Add the rest of the parameters
			for (parameter in parameters) {
				swf += "&" + parameter + "=" + parameters[parameter];
			}

			// FlashRenderer.replace use this.swf as source for the <object>, change it now and restore later
			YoutubeRenderer.swf = swf;

			// Replace the element
			FlashRenderer.replace.call(this, element);

			// Restore the base SWF URL
			YoutubeRenderer.swf = old;

			return this; // Chaining
		}

		// If the Youtube's script isn't ready, recall this method in 10ms
		if (!YoutubeRenderer.script) {
			// Recall only if the "script" property doesn't exists ("script" may be false if the loading fail)
			if (YoutubeRenderer.script === undefined) {
				window.setTimeout(this.closure("replace", element), 10);
			}

			return this; // Chaining
		}

		// Create the player
		this.api = new YT.Player(element, {
			width:      this.config.width,
			height:     this.config.height,
			videoId:    id,
			playerVars: parameters,
			events: {
				onReady:       this.closure("ready", null), // onReady will pass an event, prevent ready() to think it is a callback
				onStateChange: this.closure("handleStateChange")
			}
		}); // end of YT.Player()


		// It seems to be the only way to keep a reference to the element
		this.element = this.api.a;

		return this; // Chaining
	}, // end of replace()


	/**
	 * Set a property's value
	 * @see #Renderer.set()
	 */
	set: function set(property, value) {
		// Don't bother if the renderer isn't ready
		if (!this.isReady) { return; }

		// TODO: implement all setters
		switch (property) {
			case "autoplay":
			case "controls":
			break;

			case "currentTime":
				this.api.seekTo(value);
			break;

			case "defaultPlaybackRate":
			break;

			case "loop":
				this.api.setLoop(value);
			break;

			case "muted":
				this.api[value ? "mute" : "unMute"]();
				this.trigger("volumechange");
			break;

			case "playbackRate":
			case "poster":
			case "preload":
			break;

			case "src":
				this.api.loadVideoById(value.replace(YoutubeRenderer.rYoutube, "$1"));
			break;

			case "volume":
				this.api.setVolume(value * 100);
				this.trigger("volumechange");
			break;
		} // end of switch (property)

		// Return the new value
		return this.get(property);
	} // end of set()
}); // end of YoutubeRenderer.extend()


// We have some special things to do for iframe mode
if (YoutubeRenderer.mode === "iframe") {
	// Remember when the API is ready
	window.onYouTubeIframeAPIReady = function() {
		YoutubeRenderer.script = true;
	};
}


// We have some special things to do for flash mode
if (YoutubeRenderer.mode === "flash") {
	// Listen for the Youtube's flash API to be ready
	window.onYouTubePlayerReady = function(id) {
		// Retrieve the instance
		var instance = YoutubeRenderer.instances[id];

		// Abort if we couldn't find the instance
		if (!instance) { return; }

		/*!
		 * Since Youtube's addEventListener method call on window.something
		 * We have to retrieve the right YoutubeRenderer instance.
		 * Using YoutubeRenderer.instances["id"] doesn't work
		 * (the Youtube player cannot call on an array).
		 * We have to create something like YoutubeRenderer.handlers("id")
		 * To retrieve the right instance, then call the corresponding method 
		 */
		YoutubeRenderer.handlers = YoutubeRenderer.handlers || {};
		YoutubeRenderer.handlers[instance.config.id] = instance.closure("handleStateChange");

		// Register the event on the player
		// We have to listen only for onStateChange so the structure of handlers is simple
		instance.api.addEventListener("onStateChange", "Renderer.YoutubeRenderer.handlers." + instance.config.id);

		// The renderer is now ready
		instance.ready();
	}; // end of onYouTubePlayerReady()
}


// Register this renderer
Renderer.register(YoutubeRenderer);