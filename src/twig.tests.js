// ## twig.tests.js
//
// This file handles expression tests. (is empty, is not defined, etc...)
module.exports = function (Twig) { // eslint-disable-line func-names
  Twig.tests = {
    empty(value) {
      if (value === null || value === undefined) return true;

      // Handler numbers
      if (typeof value === 'number') return false; // numbers are never "empty"

      // Handle strings and arrays
      if (value.length && value.length > 0) return false;

      // Handle objects
      return !Object.keys(value).some(key => Twig.isOwnProperty(value, key));
    },

    odd: value => value % 2 === 1,
    even: value => value % 2 === 0,
    divisibleby: (value, params) => value % params[0] === 0,
    defined: value => value !== undefined,
    none: value => value === null,
    null: value => Twig.tests.none(value), // Alias of none
    'same as': (value, params) => value === params[0],

    sameas(value, params) {
      console.warn('`sameas` is deprecated use `same as`');
      return Twig.tests['same as'](value, params);
    },
    iterable(value) {
      return value && (Twig.lib.is('Array', value) || Twig.lib.is('Object', value));
    },
    /*
    constant ?
    */
  };

  Twig.test = function test(name, value, params) {
    if (!Twig.tests[name]) {
      throw new Error(`Test ${name} is not defined.`);
    }
    return Twig.tests[name](value, params);
  };

  Twig.test.extend = function extendTest(name, definition) {
    Twig.tests[name] = definition;
  };

  return Twig;
};
