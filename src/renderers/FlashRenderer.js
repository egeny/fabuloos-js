(function( scope ) {

	// Use JavaScript script mode
	"use strict";

	/*global Renderer */

	/**
	 * The base FlashRenderer class
	 * @abstract @constructor
	 *
	 * @returns {FlashRenderer} A new FlashRenderer instance
	 */
	function FlashRenderer() {}


	// Set the constructor name if it doesn't exists (IE)
	// Beware to only set it if undefined, this property is read-only in strict mode
	if (!FlashRenderer.name) {
		FlashRenderer.name = "FlashRenderer";
	}

	FlashRenderer.prototype = new Renderer(); // Inherit from Renderer
	FlashRenderer.prototype.constructor = FlashRenderer; // Don't forget to correct the constructor


	/**
	 * Default plugin configuration
	 * @static
	 * @type {object}
	 */
	FlashRenderer.config = {
		width:  720,
		height: 405,
		type: "application/x-shockwave-flash",
		params: {
			allowscriptaccess: "always",
			wmode: "transparent"
		}
	};


	/**
	 * Some plugin info to use for plugin detection
	 * @static
	 * @type {object}
	 */
	FlashRenderer.plugin = {
		minVersion: "10.1",
		plugin:  "Shockwave Flash",
		activex: "ShockwaveFlash.ShockwaveFlash"
	};


	/**
	 * FlashRenderer initialization
	 * @static @function
	 *
	 * @param {object} instance The instance to extend
	 */
	FlashRenderer.init = function( instance ) {
		instance.config = Renderer.merge( instance.config, FlashRenderer.config ); // Merge the config with defaults
		instance        = Renderer.init( instance );

		// Makes sure we have an id and a name for ExternalInterface
		instance.config.name = instance.config.id;

		// Change the config for bad browsers
		if (FlashRenderer.isOldIE) {
			instance.config.classid      = "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000";
			instance.config.params.movie = instance.config.data;
			delete instance.config.type;
			delete instance.config.data;
		}

		return instance;
	}; // end of FlashRenderer.init()


	/**
	 * Test if the browser is an old IE (6, 7, 8). Used to change the markup.
	 * @static
	 * @type {boolean}
	 */
	FlashRenderer.isOldIE = (function() {
		// The old !+"\v1" is deprecated since it is badly minified using UglifyJS
		// Instead, use browser sniffing (sorry...)
		var match = navigator.userAgent.match(/MSIE (\d+)/);
		return match ? match[1] < 9 : false;
	}());


	// Extend the FlashRenderer prototype
	Renderer.extend(FlashRenderer.prototype, {

		/**
		 * Replace an element with the renderer markup
		 * @function
		 *
		 * @param {string|Element} The element or element id to replace
		 */
		replace: function() {
			var
				element = typeof arguments[0] === "string" ? document.getElementById( arguments[0] ) : arguments[0],
				markup  = "<object " + Renderer.formatTo( "attribute", this.config ) + ">" + Renderer.formatTo( "param", this.config.params ) + "</object>",
				container;

			if (FlashRenderer.isOldIE) {
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
		} // end of replace()

	}); // end of Renderer.extend()

	// Expose
	scope.FlashRenderer = FlashRenderer;

}( window ));
