import * as path from 'path';
import * as _ from 'lodash';
import {
  Compfile,
  CompfileWatcher,
  PageComponent,
  PageComponentMap,
  TemplateResult,
  TemplateResultMap,
} from './types';
import { createCompiler } from './compile';

export function createCompfileWatcher(
  name = './compfile.js'
): CompfileWatcher {
  const compiler = createCompiler(path.join(process.cwd(), name));
  let compfile: Compfile | null = null;

  compiler.watch({}, () => {
    console.log('recompiled from watch!');
    compfile = require(path.join(process.cwd(), 'comp-dist/union.main.js'))
      .default as Compfile;
  });

  return {
    getCompfile: () => compfile as any,
  };
}

export function getCompfile(name = './compfile.js'): Promise<Compfile> {
  const compiler = createCompiler(path.join(process.cwd(), name));

  return new Promise((resolve, _reject) => {
    compiler.run((_err, _stats) => {
      const compfile = require(path.join(
        process.cwd(),
        'comp-dist/union.main.js'
      )).default as Compfile;
      resolve(compfile);
    });
  });
}

export function getPageComponentFromConf(
  compfile: Compfile,
  componentPath: string
): PageComponent {
  return compfile.pages[componentPath].default;
}

export function getTemplatePartFromConf(
  compfile: Compfile,
  templateName: string,
  part: string
) {
  return compfile.templates[templateName][part].default;
}

export function resolveAllPages(compfile: Compfile) {
  const components: PageComponentMap = {};

  Object.keys(compfile.pages).forEach((componentPath) => {
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
    Object.keys(compfile.templates).forEach((templateName) => {
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
