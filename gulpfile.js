var
	fs      = require("fs"),
	gulp    = require("gulp"),
	concat  = require("gulp-concat"),
	footer  = require("gulp-footer"),
	header  = require("gulp-header"),
	jscs    = require("gulp-jscs"),
	jshint  = require("gulp-jshint"),
	rename  = require("gulp-rename"),
	replace = require("gulp-replace"),
	uglify  = require("gulp-uglify"),

	project      = "fabuloos",
	version      = "1.0.0-alpha",
	uncompressed = project + "-" + version + ".js",
	minified     = project + "-" + version + ".min.js",
	license      = "/*! fabuloos v" + version + " | ©2014 eGeny, Inc. | apache.org/licenses/LICENSE-2.0 */\n",
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
		"src/renderers/FabFlashRenderer.js",
		"src/renderers/YoutubeRenderer.js",
		//"src/renderers/DailymotionRenderer.js",

		// Plugins
		"src/plugins/tracks.js",
		"src/plugins/playlist.js"
	],

	// JSHint options
	options = {
		curly:    true,
		eqeqeq:   true,
		freeze:   true,
		immed:    true,
		newcap:   false,
		noarg:    true,
		noempty:  true,
		quotmark: "double",
		undef:    true,
		unused:   true,
		trailing: true,

		browser:  true,

		globals: {
			fab:      true,
			Renderer: true,
		}
	};

gulp.task("build", function() {
	gulp.src(files)
	    .pipe(concat(uncompressed)) // Concatenate
	    .pipe(header(fs.readFileSync("./src/_begin.js"))) // Add the header
	    .pipe(footer(fs.readFileSync("./src/_end.js"))) // Add the footer
	    .pipe(replace('@VERSION', version)) // Replace the version token
	    .pipe(gulp.dest(folder)) // Save to build folder
	    .pipe(rename(minified)) // Rename for the minified version
	    .pipe(uglify()) // Well... Uglify
	    .pipe(header(license)) // Add the special header for minified version
	    .pipe(gulp.dest(folder)); // Save the minified version
});

gulp.task("lint", function() {
	gulp.src(files)
	    .pipe(jscs())
	    .pipe(jshint(options))
	    .pipe(jshint.reporter("jshint-stylish"));
});

gulp.task("default", ["lint", "build"]);