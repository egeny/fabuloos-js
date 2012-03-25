// Use JavaScript script mode
"use strict";

/*jshint curly: true, noempty: true, strict: true, boss: true, evil: false, smarttabs: true, sub: false */
/*global browser, rhino, Renderer */

/**
	FlashMediaRenderer
	@constructor

	@param {object} config The renderer config

	@returns {FlashMediaRenderer} A new FlashMediaRenderer instance
*/
function FlashMediaRenderer() {
	var
		config   = Renderer.merge( arguments[0], FlashMediaRenderer.config ),
		instance = Renderer.init( config, this );

	// Makes sure we have an id and a name for ExternalInterface
	config.name = config.id;

	// Change the config for bad browsers
	if (FlashMediaRenderer.isOldIE) {
		config.classid = "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000";
		config.params.movie = config.data;
		delete config.type;
		delete config.data;
	}

	return instance;
}

FlashMediaRenderer.prototype = new Renderer(); // Inherit from Renderer
FlashMediaRenderer.prototype.constructor = FlashMediaRenderer; // Don't forget to correct the constructor
FlashMediaRenderer.prototype.constructor.name = "FlashMediaRenderer"; // Useful for IE


/**
	Default plugin configuration
	@static
	@type {object}
*/
FlashMediaRenderer.config = {
	width:  720,
	height: 405,
	type: "application/x-shockwave-flash",
	data: "FlashMediaRenderer.swf",
	params: {
		allowscriptaccess: "always",
		wmode: "transparent"
	}
};


/**
	Check if a given URL is readable by this renderer
	@static @function

	@param {string} url The url to check

	@returns {string} Returns "probably" if the URL's protocol is RTMP, call Renderer.canPlay otherwise
	@see Renderer.canPlay
*/
FlashMediaRenderer.canPlay = function( url ) {
	return (/^rtmp/).test( url ) ? "probably" : Renderer.canPlay.call( this, url );
};


/**
	Static reference to Renderer.canPlayType
	@static
	@type {function}
*/
FlashMediaRenderer.canPlayType = Renderer.canPlayType;


/**
	Some plugin info to use for plugin detection
	@static
	@type {object}
*/
FlashMediaRenderer.plugin = {
	minVersion:  "10.1",
	webmVersion: "11.0.2",
	plugin:  "Shockwave Flash",
	activex: "ShockwaveFlash.ShockwaveFlash"
};


/**
	Test if the browser is an old IE (6, 7, 8). Used to change the markup.
	Credits goes to Andrea Giammarchi.
	@see http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
	@static
	@type {boolean}
*/
FlashMediaRenderer.isOldIE = !+"\v1";


/**
	Will this renderer be supported on this browser?
	@static
	@type {function}
*/
FlashMediaRenderer.isSupported = Renderer.isPluginSupported( FlashMediaRenderer.plugin );


/**
	Supported MIME types
	@static
	@type {object}
*/
FlashMediaRenderer.types = {
	// Audio
	"audio/mp3": "maybe",

	// Video
	"video/mp4":   "maybe",
	"video/x-m4v": "maybe",
	"video/x-flv": "maybe",
	"video/3gpp":  "maybe",
	"video/quicktime": "maybe",

	// Application (manifest)
	"application/f4m+xml":  "probably",
	"application/smil+xml": "probably"
};


// Check if webm is supported
if (Renderer.isPluginSupported( FlashMediaRenderer.plugin, "webmVersion" )) {
	FlashMediaRenderer.types["video/webm"] = "maybe";
}


// Extend the FlashMediaRenderer prototype
Renderer.extend(FlashMediaRenderer.prototype, {
	/**
		Expose a property's value to the DOM.
		Used by Flash to set a DOM property value on itself
		@function

		@param {string} property The property's value to set
		@param {*} value The new property value
	*/
	exposeProperty: function( property, value ) {
		this.element[property] = value;
	}, // end of exposeProperty()


	/**
		Replace an element with the renderer markup
		@function

		@param {string|Element} The element or element id to replace
	*/
	replace: function() {
		var
			element = typeof arguments[0] === "string" ? document.getElementById( arguments[0] ) : arguments[0],
			markup  = "<object " + Renderer.formatTo( "attribute", this.config ) + ">" + Renderer.formatTo( "param", this.config.params ) + "</object>",
			container;

		if (FlashMediaRenderer.isOldIE) {
			// Bad Browser (IE6, 7 & 8), use outerHTML for ExternalInterface
			element.outerHTML = markup;
			this.element = document.getElementById( this.id );
		} else {
			// Turn the markup string into a DOM Object
			container = document.createElement( "div" );
			container.innerHTML = markup;

			// Get the DOM Object <object>
			this.element = container.firstChild;

			// Replace the element with the brand new <object>
			element.parentNode.replaceChild( this.element, element );
		}
	}, // end of replace()


	// Override API shorthands
	play: Renderer.createShorthand( "_play" ) // this.element.play() is reserved by ActiveX, use _play
}); // end of Renderer.extend()