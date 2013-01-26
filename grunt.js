module.exports = function( grunt ) {

	// Use JavaScript script mode
	"use strict";

	// Project configuration
	grunt.initConfig({
		meta: {
			name:    "fabuloos",
			version: "1.0.0-beta",
			banner:  "/*! <%= meta.name %> v<%= meta.version %> | (c) 2011, 2013 eGeny | fabuloos.org/license */"
		},

		// Lint task
		lint: {
			pre:  "src/**/*.js",
			test: "test/*.js",
			post: "<%= concat.dest %>"
		},

		// Concatenation task
		concat: {
			src: [
				// Core modules
				"src/core.js",
				"src/event.js",
				"src/api.js",
				"src/tracks.js",

				// Renderers
				"src/renderers/Renderer.js",
				"src/renderers/FlashRenderer.js",
				"src/renderers/HTMLMediaRenderer.js",
				"src/renderers/FlashMediaRenderer.js",

				// Plugins
				//"src/plugins/timed.js",
				"src/plugins/tracks.js",
				"src/plugins/playlist.js",
				"src/plugins/tracker.js",
				"src/plugins/ads.js"
			],

			dest: "build/<%= meta.name %>-<%= meta.version %>.js"
		},

		// Minification task
		min: {
			src:  "<%= concat.dest %>",
			dest: "build/<%= meta.name %>-<%= meta.version %>.min.js"
		},

		// QUnit task
		qunit: {
			files: ["test/**/*.html"]
		},

		// JSHint options
		jshint: {
			options: {
				curly:     true,
				noempty:   true,
				strict:    true,
				boss:      true,
				evil:      false,
				smarttabs: true,
				sub:       false,
				validthis: true,
				browser:   true
			},
			globals: {
				fab: true
			}
		}
	});


	// Registering tasks
	grunt.registerTask("default", "lint:pre concat min lint:post");

	grunt.registerTask("lint", "Launch JSHint to check source's conformance", function( flag ) {
		flag = flag ? flag : "pre"; // Makes sure we have a flag

		var
			files   = grunt.config( "lint" )[flag],     // Get the file list
			options = grunt.config( "jshint.options" ), // Get the JSHint config
			globals = grunt.config( "jshint.globals" ), // Get the JSHint globals' config
			content;

		// Loop through each files
		grunt.file.expandFiles( files ).forEach(function( file ) {
			// Ignore header and footer files
			if (file === "src/_begin.js" || file === "src/_end.js") { return; }

			// Get the content of the file (prepend header and append footer in "pre" mode)
			content = flag === "pre" ? grunt.helper( "concat", ["src/_begin.js", file, "src/_end.js"] ) : grunt.file.read( file );

			// Lint!
			grunt.helper( "lint", content, options, globals, file );
		});

		// Fail task if errors were logged.
		if (this.errorCount) { return false; }

		// Otherwise, print a success message.
		grunt.log.writeln( "Lint free." );
	});

	grunt.registerTask("concat", "Concatenate files, replace @VERSION with meta.version value", function() {
		var
			// Get the files list
			files = grunt.file.expandFiles( grunt.config( "concat" ).src ),

			// Compile them
			compiled = grunt.helper( "concat", [].concat( "src/_begin.js", files, "src/_end.js" ) ),

			// Prepare the output
			dest = grunt.config.process( "concat" ).dest;

		// Replace @VERSION with meta.version value
		compiled = compiled.replace( /@VERSION/g, grunt.config( "meta.version" ) );

		// Write the file
		grunt.file.write( dest, compiled );

		// Log
		grunt.log.writeln( 'File "' + dest + '" created.' );
	});

	grunt.registerTask("min", "Minify source file", function() {
		var
			config = grunt.config.process( "min" ),
			banner = grunt.config.process( "meta.banner" ),
			max = grunt.file.read( config.src ),
			min = banner + grunt.helper( "uglify", max, grunt.config( "uglify" ) );

		// Write the file
		grunt.file.write( config.dest, min );

		// Fail task if errors were logged.
		if (this.errorCount) { return false; }

		// Otherwise, print a success message....
		grunt.log.writeln( 'File "' + config.dest + '" created.');

		// ...and report some size information.
		grunt.helper( "min_max_info", min, max );
	});

};