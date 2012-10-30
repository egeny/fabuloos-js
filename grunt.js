/*global module:false*/
module.exports = function(grunt) {

	// Use JavaScript script mode
	"use strict";

	var name = 'fabuloos';

	// Project configuration.
	grunt.initConfig({
		meta: {
			name: 'fabuloos',
			version: '1.0'
		},
		lint: {
			files: ['grunt.js', '<config:concat.dist.src>', 'test/**/*.js']
		},
		qunit: {
			files: ['test/**/*.html']
		},
		concat: {
			dist: {
				src: [
					'src/renderers/Renderer.js',
					'src/renderers/HTMLMediaRenderer.js',
					'src/renderers/FlashMediaRenderer.js',
					'src/core.js',
					'src/event.js',
					'src/api.js',
					'src/plugins/playlist.js',
					'src/plugins/tracker.js',
					'src/plugins/ads.js',
					'src/plugins/tracks.js'
				],
				dest: 'build/' + name + '.js'
			}
		},
		min: {
			dist: {
				src: ['build/' + name + '.js'],
				dest: 'build/' + name + '.min.js'
			}
		},
		watch: {
			files: '<config:lint.files>',
			tasks: 'lint qunit'
		},
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
			globals: {}
		},
		uglify: {}
	});

	// Default task.
	grunt.registerTask('default', 'lint qunit concat min');
	grunt.registerTask('concat', "Concatenate files, replace @VERSION with meta.version value", function() {
		var
			config   = grunt.config('concat.dist'),
			files    = grunt.file.expandFiles(config.src),
			compiled = grunt.helper('concat', files);

		// Replace @VERSION with meta.version value
		compiled = compiled.replace(/@VERSION/g, grunt.config('meta.version'));

		// Write the file
		grunt.file.write(config.dest, compiled);

		// Log
		grunt.log.writeln('File "' + config.dest + '" created.');
	});

};
