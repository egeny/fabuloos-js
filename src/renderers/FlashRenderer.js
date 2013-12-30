/*global Renderer */

/**
 * The base FlashRenderer class
 * @abstract @constructor
 */
function FlashRenderer() {}


/**
 * The params to use to the SWF markup
 * @type {object}
 */
FlashRenderer.params = {
	allowscriptaccess: "always",
	wmode: "transparent"
};

/**
 * Some plugin info to use for plugin detection
 * @type {object}
 */
FlashRenderer.plugin = {
	minVersion: "10.1",
	plugin:  "Shockwave Flash",
	activex: "ShockwaveFlash.ShockwaveFlash"
};


// FlashRenderer can extend and will extend itself (statically)
FlashRenderer.extend = Renderer.extend;
FlashRenderer.extend(FlashRenderer, {
	/**
	 * Test if the browser is an old IE (6, 7, 8)
	 * Used to change the HTML markup
	 * @type {boolean}
	 */
	isOldIE: (function() {
		// The hack !+"\v1" is not used here since it is badly minified using UglifyJS
		// Instead, we use browser sniffing (pretty bad but it remains a working solution)
		var match = navigator.userAgent.match(/MSIE (\d+)/);
		return match ? match[1] < 9 : false;
	}()),


	/**
	 * Is Flash supported on this browser?
	 * @type {boolean}
	 */
	isSupported: Renderer.isPluginSupported(FlashRenderer.plugin),


	/**
	 * Replace an element with a markup loading an SWF
	 *
	 * @param {Element} The element to replace.
	 * @return {Renderer} Return the current instance to allow chaining.
	 */
	replace: function replace(element) {
		var
			// Prepare the <object>'s attributes
			attributes = {
				id:     this.config.id, // We need an id
				name:   this.config.id, // ExternalInterface sometimes require a name
				width:  this.config.width, // Set a width, even if it is 0
				height: this.config.height, // Set an heigh, even if it is 0
				type:   "application/x-shockwave-flash", // Flash's MIME type
				data:   this.constructor.swf // The URL of the SWF
			},
			params = {}, // The <param>s to create
			object = document.createElement("object"), // The <object> !
			attribute, name, param; // Loop specific

		// Copy FlashRenderer.params, we might want to add a param later
		Renderer.extend(params, FlashRenderer.params);

		// Change the attributes for bad browsers
		if (FlashRenderer.isOldIE) {
			attributes.classid = "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000";
			params.movie       = attributes.data;
			delete attributes.type;
			delete attributes.data;
		}

		// Set the attributes
		for (attribute in attributes) {
			object[attribute] = attributes[attribute];
		}

		// Create the <param>s and append them
		for (name in params) {
			param = document.createElement("param");
			param.name  = name;
			param.value = params[name];

			object.appendChild(param);
		}

		// Save the references for the <object> and define the endpoint for the API
		this.element = this.api = object;

		// Element might be null (the player will exists only on memory)
		if (element) {
			// Replace the element with the new one
			element.parentNode.replaceChild(this.element, element);
		}

		return this; // Chaining
	} // end of replace()
});