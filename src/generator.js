import fs from 'fs-extra';
import throttle from 'lodash/throttle';
import isObject from 'lodash/isObject';
import chalk from 'chalk';
import git from 'git-rev';
import ncp from 'copy-paste';
import * as ui from './generator/ui';
import { createChangesGenerator } from './generator/changes';
import { renderTemplates, renderPages } from './generator/rendering';


function doDiff(next, previous) {
  const dirtyTemplates = [];
  const dirtyPages = [];

  Object.keys(next.templates).forEach(templateName => {
    const nextTemplate = next.templates[templateName];
    const previousTemplate = previous.templates[templateName];
    if (previousTemplate === undefined) {
      dirtyTemplates.push({ name: templateName, isNew: true });
    } else {
      const dirtyHead = nextTemplate.head !== previousTemplate.head;
      const dirtyTemplateLoggedIn =
        nextTemplate.templateLoggedIn !== previousTemplate.templateLoggedIn;
      const dirtyTemplatePublic =
        nextTemplate.templatePublic !== previousTemplate.templatePublic;
      if (dirtyHead || dirtyTemplateLoggedIn || dirtyTemplatePublic) {
        dirtyTemplates.push({
          name: templateName,
          dirtyHead,
          dirtyTemplateLoggedIn,
          dirtyTemplatePublic,
        });
      }
    }
  });

  Object.keys(next.pages).forEach(pageName => {
    if (
      !Object.hasOwnProperty.call(previous.pages, pageName) ||
      next.pages[pageName].content !== previous.pages[pageName].content
    ) {
      dirtyPages.push(pageName);
    }
  });

  return { dirtyTemplates, dirtyPages };
}

function saveState(state) {
  return fs.writeJson('./previous.json', state);
}

function getStaleStateSnapshot() {
  return fs.readJson('./previous.json')
    .then(snapshot => {
      return { templates: {}, pages: {}, ...snapshot };
    })
  .catch(err => {
    return { templates: {}, pages: {} };
  });
}

async function runGenerator(next) {
  const staleSnapshot = await getStaleStateSnapshot();
  const differences = doDiff(next, staleSnapshot);

  function differencesUI() {
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
        saveState(next)
          .then(() => {
            console.log(chalk.green('Saved to state file. 👍'));
            process.exit(0);
          });
      }

      const {type, name, part, content} = change.value;
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

  differencesUI();
}

export default function(config){
  git.long(gitRev => {
    config.assets.gitRev = gitRev;

    // perform renders
    Promise.all([
      renderPages(config.pages, config.assets),
      renderTemplates(config.templates, config.assets),
    ])
      .then(([ pages, templates ]) => {
        return runGenerator({ pages, templates });
      });
  });
}
