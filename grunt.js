/*global module:false*/
module.exports = function(grunt) {

	var name = 'fabuloos';

	// Project configuration.
	grunt.initConfig({
		meta: {
			name: 'fabuloos',
			version: '1.0'
		},
		lint: {
			files: ['grunt.js', 'src/**/*.js', 'test/**/*.js']
		},
		qunit: {
			files: ['test/**/*.html']
		},
		concat: {
			dist: {
				src: [
					'src/core.js',
					'src/event.js',
					'src/api.js'/*,
					'src/plugins/playlist.js',
					'src/plugins/tracker.js',
					'src/plugins/ads.js',
					'src/plugins/tracks.js'*/
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
				curly: true,
				eqeqeq: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				boss: true,
				eqnull: true,
				browser: true
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
			compiled = grunt.helper('concat', config.src);

		// Replace @VERSION with meta.version value
		compiled = compiled.replace(/@VERSION/g, grunt.config('meta.version'));

		// Write the file
		grunt.file.write(config.dest, compiled);

		// Log
		grunt.log.writeln('File "' + config.dest + '" created.');
	});

};
