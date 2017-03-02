module.exports = function (Twig) {
  Twig.Templates.registerParser('source', params => params.data || '');
};
