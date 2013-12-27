/**
 * TODO
 */
function HTMLRenderer(config) {
	// TODO
	console.log("HTMLRenderer");
} // end of HTMLRenderer()

var
	/*!
	 * Create a `<video>` in order to test browser's support
	 * @type {Element}
	 */
	tester = document.createElement("video");

// HTMLRenderer can inherit and will inherit from Renderer
HTMLRenderer.inherit = Renderer.inherit;
HTMLRenderer.inherit(Renderer);

// HTMLRenderer can extend and will extend itself (statically)
HTMLRenderer.extend = Renderer.extend;
HTMLRenderer.extend(HTMLRenderer, {
	/**
	 * Static reference to Renderer.canPlay
	 * @see #Renderer.canPlay()
	 */
	canPlay: Renderer.canPlay,


	/**
	 * Check if a given MIME type is readable by this renderer
	 *
	 * @param {string} type The MIME type to check
	 * @return {string} Returns "maybe" or "probably" is the MIME type is supported, "" otherwise
	 */
	canPlayType: function canPlayType(type) {
		return HTMLRenderer.isSupported ? tester.canPlayType(type) : "";
	}, // end of HTMLRenderer.canPlayType()


	/**
	 * Will this renderer be supported on this browser?
	 * @type {boolean}
	 */
	isSupported: !!tester.canPlayType
}); // end of HTMLRenderer.extend(HTMLRenderer)


HTMLRenderer.extend({
	/**
	 * TODO
	 */
	replace: function replace(element) {
		// TODO
	} // end of replace()
}); // end of HTMLRenderer.extend()

// Register this renderer
Renderer.register(HTMLRenderer);