//     (c) 2012 J. Thomas Martin
//     Smartmatch.js is freely distributable under the MIT license.
//     Portions of Smartmatch.js are inspired or borrowed from Underscore.js,
//     as well as Perl's smartmatch operator (http://perldoc.perl.org/perlop.html).

(function () {
  'use strict';

  // Establish the root object (`window` in the browser, `global` on server):
  var root = this
  // Create references for easy access to `toString` and `hasOwnProperty`:
    , toString = Object.prototype.toString
    , hasOwn = Object.prototype.hasOwnProperty;

  // Source and flags are the same:
  function reEqualsRe(x, y) {
    return x.source === y.source &&
           x.global === y.global &&
           x.multiline === y.multiline &&
           x.ignoreCase === y.ignoreCase;
  }

  // At least one element of `array` smartmatches `item`:
  function anyElementMatches(array, item) {
    var i = array.length;
    while (i > 0) {
      i -= 1;
      if (smartmatch(array[i], item)) {
        return true;
      }
    }
    return false;
  }

  // Corresponding array elements smartmatch each other:
  function allElementsMatch(x, y) {
    var i = x.length;
    if (i !== y.length) {
      // If different lengths, no need to match by element:
      return false;
    }
    while (i > 0) {
      i -= 1;
      if (!smartmatch(x[i], y[i])) {
        return false;
      }
    }
    return true;
  }

  // Values of common keys smartmatch one another:
  function commonKeysMatch(x, y) {
    var key;
    for (key in x) {
      if (hasOwn.call(y, key) && hasOwn.call(x, key) && !smartmatch(x[key], y[key])) {
        return false;
      }
    }
    return true;
  }

  // Core smartmatch function:
  function smartmatch(x, y) {
    var xClass = toString.call(x), yClass = toString.call(y);
    switch (xClass) {
      case '[object Function]':
        switch (yClass) {
          case '[object Function]': return x.toString() === y.toString();
          default:                  return !!x(y);
        }
      case '[object Array]':
        switch (yClass) {
          case '[object Function]': return !!y(x);
          case '[object Array]':    return allElementsMatch(x, y);
          default:                  return anyElementMatches(x, y);
        }
      case '[object Object]':
        switch (yClass) {
          case '[object Function]': return !!y(x);
          case '[object Array]':    return anyElementMatches(y, x);
          case '[object Object]':   return commonKeysMatch(x, y);
          default:                  return false;
        }
      case '[object RegExp]':
        switch (yClass) {
          case '[object Function]': return !!y(x);
          case '[object Array]':    return anyElementMatches(y, x);
          case '[object String]':
          case '[object Number]':
          case '[object Date]':     return x.test(y);
          case '[object RegExp]':   return reEqualsRe(x, y);
          default:                  return false;
        }
      case '[object String]':
        switch (yClass) {
          case '[object Function]': return !!y(x);
          case '[object Array]':    return anyElementMatches(y, x);
          case '[object RegExp]':   return y.test(x);
          case '[object Number]':   return x === String(y);
          case '[object Date]':     return +new Date(x) === +y;
          case '[object String]':   return x === y;
          default:                  return false;
        }
      case '[object Date]':
        switch (yClass) {
          case '[object Function]': return !!y(x);
          case '[object Array]':    return anyElementMatches(y, x);
          case '[object RegExp]':   return y.test(x);
          case '[object String]':   return +x === +new Date(y);
          case '[object Number]':
          case '[object Date]':     return +x === +y;
          default:                  return false;
        }
      case '[object Number]':
        switch (yClass) {
          case '[object Function]': return !!y(x);
          case '[object Array]':    return anyElementMatches(y, x);
          case '[object RegExp]':   return y.test(x);
          case '[object Date]':     return +x === +y;
          case '[object String]':   return String(x) === y;
          case '[object Number]':
            return x === y ? (x !== 0 || 1 / x === 1 / y) : x !== x && y !== y;
          default:                  return false;
        }
      default:
        switch (yClass) {
          case '[object Function]': return !!y(x);
          case '[object Array]':    return anyElementMatches(y, x);
          case '[object Object]':
          case '[object RegExp]':
          case '[object String]':
          case '[object Date]':
          case '[object Number]':   return false;
          default:                  return x === y;
        }
    }
  }

  // Export `smartmatch`.  If in browser, add `smartmatch` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = smartmatch;
    }
    exports.smartmatch = smartmatch;
  } else {
    root['smartmatch'] = smartmatch;
  }

}).call(this);