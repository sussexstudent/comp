import * as path from 'path';
import * as _ from 'lodash';
import {
  Compfile,
  PageComponent,
  PageComponentMap,
  TemplateResult,
  TemplateResultMap,
} from './types';

export function loadCompfile(name = './compfile.js'): Compfile {
  const compfile = require(path.join(process.cwd(), name)).default;
  validateCompfile(compfile);
  return compfile;
}

export function getPageComponentFromConf(
  compfile: Compfile,
  componentPath: string
): PageComponent {
  return require(path.join(compfile.root, compfile.pages[componentPath]))
    .default;
}

export function getTemplatePartFromConf(
  compfile: Compfile,
  templateName: string,
  part: string
) {
  return require(path.join(
    compfile.root,
    compfile.templates[templateName][part]
  )).default;
}

export function resolveAllPages(compfile: Compfile) {
  const components: PageComponentMap = {};

  Object.keys(compfile.pages).forEach(componentPath => {
    components[componentPath] = getPageComponentFromConf(
      compfile,
      componentPath
    );
  });

  return components;
}

export function resolveAllTemplates(compfile: Compfile): TemplateResultMap {
  const templates: TemplateResultMap = {};
  try {
    Object.keys(compfile.templates).forEach(templateName => {
      const templateConfig = compfile.templates[templateName];

      const getPart = getTemplatePartFromConf.bind(
        null,
        compfile,
        templateName
      );
      const head = _.isString(templateConfig.head)
        ? getPart('head')
        : templateConfig.head;
      let templateResult: TemplateResult;

      if (
        Object.hasOwnProperty.call(templateConfig, 'templatePublic') &&
        Object.hasOwnProperty.call(templateConfig, 'templateLoggedIn')
      ) {
        templateResult = {
          head,
          templatePublic: getPart('templatePublic'),
          templateLoggedIn: getPart('templateLoggedIn'),
        };
      } else if (Object.hasOwnProperty.call(templateConfig, 'template')) {
        templateResult = {
          head,
          templatePublic: getPart('template'),
          templateLoggedIn: getPart('template'),
        };
      } else {
        throw new Error(
          `Either 'template' or ('templatePublic' and 'templateLoggedIn') are required. Missing from template: ${templateName}`
        );
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

export function validateCompfile(compfile: Compfile) {
  resolveAllPages(compfile);
  resolveAllTemplates(compfile);
}
