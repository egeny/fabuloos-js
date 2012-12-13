/**
 * @author <a href="mailto:nico@egeny.net">Nicolas Le Gall</a>
 * @version @VERSION
 */

// Core module
(function( scope ) {

	// Use JavaScript script mode
	"use strict";

	/*global HTMLMediaRenderer, FlashMediaRenderer */

	var
		/**
		 * A simple function handling the instances cache (create a new if needed)
		 *
		 * @param {string} id The ID attribute of the source &lt;video&gt; or &lt;audio&gt; to enhance
		 * @param {object} [config={}] The player configuration
		 *
		 * @returns {fabuloos} Return a player instance or false if the element doesn't exists
		 */
		fab = function( id, config ) {
			if (!fab.instances[id]) {
				fab.instances[id] = new fab.prototype.init( id, config );
			}

			return fab.instances[id];
		};


	/**
	 * An expando to be used in the DOM
	 * @static
	 * @type string
	 */
	fab.expando = "fabuloos" + (+new Date());


	// Is the class currently extending itself? Used to prevent code execution on init method during extending
	fab.extending = false;


	/**
	 * A cache for all fabuloos' instances
	 * @static
	 * @type object
	 */
	fab.instances = {};


	/**
	 * A collection of regexp used to split and trim
	 * @static
	 * @type RegExp
	 */
	fab.rSplit = /\s+/;
	fab.rTrim  = /^\s+|\s+$/g;


	/**
	 * The current script's version
	 * @static
	 * @type string
	 */
	fab.version = "@VERSION";


	fab.prototype = {

		/**
		 * The ID attribute of the enhanced element
		 * @type string
		 */
		id: null,

		/**
		 * The whole instance configuration
		 * @type object
		 */
		_config: {
			renderers: [HTMLMediaRenderer, FlashMediaRenderer]
		},

		/**
		 * The enhanced element
		 * @type Node
		 */
		element: null,

		/**
		 * The current renderer
		 * @type Renderer
		 */
		_renderer: null,


		/**
		 * Create a new player instance using an existing &lt;video&gt; or &lt;audio&gt; tag. Allow to set a different configuration.
		 * @contructs
		 *
		 * @param {string} id The ID attribute of the source &lt;video&gt; or &lt;audio&gt; to enhance
		 * @param {object} [config={}] The player configuration
		 *
		 * @returns {fabuloos} Return a new player instance or false if the element doesn't exists
		 *
		 * @example
		 *  <code>
		 *    var player = fabuloos( "media" );
		 *    var player = fabuloos( "media", { width: 720 } );
		 *  </code>
		 */
		init: function( id, config ) {
			// Don't execute while extending
			if (fab.extending) {
				return;
			}

			var
				// Prepare a local config var to avoid overriding the received one
				_config = {},

				// Loop specific
				property, value,
				i = 0, count;

			// Handle undefined config
			config = config || {};

			// Copy the received config in the local _config
			for (property in config) {
				_config[property] = config[property];
			}

			// Test the renderers
			this.config({ renderers: _config.renderers || this._config.renderers });

			// Store element's related stuff
			this.id      = id;
			this.element = document.getElementById( id );

			// Use a closure to prepare a handleManager to correct the "this" keyword when receiving an event from a renderer
			this.handleManager = (function( instance ){
				return function() {
					return instance.trigger.apply( instance, arguments );
				};
			}( this ));

			// An audio or video element was found, try to read its config
			if (this.element && /audio|video/i.test( this.element.nodeName )) {
				// Watch for defined attributes
				for (count = this.element.attributes.length; i < count; i++) {
					property = this.element.attributes[i].name;
					value    = this.element.getAttribute( property ); // Use getAttribute to handle browser vendor specific attribute

					// Don't override if the property already exists
					if (!(property in config) && value) {
						_config[property] = value;
					}
				}
			}

			// Finally, save the received config
			this.config( _config );
		} // end of init()
	};

	// Set the init's prototype to fabuloos' one to allow instanciation of fabuloos using init
	fab.prototype.init.prototype = fab.prototype;


	/**
	 * Extend fabuloos with a given object literal. Simulating inheritance by giving access to _super.
	 * @static @function
	 * @see <a href="http://ejohn.org/blog/simple-javascript-inheritance/">John Resig - Simple JavaScript Inheritance</a>
	 *
	 * @param {object} obj The object literal containing the properties and methods to add to fabuloos
	 *
	 * @example
	 *  <code>
	 *    fabuloos.extend({
	 *      play: function() {}
	 *    });
	 *  </code>
	 */
	fab.extend = function( obj ) {
		// We are extending the main class, prevent code execution on init when copying the prototype
		fab.extending = true;

		var
			// Set a RegExp to test for _super calls in methods
			fnTest = /xyz/.test( function() { "xyz"; } ) ? /\b_super\b/ : /.*/,

			// Copy the current prototype to use it in _super magical methods
			_super = this.prototype,

			// Get the current instance state
			prototype = new this.prototype.init(),

			// Loop specific
			prop,

			// Define a function to create a function launching the extended method and giving access to _super
			createExtended = function( name, fn, _super ) {
				return function() {
					var
						ret, // The return value
						tmp = this._super; // Store the current _super to avoid overwritting

					// Give access to the _super method in the method
					this._super = _super[name];

					// Launch the function and store the result
					ret = fn.apply( this, arguments );

					// Restore the _super in case of bad overwritting (typically calling a different _super in a _super)
					this._super = tmp;

					return ret;
				};
			};

		// Loop through each property to extend
		for (prop in obj) {
			// Override the property if the new property value is a function and already exists
			prototype[prop] = (typeof obj[prop] === "function" && typeof _super[prop] === "function" && fnTest.test( obj[prop] )) ?
				createExtended( prop, obj[prop], _super ) :
				obj[prop]; // Otherwise, simply add the property/method
		}

		// Saving the brand new prototype over the class' one
		this.prototype = prototype;

		// Remember to redefined the link of the init's prototype to the class prototype to allow instanciation
		this.prototype.init.prototype = this.prototype;

		// We're not extending anymore
		fab.extending = false;
	}; // end of extend()


	/**
	 * Exception class
	 * @constructor
	 *
	 * @params {number} code The error code to create
	 *
	 * @returns {Exception} A new Exception instance
	 */
	function Exception( code ) {
		this.name = "fabuloos error";
		this.code = code;

		// Loop through each property to find the static var related to this code
		for (var prop in Exception) {
			if (Exception[prop] === code) {
				this.message = prop;
			}
		}
	} // end of Exception constructor

	Exception.prototype = new Error(); // Inherit from Error
	Exception.prototype.constructor = Exception; // Don't forget to correct the constructor

	// Mimic the DOMException error codes
	Exception.NOT_FOUND_ERR = 8;
	Exception.SYNTAX_ERR    = 12;


	// Expose
	fab.Exception  = Exception;
	scope.fabuloos = scope.fab = fab;

}( window )); // end of Core module
