/*global module:false*/
module.exports = function(grunt) {

	// Use JavaScript script mode
	"use strict";

	// Project configuration.
	grunt.initConfig({
		meta: {
			name: "fabuloos",
			version: "1.0.0-beta"
		},

		// Lint task
		lint: {
			files: ["src/**/*.js", "test/*.js"]
		},

		// Concatenation task
		concat: {
			src: {
				renderers: [
					"src/renderers/Renderer.js",
					"src/renderers/FlashRenderer.js",

					"src/renderers/HTMLMediaRenderer.js",
					"src/renderers/FlashMediaRenderer.js"
				],
				core: [
					"src/core.js",
					"src/event.js",
					"src/api.js",
					"src/tracks.js"
				],
				plugins: [
					"src/plugins/tracks.js",
					"src/plugins/playlist.js",
					"src/plugins/tracker.js",
					"src/plugins/ads.js"
				]
			},

			dest: "build/<%= meta.name %>-<%= meta.version %>.js"
		},

		// Minification task
		min: {
			src:  "build/<%= meta.name %>-<%= meta.version %>.js",
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
			}
		}
	});


	// Registering tasks
	grunt.registerTask("default", "lint concat min");

	grunt.registerTask("concat", "Concatenate files, replace @VERSION with meta.version value", function() {
		var
			// Get the files list
			files = grunt.config( "concat" ).src,

			// Prepare the output
			compiled, dest = grunt.config.process( "concat" ).dest;

		// Update the files list to fix unexisting files
		files = grunt.file.expandFiles( [].concat( files.renderers, files.core, files.plugins ) );

		// Compile the files
		compiled = grunt.helper( "concat", files );

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
			max = grunt.file.read( config.src ),
			min = grunt.helper( "uglify", max, grunt.config( "uglify" ) );

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