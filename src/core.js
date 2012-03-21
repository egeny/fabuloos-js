/**
	@author <a href="mailto:nico@egeny.net">Nicolas Le Gall</a>
	@version @VERSION
*/

// Core module
(function( win ) {

	// Use JavaScript script mode
	"use strict";

	/*jshint curly: true, noempty: true, strict: true, boss: true, evil: false, smarttabs: true, sub: false */
	/*global browser, rhino */
	/*global HTMLMediaRenderer, FlashMediaRenderer, SilverlightMediaRenderer */

	var
		/**
			Create a simple function returning an instance of itself
			@name fabuloos
			@namespace
		*/
		fabuloos = function( id, config ) {
			if (!fabuloos.instances[id]) {
				fabuloos.instances[id] = new fabuloos.prototype.init( id, config );
			}

			return fabuloos.instances[id];
		};


	/**
		An expando to be used in the DOM
		@static
		@type string
	*/
	fabuloos.expando = "fabuloos" + (+new Date());


	// Is the class currently extending itself? Used to prevent code execution on init method during extending
	fabuloos.extending = false;


	/**
		A cache for all fabuloos' instances
		@static
		@type object
	*/
	fabuloos.instances = {};


	/**
		The current script's version
		@static
		@type string
	*/
	fabuloos.version = "@VERSION";


	/**
		@lends fabuloos.prototype
	*/
	fabuloos.prototype = {

		/**
			The ID attribute of the enhanced element
			@type string
		*/
		id: null,

		/**
			The whole instance configuration
			@type object
		*/
		_config: {
			renderers: [HTMLMediaRenderer, FlashMediaRenderer, SilverlightMediaRenderer]
		},

		/**
			The enhanced element
			@type Node
		*/
		element: null,

		/**
			The current renderer
			@type Renderer
		*/
		renderer: null,


		/**
			Create a new player instance using an existing &lt;video&gt; or &lt;audio&gt; tag. Allow to set a different configuration.
			@contructs

			@param {string} id The ID attribute of the source &lt;video&gt; or &lt;audio&gt; to enhance
			@param {object} [config={}] The player configuration

			@returns {fabuloos} Return a new player instance or false if the element doesn't exists

			@example
				var player = fabuloos("player");
				var player = fabuloos("player", { width: 720 });
		*/
		init: function( id, config ) {
			// Don't execute while extending
			if (fabuloos.extending) {
				return;
			}

			var
				// Prepare a local config var to avoid overriding the received one
				_config = {},

				// Loop specific
				property, value,
				i = 0, count;

			// Copy the received config in the local _config
			for (property in config) {
				_config[property] = config[property];
			}

			// Test the renderers
			this.config({ renderers: _config.renderers || this._config.renderers });

			// Store element's related stuff
			this.id      = id;
			this.element = document.getElementById( id );

			// An audio or video element was found, try to read its config
			if (this.element && /audio|video/i.test( this.element.nodeName )) {
				// Watch for defined attributes
				for (count = this.element.attributes.length; i < count; i++) {
					property = this.element.attributes[i].name;
					value    = this.element[property];

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
	fabuloos.prototype.init.prototype = fabuloos.prototype;


	/**
		Extend fabuloos with a given object literal. Simulating inheritance by giving access to _super.
		@static @function
		@see <a href="http://ejohn.org/blog/simple-javascript-inheritance/">John Resig - Simple JavaScript Inheritance</a>

		@param {object} obj The object literal containing the properties and methods to add to ftvPlayer

		@example
			<code>
			fabuloos.extend({
				play: function() {}
			});
			</code>
	*/
	fabuloos.extend = function( obj ) {
		// We are extending the main class, prevent code execution on init when copying the prototype
		fabuloos.extending = true;

		var
			// Set a RegExp to test for _super calls in methods
			fnTest = /xyz/.test(function() { "xyz"; }) ? /\b_super\b/ : /.*/,

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
			prototype[prop] = (typeof obj[prop] === "function" && typeof _super[prop] === "function" && fnTest.test(obj[prop])) ?
				createExtended(prop, obj[prop], _super) :
				obj[prop]; // Otherwise, simply add the property/method
		}

		// Saving the brand new prototype over the class' one
		this.prototype = prototype;

		// Remember to redefined the link of the init's prototype to the class prototype to allow instanciation
		this.prototype.init.prototype = this.prototype;

		// We're not extending anymore
		fabuloos.extending = false;
	}; // end of extend()


	// Expose
	win.fab = win.fabuloos = fabuloos;

}(window)); // end of Core module