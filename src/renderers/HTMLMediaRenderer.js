// Use JavaScript script mode
"use strict";

/*jshint curly: true, noempty: true, strict: true, boss: true, evil: false, smarttabs: true, sub: false */
/*global browser, rhino, Renderer */

/**
	HTMLMediaRenderer
	@constructor

	@param {string|Element} element The id of the element or the element to base on, or the media type of the renderer (audio or video)
	@param {object} config The renderer config

	@returns {HTMLMediaRenderer} A new HTMLMediaRenderer instance
*/
function HTMLMediaRenderer() {
	var
		mediaType, // The tag we have to create
		rMediaType = /audio|video/i, // A RegExp used to find which tag we have to create
		node, // Sometimes we can receive a node
		instance,
		config = Renderer.merge( arguments[1], {} );

	// Receiving a string
	if (typeof arguments[0] === "string") {
		// Test this string to match a mediaType
		mediaType = rMediaType.exec( arguments[0] );

		// Try to retrieve a node identified with this string
		node = document.getElementById( arguments[0] );
	} else if (arguments[0] && arguments[0].nodeName) {
		// Receiving a node
		node = arguments[0];
	}

	// If a node were found, get its mediaType
	if (node) {
		mediaType = rMediaType.exec( node.nodeName );

		// If this node is <audio> or <video>, save it already!
		if (mediaType) {
			this.element = node;
		}
	}

	// Determine the mediaType
	this.mediaType = mediaType ? mediaType[0].toLowerCase() : HTMLMediaRenderer.defaultMediaType;

	// Watch if there is an id
	if (this.element) {
		config.id = config.id || this.element.id;
	}

	// Initialize the Renderer
	instance = Renderer.init( config, this );

	// We are extending an existing media element
	if (this.element) {
		// Makes sure the element has an id
		if (!this.element.id) {
			this.element.id = this.id;
		}

		// Fix it!
		this.fix();
	}

	return instance;
}

HTMLMediaRenderer.prototype = new Renderer(); // Inherit from Renderer
HTMLMediaRenderer.prototype.constructor = HTMLMediaRenderer; // Don't forget to correct the constructor
HTMLMediaRenderer.prototype.constructor.name = "HTMLMediaRenderer"; // Useful for IE


/**
	The default media type to use when creating a player
	@static
	@type {string}
*/
HTMLMediaRenderer.defaultMediaType = "video";


/**
	Will the audio renderer be supported on this browser?
	@static
	@type {boolean}
*/
HTMLMediaRenderer.isAudioSupported = !!document.createElement( "audio" ).canPlayType;


/**
	Will the video renderer be supported on this browser?
	@static
	@type {boolean}
*/
HTMLMediaRenderer.isVideoSupported = !!document.createElement( "video" ).canPlayType;


/**
	Will this renderer be supported on this browser?
	@static
	@type {boolean}
*/
HTMLMediaRenderer.isSupported = HTMLMediaRenderer.isAudioSupported && HTMLMediaRenderer.isVideoSupported;


/**
	Static reference to Renderer.canPlayType
	@static
	@type {boolean}
*/
HTMLMediaRenderer.canPlay = Renderer.canPlay;


/**
	Check if a given MIME type is readable by this renderer
	@static @function

	@param {string} type The MIME type to check

	@returns {string} Returns "maybe" or "probably" is the MIME type is supported, "" otherwise
*/
HTMLMediaRenderer.canPlayType = function( type ) {
	var
		mediaType = /^(audio|video|application)/.exec( type );
		mediaType = mediaType ? mediaType[0] : HTMLMediaRenderer.defaultMediaType;
		mediaType = mediaType === "application" ? "video" : mediaType; // FIXME: find a neater version

	return mediaType && HTMLMediaRenderer.isSupported ? document.createElement( mediaType ).canPlayType( type ) : "";
}; // end of HTMLVideoRenderer.canPlayType()


// Extend the HTMLMediaRenderer prototype
Renderer.extend(HTMLMediaRenderer.prototype, {
	/**
		A flag to check if this renderer is ready. HTMLMediaRenderer are always ready.
		@type {boolean}
	*/
	isReady: true,


	/**
		Fix some browser inconsistencies and bugs
		@function
	*/
	fix: function() {
		// Prevent fixing a fixed element
		if (this.fixed) { return; }

		var
			version = /AppleWebKit\/([\d]+)/.exec( navigator.userAgent );
			version = version ? parseInt( version[1], 10 ) : null;

		if (version && version < 535) {
			/**
				Fix for an old webkit bug affecting "ended" event
				@see https://bugs.webkit.org/show_bug.cgi?id=61336
			*/
			this.element.addEventListener( "loadeddata", function() {
				// Using a try/catch to avoid webkit (mobile version) to yield about negative DOM value
				try {
					/**
						0 will not work since we must trigger a seek
						We have to seek to a value near 0, 1e-5 (0.00001) seems good
					*/
					this.currentTime = 1e-5;
				} catch (e) {}
			}, false );
		} // end of if (version && version < 535)

		// This element is now fixed
		this.fixed = true;
	}, // end of fix()


	/**
		Replace an element with the renderer markup
		@function

		@param {string|Element} The element or element ID to replace
	*/
	replace: function() {
		var
			element = typeof arguments[0] === "string" ? document.getElementById( arguments[0] ) : arguments[0],
			markup  = "<" + this.mediaType + " " + Renderer.formatTo( "attribute", this.config ) + "></" + this.mediaType + ">",
			container = document.createElement( "div" );

		// Check if we're not trying to replace the same element
		if (element === this.element) {
			return;
		}

		// Turn the markup string into a DOM Object
		container.innerHTML = markup;

		// Get the DOM Object
		this.element = container.firstChild;

		// Fix browsers' bugs
		this.fix();

		// Replace the element with the brand new one
		element.parentNode.replaceChild( this.element, element );
	} // end of replace()

}); // end of Renderer.extend()