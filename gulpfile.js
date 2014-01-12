var
	gulp   = require("gulp"),
	concat = require("gulp-concat"),
	footer = require("gulp-footer"),
	header = require("gulp-header"),
	jscs   = require("gulp-jscs"),
	jshint = require("gulp-jshint"),
	rename = require("gulp-rename"),
	uglify = require("gulp-uglify"),

	project      = "fabuloos",
	version      = "1.0.0-beta",
	uncompressed = project + "-" + version + ".js",
	minified     = project + "-" + version + ".min.js",
	license      = "/*! fabuloos v{{ version }} | ©2014 eGeny, Inc. | fabuloos.org/license */",
	folder       = "./build/",

	// File to build
	files  = [
		// Core modules
		"src/core.js",
		"src/event.js",
		//"src/api.js",

		// Renderers
		"src/renderers/Renderer.js",
		"src/renderers/FlashRenderer.js",
		"src/renderers/HTMLRenderer.js",
		"src/renderers/FabuloosFlashRenderer.js",
		"src/renderers/YoutubeRenderer.js",
		//"src/renderers/DailymotionRenderer.js",

		// Plugins
		"src/plugins/tracks.js",
		"src/plugins/playlist.js"
	],

	// JSHint options
	options = {
		"curly":    true,
		"eqeqeq":   true,
		"freeze":   true,
		"immed":    true,
		"newcap":   false,
		"noarg":    true,
		"noempty":  true,
		"quotmark": "double",
		"undef":    true,
		"unused":   true,
		"trailing": true,

		"browser":  true,

		"globals": {
			"fab":      true,
			"Renderer": true,
		}
	};

gulp.task("build", function() {
	gulp.src(files)
	    .pipe(header({ file: "./src/_begin.js", version: version })) // Add the header, change the version placeholder
	    .pipe(footer({ file: "./src/_end.js" })) // Add the footer
	    .pipe(concat(uncompressed)) // Concatenate
	    .pipe(gulp.dest(folder)) // Save to build folder
	    .pipe(rename(minified)) // Rename for the minified version
	    .pipe(uglify()) // Well... Uglify
	    .pipe(header(license, { version: version }))
	    .pipe(gulp.dest(folder)); // Save the minified version
});

gulp.task("lint", function() {
	gulp.src(files)
	    .pipe(jscs())
	    .pipe(jshint(options))
	    .pipe(jshint.reporter("jshint-stylish"));
});

gulp.task("default", function() {
	gulp.run("lint", "build");
});