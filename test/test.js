var gulp = require('gulp');
var fs = require('fs');
var es = require('event-stream');
var assert = require('assert');
var closureDeps = require('../');

describe('gulp-closure-deps', function() {
	it('should generate deps.js file', function(done) {
		gulp.src(__dirname + '/fixtures/**/*.js')
			.pipe(closureDeps({
        prefix: '../'
      }))
			.pipe(gulp.dest(__dirname + '/results/'))
			.pipe(es.wait(function() {
				assert.equal(
					fs.readFileSync(__dirname + '/results/deps.js', 'utf8'),
					fs.readFileSync(__dirname + '/expected/deps.js', 'utf8')
				);

				fs.unlinkSync(__dirname + '/results/deps.js');
				fs.rmdirSync(__dirname + '/results/');

				done();
			}));
	});
});
