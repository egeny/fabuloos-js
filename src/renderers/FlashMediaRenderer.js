(function( scope ) {

	// Use JavaScript script mode
	"use strict";

	/*global Renderer, FlashRenderer */

	/**
	 * FlashMediaRenderer
	 * @constructor
	 *
	 * @param {object} config The renderer config
	 *
	 * @returns {FlashMediaRenderer} A new FlashMediaRenderer instance
	 */
	function FlashMediaRenderer( config ) {
		this.config = Renderer.merge( config, FlashMediaRenderer.config ); // Merge the config with defaults

		return FlashRenderer.init( this );
	} // end of FlashMediaRenderer constructor


	// Set the constructor name if it doesn't exists (IE)
	// Beware to only set it if undefined, this property is read-only in strict mode
	if (!FlashMediaRenderer.name) {
		FlashMediaRenderer.name = "FlashMediaRenderer";
	}

	FlashMediaRenderer.prototype = new FlashRenderer(); // Inherit from FlashRenderer
	FlashMediaRenderer.prototype.constructor = FlashMediaRenderer; // Don't forget to correct the constructor


	/**
	 * Default plugin configuration
	 * @static
	 * @type {object}
	 */
	FlashMediaRenderer.config = {
		data: "FlashMediaRenderer.swf"
	};


	/**
	 * Supported MIME types
	 * @static
	 * @type {object}
	 */
	FlashMediaRenderer.types = {
		// Application (manifest)
		"application/f4m+xml":  "probably",
		"application/smil+xml": "probably",

		// Video
		"video/mp4":   "maybe",
		"video/x-m4v": "maybe",
		"video/x-flv": "maybe",
		"video/3gpp":  "maybe",
		"video/quicktime": "maybe",

		// Audio
		"audio/mp3": "maybe"
	};


	/**
	 * Check if a given URL is readable by this renderer
	 * @static @function
	 *
	 * @param {string} url The url to check
	 *
	 * @returns {string} Returns "probably" if the URL's protocol is RTMP, call Renderer.canPlay otherwise
	 * @see Renderer.canPlay
	 */
	FlashMediaRenderer.canPlay = function( url ) {
		return (/^rtmp/).test( url ) ? "probably" : Renderer.canPlay.call( this, url );
	};


	/**
	 * Static reference to Renderer.canPlayType
	 * @static
	 * @type {function}
	 */
	FlashMediaRenderer.canPlayType = Renderer.canPlayType;


	/**
	 * Will this renderer be supported on this browser?
	 * @static
	 * @type {function}
	 */
	FlashMediaRenderer.isSupported = FlashRenderer.isSupported;


	// Extend the FlashMediaRenderer prototype
	Renderer.extend(FlashMediaRenderer.prototype, {

		/**
		 * Expose a property's value to the DOM.
		 * Used by Flash to set a DOM property value on itself
		 * @function
		 *
		 * @param {string} property The property's value to set
		 * @param {*} value The new property value
		 */
		exposeProperty: function( property, value ) {
			// TODO: Refactoring needed
			this.element[property] = value;
		}, // end of exposeProperty()

		// Override API shorthands
		play: Renderer.createShorthand( "_play" ) // this.element.play() is reserved by ActiveX, use _play

	}); // end of Renderer.extend()

	// Expose
	scope.FlashMediaRenderer = FlashMediaRenderer;

}( window ));
