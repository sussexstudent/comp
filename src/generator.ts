import * as _ from 'lodash';
import chalk from 'chalk';
import * as git from 'git-rev';
import * as ncp from 'copy-paste';
import * as ui from './generator/ui';
import { createChangesGenerator } from './generator/changes';
import { findDirtyComponents, loadSnapshot, saveSnapshot } from './state';
import { renderComponents, renderTemplates } from './renderer';
import { getCompfile, resolveAllPages, resolveAllTemplates } from './compfile';
import {
  Compfile,
  DirtyChangeset,
  HydroleafMode,
  PageComponentMap,
  StateSnapshot,
} from './types';
import { createContentCache } from './content';

function differencesUI(differences: DirtyChangeset, next: StateSnapshot) {
  // exit if nothing
  if (
    differences.dirtyTemplates.length <= 0 &&
    differences.dirtyPages.length <= 0
  ) {
    console.log(
      chalk`{red No Changes!}. Use {blue -f} to force all, {blue -p} to name pages and {blue -t for templates}`,
    );
    return;
  }

  ui.renderDifferencesList(differences);

  console.log('Press enter to start.');

  const stdin = process.openStdin();
  const changes = createChangesGenerator(differences, next);

  function nextAction() {
    const change = changes.next();
    if (change && change.done) {
      console.log('All done!');
      saveSnapshot(next).then(() => {
        process.exit(0);
      });
      return;
    }

    const { type, name, part, content } = change.value;
    ncp.copy(content, () => {
      if (type === 'template') {
        console.log(
          chalk`📋  {underline Template} {blue ${name}}: {green ${
            part !== null ? part : ''
          }}.
           {italic Paste away!}`,
        );
      } else if (type === 'page') {
        console.log(
          chalk`📋  {underline Page} {blue ${name}}. {italic Paste away!}`,
        );
      }
    });
  }

  nextAction();
  stdin.on('data', _.throttle(nextAction, 300));
}

export default async function() {
  ui.compTag();
  process.env['HYDROLEAF_MODE'] = HydroleafMode.RenderToString;

  // Get the current git hash for use in the output
  git.long(async (_gitRev) => {
    let compfile: Compfile;
    try {
      compfile = await getCompfile();
      console.log(chalk`{green compfile loaded}`);
    } catch (e) {
      ui.missingCompfile();
      throw e;
    }

    // compfile.assets.gitRev = gitRev;
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

    const staleSnapshot = await loadSnapshot();

    if (pages === undefined || templates === undefined) {
      process.exit(1);
      return;
    }

    const differences = findDirtyComponents(
      { pages, templates },
      staleSnapshot,
    );

    differencesUI(differences, { pages, templates });
  });
}
