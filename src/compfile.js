import path from 'path';
import isString from 'lodash/isString';

export function loadCompfile(name = './compfile.js') {
  return require(path.join(process.cwd(), name)).default;
}

export function getPageComponentFromConf(compfile, componentPath) {
  return require(path.join(compfile.root, compfile.pages[componentPath]))
    .default;
}

export function getTemplatePartFromConf(compfile, templateName, part) {
  return require(path.join(
    compfile.root,
    compfile.templates[templateName][part]
  )).default;
}

export function resolveAllPages(compfile) {
  const components = {};

  Object.keys(compfile.pages).forEach(componentPath => {
    components[componentPath] = getPageComponentFromConf(
      compfile,
      componentPath
    );
  });

  return components;
}

export function resolveAllTemplates(compfile) {
  const templates = {};

  try {
    Object.keys(compfile.templates).forEach(templateName => {
      const template = compfile.templates[templateName];
      templates[templateName] = {
        head: isString(template.head)
          ? getTemplatePartFromConf(compfile, templateName, 'head')
          : template.head,
        templatePublic: getTemplatePartFromConf(
          compfile,
          templateName,
          'templatePublic'
        ),
        templateLoggedIn: getTemplatePartFromConf(
          compfile,
          templateName,
          'templateLoggedIn'
        ),
      };
    });

  } catch (err) {
    console.error('Failed to load templates');
    console.log(err);
    process.exit(1);
  }

  return templates;
}
