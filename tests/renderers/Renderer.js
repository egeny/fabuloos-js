module("Renderer");

test("guessType() correctly detect MIME type", function() {
	var type, ext, expected;

	// Test all known extension
	for (type in Renderer.mimes) {
		for (ext in Renderer.mimes[type]) {
			expected = Renderer.mimes[type][ext].push ? Renderer.mimes[type][ext].join().replace(/([^,]+)/g, type + "/$1").split(",") : type + "/" + Renderer.mimes[type][ext];
			ext = ext.split(/,\s*/);

			for (i = 0, count = ext.length; i < count; i++) {
				deepEqual(Renderer.guessType(ext[i]), expected, 'guessType("' + ext[i] + '") should return ' + expected);
			}
		}
	}

	// Test an extension detection
	equal(Renderer.guessType("http://fabuloos.org/video.mp4"), "video/mp4", "Giving an URL should detect its type based on the extension");

	// Detect false positive
	equal(Renderer.guessType("http://fabuloos.org/video.m4v/manifest.m3u8"), "application/vnd.apple.mpegurl", "Makes sure guessType() retrieve the good extension");

	// Makes sure query parameters doesn't parasite
	equal(Renderer.guessType("http://fabuloos.org/video.m4v/manifest.m3u8?token=123456789type=mp4"), "application/vnd.apple.mpegurl", "Makes sure query parameters are ignored");
});