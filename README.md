# fabuloos.js

## Contribute
-------------

There is many way to help the fabuloos project. Here is a quick start:

1. [Ways to contributing to the project](http://fabuloos.org/contribute)
2. [Report a bug or request a feature](http://bugs.fabuloos.org)
3. [Coding guidelines](http://fabuloos.org/contribute/js)
4. [Git guidelines](http://fabuloos.org/contribute/js)

## Building fabuloos
--------------------
(The command lines below are assumed to be launched in project's folder)

In order to build fabuloos, makes sure you have [NodeJS and NPM](http://nodejs.org) installed.  
Then, install the requested NPM modules with `npm install`.

Here is the collection of grunt tasks in order to build and check the fabuloos' code:

### default

```
grunt
```

Will launch the `lint:pre`, `concat`, `min` and `lint:post` tasks.

### lint

```
grunt lint
grunt lint:pre # (same as above)
grunt lint:post
```

This task launch JSHint on the sources files.  
Here is the JSHint options defined in the grunt file:

```
curly:     true
noempty:   true
strict:    true
boss:      true
evil:      false
smarttabs: true
sub:       false
validthis: true
browser:   true

globals: fab
```

You can specify some additional option per file using the JSHint comment syntax:

```
/*jshint newcap: false */
```

The default flag is `pre` to check all the files, you can use `post` to check the concatened file.

### concat

```
grunt concat
```

This task simply concatenate all the sources files in the final file.
To add or remove a plugin or a renderer you have to edit the grunt file.

### min

```
grunt min
```

This task simply minify using UglifyJS the concatened sources.

### qunit

```
grunt qunit
```

This task launch the unit tests in a phantomJS browser (so, please makes sure there is a PhantomJS installed in your system).

### lazytests

```
grunt lazytests
```

This task launch the unit tests in all available browsers sequentially.
Here is the browser searched on your system:

* Firefox (all versions including Aurora, Firefox Nightly and Firefox UX)
* Chrome including Chrome Canary
* Safari and WebKit
* Opera and Opera Next
* Internet Explorer (compatibility mode isn't supported due to differences in JavaScript implementation). IE will be launched via VMWare if found and configured in the grunt's configuration.
* Safari's iOS if the iOS Simulator can be found.