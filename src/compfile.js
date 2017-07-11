import path from 'path';
import isString from 'lodash/isString';

export function loadCompfile(name = './compfile.js') {
  const compfile = require(path.join(process.cwd(), name)).default;
  validateCompfile(compfile);
  return compfile;
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
      const templateConfig = compfile.templates[templateName];

      const getPart = getTemplatePartFromConf.bind(this, compfile, templateName);

      const templateResult = {
        head: isString(templateConfig.head)
          ? getPart('head')
          : templateConfig.head,
      };

      if (
        Object.hasOwnProperty.call(templateConfig, 'templatePublic')
        && Object.hasOwnProperty.call(templateConfig, 'templateLoggedIn')
      ) {
        templateResult.templatePublic = getPart('templatePublic');
        templateResult.templateLoggedIn = getPart('templateLoggedIn');
      } else if (Object.hasOwnProperty.call(templateConfig, 'template')) {
        templateResult.templatePublic = getPart('template');
        templateResult.templateLoggedIn = getPart('template');
      } else {
        throw new Error(`Either 'template' or ('templatePublic' and 'templateLoggedIn') are required. Missing from template: ${templateName}`);
      }

      templates[templateName] = templateResult;
    });
  } catch (err) {
    console.error('Failed to load templates');
    console.log(err);
    process.exit(1);
  }

  return templates;
}


export function validateCompfile(compfile) {
  resolveAllPages(compfile);
  resolveAllTemplates(compfile);
}
