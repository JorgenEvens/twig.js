// ## twig.path.js
//
// This file handles path parsing
const path = require('path');

module.exports = function (Twig) { // eslint-disable-line func-names
    /**
     * Namespace for path handling.
     */
  Twig.path = {};

    /**
     * Generate the canonical version of a url based on the given base path and file path and in
     * the previously registered namespaces.
     *
     * @param  {string} template The Twig Template
     * @param  {string} file     The file path, may be relative and may contain namespaces.
     *
     * @return {string}          The canonical version of the path
     */
  Twig.path.parsePath = function parsePath(template, file) {
    let namespaces = null;
    let file_path = file || '';

    if (typeof template === 'object' && typeof template.options === 'object') {
      namespaces = template.options.namespaces;
    }

    const hasNamespace = file_path.indexOf('::') > 0 || file_path.indexOf('@') >= 0;
    if (typeof namespaces === 'object' && hasNamespace) {
      Object.keys(namespaces).forEach((k) => {
        if (!Twig.isOwnProperty(namespaces, k)) return;

        file_path = file_path.replace(`${k}::`, namespaces[k]);
        file_path = file_path.replace(`@${k}`, namespaces[k]);
      });

      return file_path;
    }

    return Twig.path.relativePath(template, file_path);
  };

    /**
     * Generate the relative canonical version of a url based on the given base path and file path.
     *
     * @param {Twig.Template} template The Twig.Template.
     * @param {string} file The file path, relative to the base path.
     *
     * @return {string} The canonical version of the path.
     */
  Twig.path.relativePath = function relativePath(template, file) {
    const new_path = [];

    let base;
    let base_path;
    let sep_chr = '/';
    let val;
    let file_path = file || '';

    if (template.url) {
      if (typeof template.base !== 'undefined') {
        base = template.base + ((template.base.charAt(template.base.length - 1) === '/') ? '' : '/');
      } else {
        base = template.url;
      }
    } else if (template.path) {
      // Get the system-specific path separator
      const sep = path.sep || sep_chr;
      const relative = new RegExp(`^\\.{1,2}${sep.replace('\\', '\\\\')}`);
      file_path = file_path.replace(/\//g, sep);

      if (template.base !== undefined && file_path.match(relative) == null) {
        file_path = file_path.replace(template.base, '');
        base = template.base + sep;
      } else {
        base = path.normalize(template.path);
      }

      base = base.replace(sep + sep, sep);
      sep_chr = sep;
    } else if ((template.name || template.id) && template.method && template.method !== 'fs' && template.method !== 'ajax') {
            // Custom registered loader
      base = template.base || template.name || template.id;
    } else {
      throw new Twig.Error('Cannot extend an inline template.');
    }

    base_path = base.split(sep_chr);

        // Remove file from url
    base_path.pop();
    base_path = base_path.concat(file_path.split(sep_chr));

    while (base_path.length > 0) {
      val = base_path.shift();
      if (val === '.') {
        // Ignore
      } else if (val === '..' && new_path.length > 0 && new_path[new_path.length - 1] !== '..') {
        new_path.pop();
      } else {
        new_path.push(val);
      }
    }

    return new_path.join(sep_chr);
  };

  return Twig;
};
