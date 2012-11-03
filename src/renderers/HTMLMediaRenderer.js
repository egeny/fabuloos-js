(function( scope ) {

	// Use JavaScript script mode
	"use strict";

	/*global Renderer */

	var
		dontBubbles   = /blur|focus|mouseenter|mouseleave/,
		notCancelable = /blur|focus|mouseenter|mouseleave|focusin|focusout/;

	/**
	 * HTMLMediaRenderer
	 * @constructor
	 *
	 * @param {string|Element} element The id of the element or the element to base on, or the media type of the renderer (audio or video)
	 * @param {object} config The renderer config
	 *
	 * @returns {HTMLMediaRenderer} A new HTMLMediaRenderer instance
	 *
	 * @example
	 *  <code>
	 *    // Create an HTMLMediaRenderer instance based on the element which have "player" as ID
	 *    var renderer = new HTMLMediaRenderer( "player" );
	 *  </code>
	 *  <code>
	 *    // Create an HTMLMediaRenderer instance based on an existing element
	 *    var renderer = new HTMLMediaRenderer( element );
	 *  </code>
	 *  <code>
	 *    // Create an HTMLMediaRenderer instance using a &lt;video&gt; tag and a specific config
	 *    var renderer = new HTMLMediaRenderer( "video", { id: "player" } );
	 *  </code>
	 */
	function HTMLMediaRenderer() {
		var
			mediaType, // The tag we have to create
			rMediaType = /audio|video/i, // A RegExp used to find which tag we have to create
			node, // Sometimes we can receive a node
			instance,
			config = Renderer.merge( arguments[1], {} ); // Retrieve the config or initialize to an object litteral

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
		instance = Renderer.init( this, config );

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
	} // end of HTMLMediaRenderer constructor


	// Set the constructor name if it doesn't exists (IE)
	// Beware to only set it if undefined, this property is read-only in strict mode
	if (!HTMLMediaRenderer.name) {
		HTMLMediaRenderer.name = "HTMLMediaRenderer";
	}

	HTMLMediaRenderer.prototype = new Renderer(); // Inherit from Renderer
	HTMLMediaRenderer.prototype.constructor = HTMLMediaRenderer; // Don't forget to correct the constructor


	/**
	 * The default media type to use when creating a player
	 * @static
	 * @type {string}
	 */
	HTMLMediaRenderer.defaultMediaType = "video";


	/**
	 * Will the audio renderer be supported on this browser?
	 * @static
	 * @type {boolean}
	 */
	HTMLMediaRenderer.isAudioSupported = !!document.createElement( "audio" ).canPlayType;


	/**
	 * Will the video renderer be supported on this browser?
	 * @static
	 * @type {boolean}
	 */
	HTMLMediaRenderer.isVideoSupported = !!document.createElement( "video" ).canPlayType;


	/**
	 * Will this renderer be supported on this browser?
	 * @static
	 * @type {boolean}
	 */
	HTMLMediaRenderer.isSupported = HTMLMediaRenderer.isAudioSupported && HTMLMediaRenderer.isVideoSupported;


	/**
	 * Static reference to Renderer.canPlayType
	 * @static
	 * @type {boolean}
	 */
	HTMLMediaRenderer.canPlay = Renderer.canPlay;


	/**
	 * Check if a given MIME type is readable by this renderer
	 * @static @function
	 *
	 * @param {string} type The MIME type to check
	 *
	 * @returns {string} Returns "maybe" or "probably" is the MIME type is supported, "" otherwise
	 */
	HTMLMediaRenderer.canPlayType = function( type ) {
		var
			mediaType = /^(audio|video)/.exec( type ); // Retrieve the kind of media we're trying to play
			mediaType = mediaType ? mediaType[0] : HTMLMediaRenderer.defaultMediaType; // Handle unknown media kind (application for HLS stream)

		return HTMLMediaRenderer.isSupported ? document.createElement( mediaType ).canPlayType( type ) : "";
	}; // end of HTMLVideoRenderer.canPlayType()


	// Extend the HTMLMediaRenderer prototype
	Renderer.extend(HTMLMediaRenderer.prototype, {

		/**
		 * A flag to check if this renderer is ready. HTMLMediaRenderer are always ready.
		 * @type {boolean}
		 */
		isReady: true,


		/**
		 * For HTMLMediaRenderer we can use addEventListener
		 * @see Renderer.prototype.bind
		 */
		bind: function( type, handler ) {
			if (this.element) {
				this.element.addEventListener( type, handler, false );
			}
		}, // end of bind()


		/**
		 * For HTMLMediaRenderer we can use dispatchEvent
		 * @see Renderer.prototype.dispatch
		 */
		dispatch: function( event ) {
			if (this.element) {
				var
					type       = typeof event === "string" ? event : event.type, // Determine the event type
					bubble     = !dontBubbles.test( type ), // Check if this type bubbles
					cancelable = !notCancelable.test( type ); // Check if this type is cancelable

				// Create a dummy event, creating using the real interface is a nightmare
				event = document.createEvent( "Event" );

				// Initialize the event
				event.initEvent( type, bubble, cancelable );

				// Dispatch!
				this.element.dispatchEvent( event );
			}
		}, // end of dispatch()


		/**
		 * Fix some browser inconsistencies and bugs
		 * @function
		 */
		fix: function() {
			// Prevent fixing a fixed element
			if (this.fixed) { return; }

			/**
			 * Browser sniffing is very bad, but in this case it is the only way to detect this bug
			 * It affects only WebKit version prior to 535
			 */

			var
				version = /AppleWebKit\/([\d]+)/.exec( navigator.userAgent );
				version = version ? parseInt( version[1], 10 ) : null;

			if (version && version < 535) {
				/**
				 * Fix for an old webkit bug affecting "ended" event
				 * @see https://bugs.webkit.org/show_bug.cgi?id=61336
				 */
				this.element.addEventListener( "loadeddata", function() {
					// Using a try/catch to avoid webkit (mobile version) to yield about negative DOM value
					try {
						/**
						 * 0 will not work since we must trigger a seek
						 * We have to seek to a value near 0, 1e-5 (0.00001) seems good
						 */
						this.currentTime = 1e-5;
					} catch (e) {}
				}, false );
			} // end of if (version && version < 535)

			// This element is now fixed
			this.fixed = true;
		}, // end of fix()


		/**
		 * Replace an element with the renderer markup
		 * @function
		 *
		 * @param {string|Element} The element or element ID to replace
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
		}, // end of replace()


		/**
		 * For HTMLMediaRenderer we can use removeEventListener
		 * @see Renderer.prototype.unbind
		 */
		unbind: function( type, handler ) {
			if (this.element) {
				this.element.removeEventListener( type, handler, false );
			}
		} // end of unbind()

	}); // end of Renderer.extend()

	// Expose
	scope.HTMLMediaRenderer = HTMLMediaRenderer;

}( window ));
