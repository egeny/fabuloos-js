module("core");

test("Correctly exposed", function() {
	// Check for the main function
	ok(fab,      "window.fab");
	ok(fabuloos, "window.fabuloos");

	// Check for the main class
	ok(Fab,      "window.Fab");
	ok(Fabuloos, "window.Fabuloos");
});


test("fab() and cache", function() {
	ok(!Fab.instances.length, "The cache is empty");

	var player = fab("dummy");
	equal(Fab.instances.length, 1, "A created instance is stored in the cache");

	player = fab("dummy");
	equal(Fab.instances.length, 1, "Asking the same instance should return from the cache");

	// Destroy the player for future tests
	player = player.destroy();
});


test("Instances ID and UID consistancy", function() {
	Fab.UID = 0; // Makes sure we start counting at one

	var
		p1 = fab(),
		p2 = fab(),
		p3 = fab("div");

	equal(p1._.id, "fabuloos-1", "fab() should give `fabuloos-1` as id");
	equal(p2._.id, "fabuloos-2", "fab() should give `fabuloos-2` as id");
	equal(p3._.id, "div",        'fab("div") should give "div" as id');

	p1.restore();
	equal(p1._.id, "fabuloos-1", "p1.restore() should keep the same id");

	p3.restore();
	equal(p3._.id, "fabuloos-3", "p3.restore() should give `fabuloos-3` as id");

	p1.element("div");
	equal(p1._.id, "div", 'p1.element("div") should give "div" as id');

	p1.element(null);
	equal(p1._.id, "fabuloos-1", "p1.element(null) should give `fabuloos-1` as id");

	p3.element("video");
	equal(p3._.id, "video", 'p3.element("video") should give "video" as id');

	p3.element(null);
	equal(p3._.id, "fabuloos-3", "p3.element(null) should give `fabuloos-3` as id");

	p3.init();
	equal(p3._.id, "fabuloos-4", "p3.init() should increment uid and give `fabuloos-4` as id");

	p1.init("div");
	equal(p1._.id,  "div", 'p1.init("div") should increment uid and give "div" as id');
	equal(p1._.uid, 5,     "Now, p1's uid should be 5");
});


test("Multiple signature for fab() (strongly related to element())", function() {
	Fab.UID = 0; // Makes sure we start counting at one

	var
		player,
		player2,
		div1   = document.createElement("div"), // An element with an id
		div2   = document.createElement("div"); // An element without an id

	div1.id   = "div1";
	document.body.appendChild(div1); // We'll try to retrieve this <div> using document.getElementById()

	// Start by testing falsey (should create a new instance)
	player = fab(null);
	equal(player._.id,      "fabuloos-1", 'Calling `fab(null)` should give an instance with "fabuloos-1" as id');
	equal(player._.element, null,         'Calling `fab(null)` should give an instance with `null` as element');
	player.destroy();

	player = fab(undefined);
	equal(player._.id,      "fabuloos-2", 'Calling `fab(undefined)` should give an instance with "fabuloos-2" as id');
	equal(player._.element, null,         'Calling `fab(undefined)` should give an instance with `null` as element');
	player.destroy();

	player = fab(false);
	equal(player._.id,      "fabuloos-3", 'Calling `fab(false)` should give an instance with "fabuloos-3" as id');
	equal(player._.element, null,         'Calling `fab(false)` should give an instance with `null` as element');
	player.destroy();

	player = fab(0);
	equal(player._.id,      "fabuloos-4", 'Calling `fab(0)` should give an instance with "fabuloos-4" as id');
	equal(player._.element, null,         'Calling `fab(0)` should give an instance with `null` as element');
	player.destroy();

	player = fab(NaN);
	equal(player._.id,      "fabuloos-5", 'Calling `fab(NaN)` should give an instance with "fabuloos-5" as id');
	equal(player._.element, null,         'Calling `fab(NaN)` should give an instance with `null` as element');
	player.destroy();

	player = fab("");
	equal(player._.id,      "fabuloos-6", 'Calling `fab("")` should give an instance with "fabuloos-6" as id');
	equal(player._.element, null,         'Calling `fab("")` should give an instance with `null` as element');
	player.destroy();

	// Test Truthy (should create a new instance)
	player = fab(true);
	equal(player._.id,      "fabuloos-7", 'Calling `fab(true)` should give an instance with "fabuloos-7" as id');
	equal(player._.element, null,         'Calling `fab(true)` should give an instance with `null` as element');
	player.destroy();

	player = fab(1);
	equal(player._.id,      "fabuloos-8", 'Calling `fab(1)` should give an instance with "fabuloos-8" as id');
	equal(player._.element, null,         'Calling `fab(1)` should give an instance with `null` as element');
	player.destroy();

	player = fab([]);
	equal(player._.id,      "fabuloos-9", 'Calling `fab([])` should give an instance with "fabuloos-9" as id');
	equal(player._.element, null,         'Calling `fab([])` should give an instance with `null` as element');
	player.destroy();

	player = fab({});
	equal(player._.id,      "fabuloos-10", 'Calling `fab({})` should give an instance with "fabuloos-10" as id');
	equal(player._.element, null,          'Calling `fab({})` should give an instance with `null` as element');
	player.destroy();

	player = fab(function() {});
	equal(player._.id,      "fabuloos-11", 'Calling `fab(function() {})` should give an instance with "fabuloos-11" as id');
	equal(player._.element, null,          'Calling `fab(function() {})` should give an instance with `null` as element');
	player.destroy();

	// Test the real things
	player = fab("dummy");
	equal(player._.id,      "dummy", 'Calling `fab("dummy")` should give an instance with "dummy" as id');
	equal(player._.element, null,    'Calling `fab("dummy")` should give an instance with `null` as element');
	player.destroy();

	player = fab("div1");
	equal(player._.id,      "div1", 'Calling `fab("div1")` should give an instance with "div1" as id');
	equal(player._.element, div1,   'Calling `fab("div1")` should give an instance with div1 as element');
	player.destroy();

	player = fab("div2");
	equal(player._.id,      "div2", 'Calling `fab("div2")` should give an instance with "div2" as id');
	equal(player._.element, null,   'Calling `fab("div2")` should give an instance with `null` as element');
	player.destroy();

	player = fab("#div1");
	equal(player._.id,      "div1", 'Calling `fab("#div1")` should give an instance with "div1" as id');
	equal(player._.element, div1,   'Calling `fab("#div1")` should give an instance with div1 as element');
	player.destroy();

	player = fab(div1);
	equal(player._.id,      "div1", 'Calling `fab(div1)` should give an instance with "div1" as id');
	equal(player._.element, div1,   'Calling `fab(div1)` should give an instance with div1 as element');
	player.destroy();

	player = fab(div2);
	equal(player._.id,      "fabuloos-17", 'Calling `fab(div2)` should give an instance with "fabuloos-17" as id');
	equal(player._.element, div2,          'Calling `fab(div2)` should give an instance with div2 as element');
	player.destroy();

	// Test config mode
	player = fab({ element: "dummy" });
	equal(player._.id,      "dummy", 'Calling `fab({ element: "dummy" })` should give an instance with "dummy" as id');
	equal(player._.element, null,    'Calling `fab({ element: "dummy" })` should give an instance with `null` as element');
	player.destroy();

	player = fab({ element: "div1" });
	equal(player._.id,      "div1", 'Calling `fab({ element: { element: "div1" })` should give an instance with "div1" as id');
	equal(player._.element, div1,   'Calling `fab({ element: { element: "div1" })` should give an instance with div1 as element');
	player.destroy();

	player = fab({ element: "div2" });
	equal(player._.id,      "div2", 'Calling `fab({ element: { element: "div2" })` should give an instance with "div2" as id');
	equal(player._.element, null,   'Calling `fab({ element: { element: "div2" })` should give an instance with `null` as element');
	player.destroy();

	player = fab({ element: "#div1" });
	equal(player._.id,      "div1", 'Calling `fab({ element: { element: "#div1" })` should give an instance with "div1" as id');
	equal(player._.element, div1,   'Calling `fab({ element: { element: "#div1" })` should give an instance with div1 as element');
	player.destroy();

	player = fab({ element: div1 });
	equal(player._.id,      "div1", 'Calling `fab({ element: { element: div1 })` should give an instance with "div1" as id');
	equal(player._.element, div1,   'Calling `fab({ element: { element: div1 })` should give an instance with div1 as element');
	player.destroy();

	player = fab({ element: div2 });
	equal(player._.id,      "fabuloos-23", 'Calling `fab({ element: { element: div2 })` should give an instance with "fabuloos-23" as id');
	equal(player._.element, div2,         'Calling `fab({ element: { element: div2 })` should give an instance with div2 as element');
	player.destroy();
});


