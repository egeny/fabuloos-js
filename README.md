# [![fabuloos](http://fabuloos.org/img/fabuloos.svg)](http://fabuloos.org)

[Fabuloos](http://fabuloos.org) is an unique, intuitive and powerful framework for media playback.

This README file will guide you through…

* [How to use](#how-to-use)
* [How to contribute](#how-to-contribute)
* [How to build](#how-to-build)
* [How to test](#how-to-test)
* [How to get support](#how-to-get-support)

## How to use

There is only 4 little steps to your success:

1. [Download](http://fabuloos.org/download/) the last stable version of fabuloos and add it to your project:
```
<script src="/js/fabuloos.min.js"></script>
```

2. Add an HTML5 `<video>` or `<audio>` element:
```
<video id="player" src="/videos/awesome.mp4"></video>
```

3. Make your player fabuloos:
```
<script>
  var player = fab("player");
</script>
```

4. Enjoy the [API](http://fabuloos.org/documentation/api/)!

You can also build a [custom version](#how-to-build) of fabuloos to include or exlude components.

## How to contribute

If you love fabuloos, first of all: **thank you**. Then, help us making it even better.

One of the most important thing you can do is to **spread the word**, talk about it (even if you have to criticize), **use it** (push it to the limits!) and if you find something missing or broken, [**request a feature**](https://github.com/egeny/fabuloos-js/issues/new) or [**report a bug**](https://github.com/egeny/fabuloos-js/issues/new).

If you are confident with writing code, you can also write (awesome) [**plugins**](http://fabuloos.org/documentation/plugins.html) and [**renderers**](http://fabuloos.org/documentation/renderers.html). Feel free to join us as a contributor by [**forking**](https://github.com/egeny/fabuloos-js/fork) and asking for [**pull requests**](https://github.com/egeny/fabuloos-js/compare/).

## How to build

In order to compile a custom version of fabuloos you have to install [node.js](http://nodejs.org) and [NPM](https://npmjs.org/).

* If you are on OSX, we recommend installing with [Homebrew](http://brew.sh/) (`brew install node` and have a coffee).
* If you are on Linux, you probably can use your beloved package manager.
* If you are on Windows, I'm sorry for you. OK, have a look [here](http://nodejs.org/download/).

Then, you have two options:

1. Launch `build.command` (double-clicking might work depending on your platform).  
The script will install the dependencies and, hopefully, build fabuloos.
2. Open a terminal console, browse to the folder and launch:  
	* `npm install gulp -g` to install [gulp](http://gulpjs.com) globally,
	* `npm install` to install the dependencies,
	* Finally, `gulp` to build fabuloos.

You should see a `build` folder with an uncompressed version and a minified one.

You can select which files to include during the build by editing the `gulpfile.js`.

The `FabuloosFlashRenderer` need its SWF file in order to have a Flash fallback. Have a look to the [dedicated repository](https://github.com/egeny/fabuloos-flash) to build it. A pre-compiled version is coming for your convenience.

## How to test

The testing procedure is ongoing.

## How to get support

For now, the only way to get support is through this [repository issues](https://github.com/egeny/fabuloos-js/issues).