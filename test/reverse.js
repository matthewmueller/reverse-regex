/**
 * Module Dependencies
 */

var reverse = require('../');
var assert = require('assert');

/**
 * Test
 */

// describe('reverse(regex)', function() {

// });

// console.log(reverse('ab[cd]*?a{1,}?'));
// console.log(reverse('(kiwi|pear)ab'));
// console.log(reverse('^ab(?:kiwi|pear)$'));
// console.log(reverse(/^\w+|\s+$/));
// console.log(reverse(/^(pear|kiwi)$/));
console.log(reverse(/^[^bcr]at$/g));

console.log(reverse(/\u2034\x12\w+/));
