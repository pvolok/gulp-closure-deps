var Buffer = require('buffer').Buffer;
var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through');

const PLUGIN_NAME = 'gulp-closure-deps';

var blockCommentRegex = /\/\*[^]*?\*\//g;
var cache = {};
var cwd, prefix, baseDir;
var moduleRegex = /^\s*goog\.module\(\s*['"](.+?)['"]\s*\)/;
var provideRegex = /^\s*goog\.provide\(\s*['"](.+?)['"]\s*\)/;
var requireRegex = /^\s*(?:(?:var|let|const)\s+[a-zA-Z_$][a-zA-Z0-9$_]*\s*=\s*)?goog\.require\(\s*['"](.+?)['"]\s*\)/;

var getMatches = function(contentsLines, regex) {
  var matches = [];
  contentsLines.forEach(function(line) {
    var match = line.match(regex);
    if (!match || matches.indexOf(match[1]) > -1) return;
    matches.push(match[1]);
  });
  return matches;
};

var argify = function(array) {
  return function() {
    return array.map(function(item) {
      return '\''+ item + '\'';
    }).join(', ');
  }
};

var extractDependency = function(filePath, contents) {
  var modules, provides, requires;

  // Goog base.js provides goog implicitly.
  if (contents.indexOf('* @provideGoog') != -1) {
    modules = [];
    provides = ['goog'];
    requires = [];
  }
  else {
    // Remove block comments to ignore commented goog.provide and goog.require.
    // http://stackoverflow.com/a/2458858/233902
    var contentsLines = contents.replace(blockCommentRegex, '').split('\n');
    modules = getMatches(contentsLines, moduleRegex);
    provides = getMatches(contentsLines, provideRegex).concat(modules).sort();
    if (!provides.length) return;
    requires = getMatches(contentsLines, requireRegex).sort();
  }
  var depsLine = 'goog.addDependency(\'%depsPath\', [%provides], [%requires]' +
    ', %isModule);';
  return depsLine
    .replace('%depsPath', path.join(prefix, path.relative(baseDir, filePath))
      .replace(cwd, '')
      // Fix for Windows.
      .replace(/\\/g, '/'))
    .replace('%provides', argify(provides))
    .replace('%requires', argify(requires))
    .replace('%isModule', String(!!modules.length));
};

module.exports = function(opt) {
  opt = opt || {};
  prefix = opt.prefix || '';
  baseDir = opt.baseDir || '';
  var fileName = opt.fileName || 'deps.js';
  var files = [];

  function bufferContents(file) {
    if (file.isNull()) return;
    if (file.isStream()) {
      return this.emit('error',
        new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
    }
    files.push(file);
  }

  function endStream() {
    if (!files.length) return this.emit('end');

    var firstFile = files[0];
    var lines = [];
    files.forEach(function(file) {
      cwd = file.cwd;
      var contents = file.contents.toString();
      var line = extractDependency(file.path, contents);
      if (!line) return;
      cache[file.path] = line;
      lines.push(line);
    });

    lines.sort();

    var contents = [
      '// This file was autogenerated by gulp-closure-deps plugin.',
      '// Please do not edit.'
    ].concat(lines).join('\n');

    var depsFile = new gutil.File({
      base: firstFile.base,
      contents: new Buffer(contents),
      cwd: firstFile.cwd,
      path: path.join(firstFile.base, fileName)
    });

    this.emit('data', depsFile);
    this.emit('end');
  }

  return through(bufferContents, endStream);
};

module.exports.changed = function(changedFilePath) {
  // We need at least once run deps to get prefix.
  if (!changedFilePath || !prefix) return true;
  var previous = JSON.stringify(cache);
  var contents = fs.readFileSync(changedFilePath, 'utf-8');
  cache[changedFilePath] = extractDependency(changedFilePath, contents);
  return previous != JSON.stringify(cache);
};
