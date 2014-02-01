/**
 * Module Dependencies
 */

var reverse = require('../');
var assert = require('assert');

/**
 * Test
 */

describe('reverse(regex)', function() {

  it('should reverse regexs', function() {
    assert('a{1,}?[cd]*?ba' == reverse('ab[cd]*?a{1,}?').source)
    assert('ba(raep|iwik)' == reverse('(kiwi|pear)ab').source)
    assert('^(?:raep|iwik)ba$' == reverse('^ab(?:kiwi|pear)$').source)
    assert('^\\s+|\\w+$' == reverse(/^\w+|\s+$/).source)
    assert('^(\\x22|\\u2022)$' == reverse(/^(\u2022|\x22)$/).source)
  })

});
