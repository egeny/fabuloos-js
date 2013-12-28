/*global Renderer */

/**
 * The HTMLRenderer class
 * @constructor
 *
 * @see #Renderer.init() for signatures
 */
function HTMLRenderer(config) {
	// Do the basic renderers' needed stuff
	this.init(config);
} // end of HTMLRenderer()


var
	/*!
	 * A RegExp used to test if an element is <audio> or <video>
	 * @type {RegExp}
	 */
	rMedia = /audio|video/i,

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


// Extend the HTMLRenderer's prototype
HTMLRenderer.extend({
	/**
	 * Fix some browser inconsistencies and bugs
	 *
	 * @params {undefined}
	 * @return {HTMLRenderer} Return the current instance to allow chaining.
	 */
	fix: function fix() {
		// Don't bother if there is no element or if it is already fixed
		if (!this.element || this.element.fixed) {
			return this; // Chaining
		}

		/*!
		 * Browser sniffing is very bad, but in this case it is the only way to detect this bug
		 * It affects only WebKit version prior to 535
		 */

		var
			version = /AppleWebKit\/([\d]+)/.exec(navigator.userAgent);
			version = version ? parseInt(version[1], 10) : null;

		if (version && version < 535) {
			/**
			 * Fix for an old webkit bug affecting "ended" event
			 * @see https://bugs.webkit.org/show_bug.cgi?id=61336
			 */
			this.element.addEventListener("loadeddata", function() {
				// Using a try/catch to avoid webkit (mobile version) to yield about negative DOM value
				try {
					/**
					 * 0 will not work since we must trigger a seek
					 * We have to seek to a value near 0, 1e-5 (0.00001) seems good
					 */
					this.currentTime = 1e-5;
				} catch (e) {}
			}, false);
		} // end of if (version && version < 535)

		// This element is now fixed
		this.element.fixed = true;
	}, // end of fix()


	/**
	 * HTMLRenderer are always ready
	 * @type {boolean}
	 */
	isReady: true,


	/**
	 * Replace an element with the renderer's markup
	 *
	 * @param {Element} The element to replace.
	 * @return {HTMLRenderer} Return the current instance to allow chaining.
	 */
	replace: function replace(element) {
		// Check if we are extending an existing <audio> or <video>
		if (element && rMedia.test(element.nodeName)) {
			// Simply use the element
			this.element = element;
		} else {
			// Otherwise, create a blank element
			this.element = document.createElement("video");

			// Set the element's attributes according to configuration
			for (var prop in this.config) {
				this.element[prop] = this.config[prop];
			}
		}

		// With <audio> or <video> the API is the element itself
		this.api = this.element;

		// Fix implementation problems
		this.fix();

		// Element might be null (the player will exists only on memory)
		if (element) {
			// Replace the element with the new one
			element.parentNode.replaceChild(this.element, element);
		}

		return this; // Chaining
	} // end of replace()
}); // end of HTMLRenderer.extend()


// Register this renderer
Renderer.register(HTMLRenderer);