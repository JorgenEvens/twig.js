module.exports = function (Twig) {
  Twig.Templates.registerParser('twig', params => new Twig.Template(params));
};
