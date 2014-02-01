;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("reverse-regex/index.js", function(exports, require, module){
/**
 * Regexs
 */

var radditional = /^([\+\*]|{[^}]+})\??/;
var rparen = /^\((\?[\:\!\<\=]{1,2})?/;
var rspecials = /^\\(u[A-Fa-f0-9]{4}|x[A-Fa-f0-9]{2}|c[A-Za-z]|[dDwWsStrnvfb0\*\]\[\-\{\}\(\)\+\?\.\,\\\^\$\|\#\s])/

/**
 * Export `reverse`
 */

module.exports = reverse;

/**
 * Reverse the regex
 *
 * @param {String|Regex} regex
 * return {Regex}
 * @api public
 */

function reverse(regex) {
  var parser = new Parser(regex);
  return parser.parse();
}

/**
 * Initialize `Parser`
 *
 * Ex. ab[cd] => [cd]ba
 *
 * @param {Regex|String} regex
 * @return {Parser}
 * @api public
 */

function Parser(expr) {
  this.flags = '';

  // save the flags
  if (expr.source) {
    this.flags += (expr.global) ? 'g' : '';
    this.flags += (expr.ignoreCase) ? 'i' : '';
    this.flags += (expr.multiline) ? 'm' : '';
    this.original = expr = expr.source;
  } else {
    this.original = expr;
  }

  // trim leading and ending slashes
  this.str = expr.replace(/^\^|\$$/g, '');
  this.tokens = [];
  this.err = null;
  this.out = '';
}

/**
 * Parse the regex
 *
 * @return {Regex|Error} out
 * @api public
 */

Parser.prototype.parse = function() {
  while (!this.err && this.advance() != 'eos');
  if (this.err) return this.err;
  var original = this.original;
  this.out = /^\/?\^/.test(original) ? '^' + this.out : this.out;
  this.out += /\$\/?$/.test(original) ? '$' : '';
  return new RegExp(this.out, this.flags);
}

/**
 * Advance to the next token
 *
 * @return {String} token
 * @api public
 */

Parser.prototype.advance = function() {
  var tok = this.eos()
    || this.escaped()
    || this.paren()
    || this.bracket()
    || this.char()
    || this.error()

  this.tokens.push(tok);
  return tok;
}

/**
 * Consume the given `len`.
 *
 * @param {Number|Array} len
 * @api private
 */

Parser.prototype.skip = function(len){
  this.str = this.str.substr(Array.isArray(len)
    ? len[0].length
    : len);
};


/**
 * End of string
 *
 * @return {String|undefined} token
 * @api private
 */

Parser.prototype.eos = function() {
  if (!this.str.length) return 'eos';
};

/**
 * Escape character
 *
 * @return {String|undefined} token
 * @api private
 */

Parser.prototype.escaped = function() {
  var captures;
  if (captures = rspecials.exec(this.str)) {
    this.skip(captures);
    this.out = captures[0] + this.mod() + this.out;
    return 'slash';
  }
};

/**
 * Bracket
 */

Parser.prototype.bracket = function() {
  var captures;
  if (captures = /^\[/.exec(this.str)) {
    this.skip(captures);

    // find the end of the group
    var group = captures[0] + this.select(']');

    this.out = group + this.mod() + this.out;
    return 'bracket';
  }
}

/**
 * Parenthesis
 */

Parser.prototype.paren = function() {
  var captures;
  if (captures = rparen.exec(this.str)) {
    this.skip(captures);
    var group = this.select(')').slice(0, -1);
    this.out = captures[0] + reverse(group).source + ')' + this.out;
    return 'paren';
  }
}

/**
 * Character
 */

Parser.prototype.char = function() {
  var captures;
  if (captures = /^[\w\|\^]/.exec(this.str)) {
    this.skip(captures);
    this.out = captures[0] + this.mod() + this.out;
    return 'char';
  }
}

/**
 * Select up to the next str
 *
 * @param {String} str
 * @return {String}
 */

Parser.prototype.select = function(str) {
  var i = this.str.indexOf(str);
  if (!~i) return this.error('missing ending bracket: ' + str);
  var slice = this.str.slice(0, i + str.length);
  this.skip(i + str.length);
  return slice;
}

/**
 * Include the modifier (+, * {1,} (if present)
 *
 * @param {String} group
 * @return {String}
 */

Parser.prototype.mod = function() {
  var out = '';
  var m = radditional.exec(this.str);
  if (m) {
    out += m[0];
    this.skip(m[0].length);
  }

  return out;
}

/**
 * Handle errors
 *
 * @param {String} err (optional)
 * @return {String}
 * @api private
 */

Parser.prototype.error = function(err) {
  var original = this.original;
  var ellipsis = '\u2026';
  var caret = '\u2038';
  var i = original.length - this.str.length;

  // provide a useful error
  var at = original.slice(i - 20, i) + caret + original.slice(i, i + 20)
  at = original[i - 20] ? ellipsis + at : at
  at += original[i + 20] ? ellipsis : '';

  // add the message
  var msg = err || 'Parsing error.';
  msg += ' Near: ' + at;

  // set the error
  this.err = new Error(msg);

  return 'error';
};

});if (typeof exports == "object") {
  module.exports = require("reverse-regex");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("reverse-regex"); });
} else {
  this["reverse-regex"] = require("reverse-regex");
}})();