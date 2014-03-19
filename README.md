# [gulp](http://gulpjs.com)-closure-deps [![Build Status](https://secure.travis-ci.org/steida/gulp-closure-deps.png?branch=master)](http://travis-ci.org/steida/gulp-closure-deps)

> Google Closure Library depswriter.py port for gulp


## Install

```
npm install --save-dev gulp-closure-deps
```


## Example

```js
var gulp = require('gulp');
var closureDeps = require('gulp-closure-deps');

var paths = {
  scripts: [
    'bower_components/closure-library/closure/goog/**/*.js',
    'bower_components/este-library/este/**/*.js',
    'client/**/*.js',
    'server/**/*.js'
  ]
};

gulp.task('default', function() {
  gulp.src(paths.scripts)
    .pipe(closureDeps({
      fileName: 'deps.js',
      pathPrefix: '../../../../'
    }))
    .pipe(gulp.dest('build'));
});
```

## API

### closureDeps(options)

#### options

##### fileName

Type: `String`  
Default: `deps.js`

Generated file name.

##### pathPrefix

Type: `String`  
Default: `empty string`

Path prefix for paths resolving, from Closure Library base.js to root.

## License

MIT © [Daniel Steigerwald](https://github.com/steida)
