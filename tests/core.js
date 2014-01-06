module("core");

test("Correctly exposed", function() {
	// Check for the main function
	ok(fab,      "window.fab");
	ok(fabuloos, "window.fabuloos");
});


test("fab() and cache", function() {
	fab.instances.length = 0; // Empty the cache to makes sure our tests will be correct

	ok(!fab.instances.length, "The cache is empty");

	var player = fab("dummy");
	equal(fab.instances.length, 1, "A created instance is stored in the cache");

	player = fab("dummy");
	equal(fab.instances.length, 1, "Asking the same instance should return from the cache");

	// Destroy the player for future tests
	player = player.destroy();
});


test("Instances ID and UID consistancy", function() {
	fab.UID = 0; // Makes sure we start counting at one

	var
		p1 = fab(),
		p2 = fab(),
		p3 = fab("div");

	equal(p1._id, "fabuloos-1", "fab() should give `fabuloos-1` as id");
	equal(p2._id, "fabuloos-2", "fab() should give `fabuloos-2` as id");
	equal(p3._id, "div",        'fab("div") should give "div" as id');

	p1.restore();
	equal(p1._id, "fabuloos-1", "p1.restore() should keep the same id");

	p3.restore();
	equal(p3._id, "fabuloos-3", "p3.restore() should give `fabuloos-3` as id");

	p1.element("div");
	equal(p1._id, "div", 'p1.element("div") should give "div" as id');

	p1.element(null);
	equal(p1._id, "fabuloos-1", "p1.element(null) should give `fabuloos-1` as id");

	p3.element("video");
	equal(p3._id, "video", 'p3.element("video") should give "video" as id');

	p3.element(null);
	equal(p3._id, "fabuloos-3", "p3.element(null) should give `fabuloos-3` as id");

	p3.init();
	equal(p3._id, "fabuloos-4", "p3.init() should increment uid and give `fabuloos-4` as id");

	p1.init("div");
	equal(p1._id,  "div", 'p1.init("div") should increment uid and give "div" as id');
	equal(p1._uid, "fabuloos-5", "Now, p1's uid should be `fabuloos-5`");
});


test("Multiple signature for fab() (strongly related to element())", function() {
	fab.UID = 0; // Makes sure we start counting at one

	var
		player,
		player2,
		div1   = document.createElement("div"), // An element with an id
		div2   = document.createElement("div"); // An element without an id

	div1.id   = "div1";
	document.body.appendChild(div1); // We'll try to retrieve this <div> using document.getElementById()

	// Start by testing falsey (should create a new instance)
	player = fab(null);
	equal(player._id,      "fabuloos-1", 'Calling `fab(null)` should give an instance with "fabuloos-1" as id');
	equal(player._element, null,         'Calling `fab(null)` should give an instance with `null` as element');
	player.destroy();

	player = fab(undefined);
	equal(player._id,      "fabuloos-2", 'Calling `fab(undefined)` should give an instance with "fabuloos-2" as id');
	equal(player._element, null,         'Calling `fab(undefined)` should give an instance with `null` as element');
	player.destroy();

	player = fab(false);
	equal(player._id,      "fabuloos-3", 'Calling `fab(false)` should give an instance with "fabuloos-3" as id');
	equal(player._element, null,         'Calling `fab(false)` should give an instance with `null` as element');
	player.destroy();

	player = fab(0);
	equal(player._id,      "fabuloos-4", 'Calling `fab(0)` should give an instance with "fabuloos-4" as id');
	equal(player._element, null,         'Calling `fab(0)` should give an instance with `null` as element');
	player.destroy();

	player = fab(NaN);
	equal(player._id,      "fabuloos-5", 'Calling `fab(NaN)` should give an instance with "fabuloos-5" as id');
	equal(player._element, null,         'Calling `fab(NaN)` should give an instance with `null` as element');
	player.destroy();

	player = fab("");
	equal(player._id,      "fabuloos-6", 'Calling `fab("")` should give an instance with "fabuloos-6" as id');
	equal(player._element, null,         'Calling `fab("")` should give an instance with `null` as element');
	player.destroy();

	// Test Truthy (should create a new instance)
	player = fab(true);
	equal(player._id,      "fabuloos-7", 'Calling `fab(true)` should give an instance with "fabuloos-7" as id');
	equal(player._element, null,         'Calling `fab(true)` should give an instance with `null` as element');
	player.destroy();

	player = fab(1);
	equal(player._id,      "fabuloos-8", 'Calling `fab(1)` should give an instance with "fabuloos-8" as id');
	equal(player._element, null,         'Calling `fab(1)` should give an instance with `null` as element');
	player.destroy();

	player = fab([]);
	equal(player._id,      "fabuloos-9", 'Calling `fab([])` should give an instance with "fabuloos-9" as id');
	equal(player._element, null,         'Calling `fab([])` should give an instance with `null` as element');
	player.destroy();

	player = fab({});
	equal(player._id,      "fabuloos-10", 'Calling `fab({})` should give an instance with "fabuloos-10" as id');
	equal(player._element, null,          'Calling `fab({})` should give an instance with `null` as element');
	player.destroy();

	player = fab(function() {});
	equal(player._id,      "fabuloos-11", 'Calling `fab(function() {})` should give an instance with "fabuloos-11" as id');
	equal(player._element, null,          'Calling `fab(function() {})` should give an instance with `null` as element');
	player.destroy();

	// Test the real things
	player = fab("dummy");
	equal(player._id,      "dummy", 'Calling `fab("dummy")` should give an instance with "dummy" as id');
	equal(player._element, null,    'Calling `fab("dummy")` should give an instance with `null` as element');
	player.destroy();

	player = fab("div1");
	equal(player._id,      "div1", 'Calling `fab("div1")` should give an instance with "div1" as id');
	equal(player._element, div1,   'Calling `fab("div1")` should give an instance with div1 as element');
	player.destroy();

	player = fab("div2");
	equal(player._id,      "div2", 'Calling `fab("div2")` should give an instance with "div2" as id');
	equal(player._element, null,   'Calling `fab("div2")` should give an instance with `null` as element');
	player.destroy();

	player = fab("#div1");
	equal(player._id,      "div1", 'Calling `fab("#div1")` should give an instance with "div1" as id');
	equal(player._element, div1,   'Calling `fab("#div1")` should give an instance with div1 as element');
	player.destroy();

	player = fab(div1);
	equal(player._id,      "div1", 'Calling `fab(div1)` should give an instance with "div1" as id');
	equal(player._element, div1,   'Calling `fab(div1)` should give an instance with div1 as element');
	player.destroy();

	player = fab(div2);
	equal(player._id,      "fabuloos-17", 'Calling `fab(div2)` should give an instance with "fabuloos-17" as id');
	equal(player._element, div2,          'Calling `fab(div2)` should give an instance with div2 as element');
	player.destroy();

	// Test config mode
	player = fab({ element: "dummy" });
	equal(player._id,      "dummy", 'Calling `fab({ element: "dummy" })` should give an instance with "dummy" as id');
	equal(player._element, null,    'Calling `fab({ element: "dummy" })` should give an instance with `null` as element');
	player.destroy();

	player = fab({ element: "div1" });
	equal(player._id,      "div1", 'Calling `fab({ element: { element: "div1" })` should give an instance with "div1" as id');
	equal(player._element, div1,   'Calling `fab({ element: { element: "div1" })` should give an instance with div1 as element');
	player.destroy();

	player = fab({ element: "div2" });
	equal(player._id,      "div2", 'Calling `fab({ element: { element: "div2" })` should give an instance with "div2" as id');
	equal(player._element, null,   'Calling `fab({ element: { element: "div2" })` should give an instance with `null` as element');
	player.destroy();

	player = fab({ element: "#div1" });
	equal(player._id,      "div1", 'Calling `fab({ element: { element: "#div1" })` should give an instance with "div1" as id');
	equal(player._element, div1,   'Calling `fab({ element: { element: "#div1" })` should give an instance with div1 as element');
	player.destroy();

	player = fab({ element: div1 });
	equal(player._id,      "div1", 'Calling `fab({ element: { element: div1 })` should give an instance with "div1" as id');
	equal(player._element, div1,   'Calling `fab({ element: { element: div1 })` should give an instance with div1 as element');
	player.destroy();

	player = fab({ element: div2 });
	equal(player._id,      "fabuloos-23", 'Calling `fab({ element: { element: div2 })` should give an instance with "fabuloos-23" as id');
	equal(player._element, div2,         'Calling `fab({ element: { element: div2 })` should give an instance with div2 as element');
	player.destroy();
});


