import throttle from 'lodash/throttle';
import chalk from 'chalk';
import git from 'git-rev';
import ncp from 'copy-paste';
import * as ui from './generator/ui';
import { createChangesGenerator } from './generator/changes';
import { findDirtyComponents, loadSnapshot, saveSnapshot } from './state';
import { renderComponents, renderTemplates } from './renderer';
import { loadCompfile, resolveAllPages, resolveAllTemplates } from './compfile';

function differencesUI(differences, next) {
  // exit if nothing
  if (
    differences.dirtyTemplates.length <= 0 &&
    differences.dirtyPages.length <= 0
  ) {
    console.log(
      `${chalk.red('No changes!')}. Use ${chalk.blue('-f')} to force all, ${chalk.blue('-p')} to name pages and ${chalk.blue('-t')} for templates`
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
          `📋  ${chalk.underline('Template')} ${chalk.blue(name)}: ${chalk.green(part)}. ${chalk.italic('Paste away!')}`
        );
      } else if (type === 'page') {
        console.log(
          `📋  ${chalk.underline('Page')} ${chalk.blue(name)}.  ${chalk.italic('Paste away!')}`
        );
      }
    });
  }

  nextAction();
  stdin.on('data', throttle(nextAction, 300));
}

export default async function() {
  process.env['HYDROLEAF_MODE'] = 'RENDER_STRING';
  git.long(async gitRev => {
    ui.compTag();

    let compfile;
    try {
      compfile = loadCompfile();
    } catch (e) {
      ui.missingCompfile();
      throw e;
    }

    compfile.assets.gitRev = gitRev;
    let pages, templates;
    try {
      templates = await renderTemplates(
        resolveAllTemplates(compfile),
        compfile.assets
      );
      pages = await renderComponents(
        resolveAllPages(compfile),
        compfile.assets
      );
    } catch (err) {
      console.log(err);
      process.exit(1);
    }
    const staleSnapshot = await loadSnapshot();

    const differences = findDirtyComponents(
      { pages, templates },
      staleSnapshot
    );

    differencesUI(differences, { pages, templates });
  });
}
