// ## twig.tests.js
//
// This file handles expression tests. (is empty, is not defined, etc...)
module.exports = function (Twig) {
  Twig.tests = {
    empty(value) {
      if (value === null || value === undefined) return true;
            // Handler numbers
      if (typeof value === 'number') return false; // numbers are never "empty"
            // Handle strings and arrays
      if (value.length && value.length > 0) return false;
            // Handle objects
      for (const key in value) {
        if (value.hasOwnProperty(key)) return false;
      }
      return true;
    },
    odd(value) {
      return value % 2 === 1;
    },
    even(value) {
      return value % 2 === 0;
    },
    divisibleby(value, params) {
      return value % params[0] === 0;
    },
    defined(value) {
      return value !== undefined;
    },
    none(value) {
      return value === null;
    },
    null(value) {
      return this.none(value); // Alias of none
    },
    'same as': function (value, params) {
      return value === params[0];
    },
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

  Twig.test = function (test, value, params) {
    if (!Twig.tests[test]) {
      throw `Test ${test} is not defined.`;
    }
    return Twig.tests[test](value, params);
  };

  Twig.test.extend = function (test, definition) {
    Twig.tests[test] = definition;
  };

  return Twig;
};