test('"Inheritance"', function() {
	var player = fab(); // Create a new player

	// Try the default state
	equal(player.life, undefined, "player.life doesn't exists");

	// Extend by adding a property with a Number as value
	fab.extend({ life: 42 });
	equal(player.life, 42, "After extending player.life exists");

	// Extend the property for a method return its super (should be 42)
	fab.extend({
		life: function() {
			return this._super;
		}
	});
	equal(player.life(), 42, "After extending player.life should be a function returning 42 by inheritance");

	// Extending another time should use the inheritance chain
	fab.extend({
		life: function(nb) {
			return this._super() + nb;
		}
	});
	equal(player.life(3), 45, "After extending player.life should use the inheritance chain");

	// Destroy the player for future tests
	player.destroy();
});


test("Init should do its stuff", function() {
	fab.UID = 0; // Makes sure we start counting at one
	fab.instances.length = 0; // Empty the instances' cache

	var player = fab();

	equal(player._id, "fabuloos-1", "An instance should have an id");
});


test("Destroying the instance", function() {
	fab.instances.length = 0; // Empty cache

	var
		player, player2,
		div   = document.createElement("div"),
		video = document.createElement("video");

	div.id = "div" + (+new Date());
	document.body.appendChild(div);

	player = fab(div);
	player._element = video;

	document.body.replaceChild(video, div);

	player.destroy();
	equal(document.getElementById(div.id), div, "Destroying should restore the previous element");
	equal(fab.instances.length, 0, "The cache should be empty");
});


test("Restoring old element", function() {
	var
		player  = fab(),
		id      = player._id,
		element = player._element,
		old     = player._old,
		div     = document.createElement("div"),
		div2    = document.createElement("div");

	div2.id = "dummy";

	document.body.appendChild(div);

	player.restore();
	equal(player._id, id, "After restoring, the id should be the same as previously");

	player._element = div;
	ok(player.restore(), "Restoring an element badly setted should fail silently");

	player._element = null;
	player._old     = div;
	ok(player.restore(), "Restoring an old element badly setted should fail silently");

	player._element = div;
	player._old     = div;
	ok(player.restore(), "Asking to restore for the same element should do nothing");

	player._element = div;
	player._old     = div2;
	player.restore();
	equal(document.getElementById("dummy"), div2, "Restore should swap element");
});