test('"Inheritance"', function() {
	var player = fab(); // Create a new player

	// Try the default state
	equal(player.life, undefined, "player.life doesn't exists");

	// Extend by adding a property with a Number as value
	Fab.extend({ life: 42 });
	equal(player.life, 42, "After extending player.life exists");

	// Extend the property for a method return its super (should be 42)
	Fab.extend({
		life: function() {
			return this._super;
		}
	});
	equal(player.life(), 42, "After extending player.life should be a function returning 42 by inheritance");

	// Extending another time should use the inheritance chain
	Fab.extend({
		life: function(nb) {
			return this._super() + nb;
		}
	});
	equal(player.life(3), 45, "After extending player.life should use the inheritance chain");

	// Destroy the player for future tests
	player.destroy();
});


test("Init should do its stuff", function() {
	Fab.UID = 0; // Makes sure we start counting at one
	Fab.instances.length = 0; // Empty the instances' cache

	var player = fab();

	ok(player._, "An instance should have its own private space");
	equal(player._.id, "fabuloos-1", "An instance should have an id");
	equal(player._.index, 0, "An instance should have a reference for its position in the cache");
	ok(player._.renderers, "An instance should have a renderers property");
});


test("Destroying the instance", function() {
	Fab.instances.length = 0; // Empty cache

	var
		player, player2,
		div   = document.createElement("div"),
		video = document.createElement("video");

	div.id = "div" + (+new Date());
	document.body.appendChild(div);

	player = fab(div);
	player._.element = video;

	document.body.replaceChild(video, div);

	player.destroy();
	equal(document.getElementById(div.id), div, "Destroying should restore the previous element");
	equal(Fab.instances.length, 0, "The cache should be empty");

	player  = fab();
	player2 = fab();
	player.destroy();
	equal(player2._.index, 0, "Destroying an instance should correct the other instances' indexes");
});


test("Restoring old element", function() {
	var
		player  = fab(),
		id      = player._.id,
		element = player._.element,
		old     = player._.old,
		div     = document.createElement("div"),
		div2    = document.createElement("div");

	div2.id = "dummy";

	document.body.appendChild(div);

	player.restore();
	equal(player._.id, id, "After restoring, the id should be the same as previously");

	player._.element = div;
	ok(player.restore(), "Restoring an element badly setted should fail silently");

	player._.element = null;
	player._.old     = div;
	ok(player.restore(), "Restoring an old element badly setted should fail silently");

	player._.element = div;
	player._.old     = div;
	ok(player.restore(), "Asking to restore for the same element should do nothing");

	player._.element = div;
	player._.old     = div2;
	player.restore();
	equal(document.getElementById("dummy"), div2, "Restore should swap element");
});
