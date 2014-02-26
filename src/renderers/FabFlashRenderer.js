/* global FlashRenderer */

/**
 * The FabFlashRenderer class
 * @constructor
 *
 * @see #Renderer.init() for signatures
 */
function FabFlashRenderer(config) {
	// Do the basic renderers' needed stuff
	this.init(config);
} // end of FabFlashRenderer()


/**
 * The URL of the SWF file
 * @type {string}
 */
FabFlashRenderer.swf = "FabFlashRenderer.swf";

/**
 * Supported MIME types
 * @type {object}
 */
FabFlashRenderer.types = {
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

// FabFlashRenderer can inherit and will inherit from Renderer
FabFlashRenderer.inherit = Renderer.inherit;
FabFlashRenderer.inherit(Renderer);

// FabFlashRenderer can extend and will extend itself (statically)
FabFlashRenderer.extend = Renderer.extend;
FabFlashRenderer.extend(FabFlashRenderer, {
	/**
	 * Define the identifier for this renderer
	 * @type {string}
	 */
	id: "FabFlashRenderer",


	/**
	 * Check if a given URL is readable by this renderer
	 * @see #Renderer.canPlay()
	 */
	canPlay: function canPlay() {
		// Test for RTMP or use the basic Renderer's canPlay
		return FabFlashRenderer.rRTMP.test(arguments[0]) ? "probably" : Renderer.canPlay.apply(this, arguments);
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
	isSupported: FlashRenderer.isSupported,


	/*!
	 * A RegExp used to check if an URL is an RTMP stream URL
	 * @type {RegExp}
	 */
	rRTMP: /^rtmp/i
});


// Extend the FabFlashRenderer's prototype
FabFlashRenderer.extend({
	play: Renderer.shorthand("_play"), // element.play() is reserved by ActiveX, use _play


	/**
	 * Static reference to FlashRenderer.replace
	 * @see #FlashRenderer.replace()
	 */
	replace: FlashRenderer.replace
}); // end of FabFlashRenderer.extend()


// Register this renderer
Renderer.register(FabFlashRenderer);