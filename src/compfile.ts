import * as path from 'path';
import * as _ from 'lodash';
import {
  Compfile,
  CompfileWatcher,
  TemplateResult,
  TemplateResultMap,
} from './types';
import { createCompiler, createCompilerWatcher } from './compile';
import chalk from 'chalk';

const moduleDetectRegEx = /comp-dist\/union\.main\.js$/;

export function createCompfileWatcher(name = './compfile.js'): CompfileWatcher {
  const compiler = createCompilerWatcher(path.join(process.cwd(), name));
  let compfile: Compfile | null = null;

  compiler.on('compile', (err, _stats) => {
    if (err) {
      console.log(err);
    } else {
      console.log(chalk`{green Complied for server}`);
      Object.keys(require.cache).forEach((module) => {
        if (moduleDetectRegEx.test(require.cache[module].filename)) {
          console.log(
            chalk`{cyan Reloading ${require.cache[module].filename}}`,
          );
          delete require.cache[module];
        }
      });

      compfile = require(path.join(process.cwd(), 'comp-dist/union.main.js'))
        .default as Compfile;
    }
  });

  return {
    getCompfile: () => {
      return compfile as any;
    },
  };
}

export function getCompfile(name = './compfile.js'): Promise<Compfile> {
  const compiler = createCompiler(path.join(process.cwd(), name));

  return compiler.then(() => {
    const compfile = require(path.join(
      process.cwd(),
      'comp-dist/union.main.js',
    )).default as Compfile;
    return compfile;
  });
}

export function getTemplatePartFromConf(
  compfile: Compfile,
  templateName: string,
  part: string,
) {
  return compfile.templates[templateName][part].default;
}

export function resolveAllTemplates(compfile: Compfile): TemplateResultMap {
  const templates: TemplateResultMap = {};
  try {
    Object.keys(compfile.templates).forEach((templateName) => {
      const templateConfig = compfile.templates[templateName];

      const getPart = getTemplatePartFromConf.bind(
        null,
        compfile,
        templateName,
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
          `Either 'template' or ('templatePublic' and 'templateLoggedIn') are required. Missing from template: ${templateName}`,
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
