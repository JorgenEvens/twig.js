// ## twig.async.js
//
// This file handles asynchronous tasks within twig.
module.exports = function (Twig) { // eslint-disable-line func-names
  Twig.parseAsync = function parseAsync(tokens, context) {
    return Twig.parse.apply(this, [tokens, context, true]);
  };

  Twig.expression.parseAsync = function parseAsync(tokens, context, tokens_are_parameters) {
    return Twig.expression.parse.apply(this, [tokens, context, tokens_are_parameters, true]);
  };

  Twig.logic.parseAsync = function parseAsync(token, context, chain) {
    return Twig.logic.parse.apply(this, [token, context, chain, true]);
  };

  Twig.Template.prototype.renderAsync = function renderAsync(context, params) {
    return this.render(context, params, true);
  };

  Twig.async = {};

    /**
     * Checks for `thenable` objects
     */
  Twig.isPromise = function isPromise(obj) {
    return obj && (typeof obj.then === 'function');
  };

    /**
     * An alternate implementation of a Promise that does not fully follow
     * the spec, but instead works fully synchronous while still being
     * thenable.
     *
     * These promises can be mixed with regular promises at which point
     * the synchronous behaviour is lost.
     */
  Twig.Promise = function TwigPromise(executor) {
        // State
    let state = 'unknown';
    let value = null;
    let handlers = null;

    function append(onResolved, onRejected) {
      const h = {
        resolve: onResolved,
        reject: onRejected,
      };

      // The promise has yet to be rejected or resolved.
      if (state === 'unknown') {
        handlers = handlers || [];
        handlers.push(h);
        return;
      }

      // The state has been changed to either resolve, or reject
      // which means we should call the handler.
      if (h[state]) { h[state](value); }
    }

    function notify() {
      if (!handlers) return;

      Twig.forEach(handlers, (h) => {
        append(h.resolve, h.reject);
      });
      handlers = null;
    }

    function changeState(newState, v) {
      state = newState;
      value = v;
      notify();
    }
    function onResolve(v) { changeState('resolve', v); }
    function onReject(e) { changeState('reject', e); }

    function run(fn, resolve, reject) {
      let done = false;
      try {
        fn((v) => {
          if (done) return;
          done = true;
          resolve(v);
        }, (e) => {
          if (done) return;
          done = true;
          reject(e);
        });
      } catch (e) {
        done = true;
        reject(e);
      }
    }

    function ready(result) {
      try {
        if (!Twig.isPromise(result)) {
          onResolve(result);
          return;
        }

        run(result.then.bind(result), ready, onReject);
      } catch (e) {
        onReject(e);
      }
    }

    run(executor, ready, onReject);

    return {
      then(onResolved, onRejected) {
        const hasResolved = typeof onResolved === 'function';
        const hasRejected = typeof onRejected === 'function';

        return new Twig.Promise((resolve, reject) => {
          append((result) => {
            if (hasResolved) {
              try {
                resolve(onResolved(result));
              } catch (e) {
                reject(e);
              }
            } else {
              resolve(result);
            }
          }, (err) => {
            if (hasRejected) {
              try {
                resolve(onRejected(err));
              } catch (e) {
                reject(e);
              }
            } else {
              reject(err);
            }
          });
        });
      },
      catch(onRejected) {
        return this.then(null, onRejected);
      },
    };
  };

  Twig.Promise.resolve = function promiseResolve(value) {
    return new Twig.Promise(resolve => resolve(value));
  };

  Twig.Promise.reject = function promiseReject(e) {
    return new Twig.Promise((resolve, reject) => reject(e));
  };

  Twig.Promise.all = function promiseAll(promises) {
    const results = [];

    return Twig.async.forEach(promises, (p, index) => {
      if (!Twig.isPromise(p)) {
        results[index] = p;
        return null;
      }

      return p.then((v) => {
        results[index] = v;
      });
    })
    .then(() => results);
  };

    /**
    * Go over each item in a fashion compatible with Twig.forEach,
    * allow the function to return a promise or call the third argument
    * to signal it is finished.
    *
    * Each item in the array will be called sequentially.
    */
  Twig.async.forEach = function forEachAsync(arr, callback) {
    let arg_index = 0;
    const callbacks = {};
    const length = arr.length;
    const promise = new Twig.Promise((resolve, reject) => {
      callbacks.resolve = resolve;
      callbacks.reject = reject;
    });

    function fail(err) {
      callbacks.reject(err);
    }

    function next(value) {
      if (!Twig.isPromise(value)) {
        iterate(); // eslint-disable-line no-use-before-define
        return;
      }

      value.then(next, fail);
    }

    function iterate() {
      const index = arg_index;
      arg_index += 1;

      if (index === length) {
        callbacks.resolve();
        return;
      }

      next(callback(arr[index], index));
    }

    iterate();

    return promise;
  };

  return Twig;
};
