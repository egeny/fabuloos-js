/**
 * The base Renderer class
 * @abstract @constructor
 */
function Renderer() {}


/**
 * An hash of MIME types associated to extensions
 * @type {object}
 */
Renderer.mimes = {
	application: {
		m3u8: "vnd.apple.mpegurl",
		f4m: "f4m+xml",
		"smil, csmil": ["smil+xml", "smil"]
	},
	video: {
		"3gp": "3gpp",
		"3g2": "3gpp2",
		flv: "x-flv",
		m4v: ["x-m4v", "m4v"],
		ogv: "ogg",
		"mp4, f4v, f4p": "mp4",
		"mov, qt": "quicktime",
		webm: "webm",
		wmv: "x-ms-wmv"
	},
	audio: {
		f4a: "mp4",
		mp3: "mpeg",
		m4a: "x-m4a",
		"ogg, oga": "ogg",
		wav: ["wav", "wave", "x-wav"],
		weba: "webm",
		wma: "x-ms-wma"
	}
};


var
	/*!
	 * A RegExp used to extract the file extension from an URL
	 * @type {RegExp}
	 */
	rExt = /\.([\w\d])+(?=\/|\?|#|$)/g,

	/*!
	 * A RegExp to retrieve a function's name
	 * @type {RegExp}
	 */
	rFunction = /function (\w+)/;


/**
 * Extend some objects or the this' prototype
 * Be careful when passing more than two arguments since this method
 * add some properties from the last argument, to the first : obj1 <- obj2 <- obj3.
 *
 * @param {object} obj The object to merge to the prototype.
 * @return {undefined} Return nothing.
 *
 * @param {object} ... The objects to merge together.
 * @return {undefined} Return nothing.
 */
Renderer.extend = function extend(obj) {
	var
		args = Array.prototype.slice.call(arguments), // Cast arguments to array
		i, source, target, prop; // Loop specific

	// If we have only one argument we want to augment the prototype
	if (args.length === 1) {
		args.unshift(this.prototype);
	}

	// Loop through arguments from the end
	for (i = args.length - 1; i > 0; i--) {
		source = args[i]; // More convenient
		target = args[i - 1]; // More convenient

		// Loop through each property to extend
		for (prop in source) {
			// Override the target's value with the new value or a facade function if necessary
			target[prop] = source[prop];
		}
	}
}; // end of Renderer.extend()


// Extend the Renderer's "class" with static members
Renderer.extend(Renderer, {
	/**
	 * Check if a given URL is readable by this renderer
	 *
	 * @param {string} url The url to check
	 * @param {string|array} type The MIME type(s) associated to this URL
	 * @return {string} Return "probably" or "maybe" if the MIME type is supported, "" (empty string) otherwise
	 */
	canPlay: function canPlay(url, type) {
		var
			// Get or guess the MIME type (we can receive "undefined", treat it like a MIME)
			mime = arguments.length === 2 ? type : Renderer.guessType(url),
			i = 0, count, // Loop specific
			result, canPlayType = ""; // Prepare the result (default to "" if we doesn't have any MIME type)

		// Work only with array, more convenient
		mime = mime || []; // Don't bother to loop if we doesn't have a MIME type
		mime = mime.push ? mime : [mime]; // "cast" regular MIME type to array

		// Loop through MIME types (for some extensions we can have multiple MIME types)
		for (count = mime.length; i < count; i++) {
			// Test the MIME type
			result = this.canPlayType(mime[i]);

			// Ouh, nice result, exit
			if (result === "probably") {
				return result;
			}

			// Meh. Continue in case we found a probably
			canPlayType = canPlayType || result;
		}

		// Return the result (may be "", "maybe" or "probably")
		return canPlayType;
	}, // end of Renderer.canPlay()


	/**
	 * Check if a given MIME type is readable by this renderer
	 *
	 * @param {string} type The MIME type to check
	 * @return {string} Returns "maybe" or "probably" is the MIME type is supported, "" otherwise
	 */
	canPlayType: function canPlayType(type) {
		return this.types[type] || "";
	}, // end of Renderer.canPlayType()


	/**
	 * Try to guess the MIME type based on an extension or an URL
	 *
	 * @param {string} ext The extension or URL to use to guess MIME type
	 * @return {string|array|false} Returns a string or an array of MIME types. undefined if the extension is unknown.
	 */
	guessType: function guessType(ext) {
		var type, key;

		// Treat ext as full URL if its length is more than 5 characters
		if (ext && ext.length > 5) {
			ext = ext.match(rExt); // Get the probable extensions
			ext = ext ? ext[ext.length - 1].substring(1) : ""; // Keep the last one
		}

		// Exit if we don't have an extension to test
		if (!ext) { return; }

		// Transforming the extension to a RegExp, easier to find in Renderer.mimes' keys
		ext = new RegExp(ext, "i");

		for (type in Renderer.mimes) {
			for (key in Renderer.mimes[type]) {
				// Check if this key is the extension we're looking for
				if (ext.test(key)) {
					// Check if the MIME is an array
					if (Renderer.mimes[type][key].push) {
						// Before returning, append the type in front of MIMEs
						return Renderer.mimes[type][key].join().replace(rAppendType, type + "/$1").split(",");
					} else {
						return type + "/" + Renderer.mimes[type][key];
					}
				}
			} // end of for (ext in Renderer.mimes[type])
		} // end of for (type in Renderer.mimes)

		// Return undefined if extension is unknown
		return;
	}, // end of Renderer.guessType()


	/**
	 * Inherit from a class
	 * This function seems strange because it is.
	 * It is only a sugar to ease developper's pain.
	 *
	 * @param {function} base The base class to inherit to.
	 * @return {undefined} Return nothing.
	 *
	 * @example
	 *   function LambdaRenderer() {} // Create a new "class"
	 *   LambdaRenderer.inherit = Renderer.inherit; // LambdaRenderer now know to inherit
	 *   LambdaRenderer.inherit(Renderer); // Inherit from Renderer
	 */
	inherit: function inherit(base) {
		// Set the constructor's name if it doesn't exists (IE)
		// Beware to only set it if undefined, this property is read-only in strict mode
		if (!this.name) {
			var name = rFunction.exec(this.toString()); // Search for the function name
			this.name = name ? name[1] : "unknown"; // Define the name or define to "unknown"
		}

		this.prototype = new base(); // Inherit from the base
		this.prototype.constructor = this; // Correct the constructor
	}, // end of Renderer.inherit()


	/**
	 * Add a renderer to the list of supported renderers
	 *
	 * @param {Renderer} renderer The renderer to register.
	 * @return {undefined} Return nothing.
	 */
	register: function register(renderer) {
		if (renderer.isSupported) {
			this.supported.push(renderer);
		}
	}, // end of Renderer.register()


	/**
	 * A list of currently supported renderers
	 * @type {array}
	 */
	supported: []
}); // end of Renderer.extend(Renderer)