import chalk from 'chalk';
import * as ui from './generator/ui';
import { renderComponents, renderTemplates } from './renderer';
import { getCompfile, resolveAllPages, resolveAllTemplates } from './compfile';
import {
  Compfile,
  HydroleafMode,
  PageComponentMap,
} from './types';
import { createContentCache } from './content';
import { writeFile } from "fs-extra";


export default async function() {
  ui.compTag();
  process.env['HYDROLEAF_MODE'] = HydroleafMode.RenderToString;
  let compfile: Compfile;
  try {
    compfile = await getCompfile();
    console.log(chalk`{green compfile loaded}`);
  } catch (e) {
    console.log(e);
    ui.missingCompfile();
    throw e;
  }

  const contentCache = createContentCache();
  let pages, templates;
  try {
    templates = await renderTemplates(
      resolveAllTemplates(compfile),
      compfile.assets,
    );

    let contentApiPages: PageComponentMap = {};

    if (compfile.contentApi) {
      const options = compfile.contentApi;
      const paths: Array<string> = await contentCache.getAllPaths(
        compfile.contentApi,
      );
      paths.forEach((path) => {
        contentApiPages[path] = options.template;
      });
    }

    const allPages = { ...resolveAllPages(compfile), ...contentApiPages };
    pages = await renderComponents(allPages, compfile.providers);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }

  if (pages === undefined || templates === undefined) {
    process.exit(1);
    return;
  }

  await writeFile('./deploy.json', JSON.stringify({
    union: templates,
  }));

  console.log('written to ./deploy.json');
}
