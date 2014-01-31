/**
 * Module dependencies
 */

var debug = require('debug')('reverse-regex');

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
    || this.pipe()
    || this.caret()
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

    var group = captures[0];

    // optional modifier
    var m = radditional.exec(this.str);
    if (m) {
      group += m[0];
      this.skip(m[0].length);
    }

    this.out = group + this.out;

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

    // optional modifier
    var m = radditional.exec(this.str);
    if (m) {
      group += m[0];
      this.skip(m[0].length);
    }

    this.out = group + this.out;
    return 'bracket';
  }
}

/**
 * Pipe
 */

Parser.prototype.pipe = function() {
  var captures;
  if (captures = /^\|/.exec(this.str)) {
    this.skip(captures);
    this.out = '|' + this.out;
    return 'pipe';
  }
}

/**
 * Caret
 */

Parser.prototype.caret = function() {
  var captures;
  if (captures = /^\^/.exec(this.str)) {
    this.skip(captures);
    return 'caret';
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
    this.out = captures[0] + reverse(group) + ')' + this.out;
    return 'paren';
  }
}

/**
 * Character
 */

Parser.prototype.char = function() {
  var captures;
  if (captures = /^\w/.exec(this.str)) {
    this.skip(captures);
    var group = captures[0];

    // optional modifier
    var m = radditional.exec(this.str);
    if (m) {
      group += m[0];
      this.skip(m[0].length);
    }

    this.out = group + this.out;
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
