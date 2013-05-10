module("api");

test("src() accept multiple signatures", function() {
	var
		player  = fab(),
		source  = "http://ad2play/ressources/demoreel-2009.mp4",
		source2 = "http://ad2play/ressources/demoreel-2009.ogv";

	equal(player._config.src, undefined, "There is no source when creating a new player");

	player.src(source);
	equal(player._config.src, source, "source");

	player.src({ src: source });
	equal(player._config.src, source, "{ src: source }");

	player.src({ src: source, type: "video/mp4" });
	equal(player._config.src, source, '{ src: source, type: "video/mp4" }');

	player.src([ source2, source ]);
	equal(player._config.src, source2, "Multiple sources (as string)");

	player.src([
		{ src: source2 },
		{ src: source }
	]);
	equal(player._config.src, source2, "Multiple sources (as hash)");

	player.src([
		{ src: source2, type: "video/ogv" },
		{ src: source,  type: "video/mp4" }
	]);
	equal(player._config.src, source2, "Multiple sources (as hash + type)");
});