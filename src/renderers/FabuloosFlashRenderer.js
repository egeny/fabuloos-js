/*global Renderer, FlashRenderer */

/**
 * The FabuloosFlashRenderer class
 * @constructor
 *
 * @see #Renderer.init() for signatures
 */
function FabuloosFlashRenderer(config) {
	// Do the basic renderers' needed stuff
	this.init(config);
} // end of FabuloosFlashRenderer()


/**
 * The URL of the SWF file
 * @type {string}
 */
FabuloosFlashRenderer.swf = "FabuloosFlashRenderer.swf";

/**
 * Supported MIME types
 * @type {object}
 */
FabuloosFlashRenderer.types = {
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


var
	/*!
	 * A RegExp used to check if an URL is an RTMP stream URL
	 * @type {RegExp}
	 */
	rRTMP = /^rtmp/i;


// FabuloosFlashRenderer can inherit and will inherit from Renderer
FabuloosFlashRenderer.inherit = Renderer.inherit;
FabuloosFlashRenderer.inherit(Renderer);

// FabuloosFlashRenderer can extend and will extend itself (statically)
FabuloosFlashRenderer.extend = Renderer.extend;
FabuloosFlashRenderer.extend(FabuloosFlashRenderer, {
	/**
	 * Check if a given URL is readable by this renderer
	 *
	 * @param {string} url The url to check
	 * @param {string|array} type The MIME type(s) associated to this URL
	 * @return {string} Return "probably" or "maybe" if the MIME type is supported, "" (empty string) otherwise
	 */
	canPlay: function canPlay(url, type) {
		// Test for RTMP or use the basic Renderer's canPlay
		return rRTMP.test(url) ? "probably" : Renderer.canPlay.apply(this, arguments);
	}, // end of Renderer.canPlay()


	/**
	 * Static reference to Renderer.canPlayType
	 * @see #Renderer.canPlayType()
	 */
	canPlayType: Renderer.canPlayType,


	/**
	 * Will this renderer be supported on this browser?
	 * @type {boolean}
	 */
	isSupported: FlashRenderer.isSupported
});


// Extend the FabuloosFlashRenderer's prototype
FabuloosFlashRenderer.extend({
	play: Renderer.shorthand("_play"), // element.play() is reserved by ActiveX, use _play


	/**
	 * Static reference to FlashRenderer.replace
	 * @see #FlashRenderer.replace()
	 */
	replace: FlashRenderer.replace
}); // end of FabuloosFlashRenderer.extend()


// Register this renderer
Renderer.register(FabuloosFlashRenderer);