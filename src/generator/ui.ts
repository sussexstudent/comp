import chalk from 'chalk';
import { DirtyChangeset } from '../types';

export function renderDifferencesList(differences: DirtyChangeset) {
  console.log(chalk`{underline Templates}`);
  differences.dirtyTemplates.forEach((template) => {
    let changes;
    if (template.isNew) {
      changes = 'NEW';
    } else {
      changes = [];
      if (template.dirtyHead) {
        changes.push('<head>');
      }

      if (template.dirtyTemplatePublic) {
        changes.push('Public template');
      }

      if (template.dirtyTemplateLoggedIn) {
        changes.push('Logged in template');
      }

      changes = `${changes.join(', ')} changed`;
    }
    console.log(chalk`• {blue ${template.name}} - {green ${changes}}`);
  });

  console.log(chalk`\n{underline Pages}`);

  differences.dirtyPages.forEach((page) => {
    console.log(chalk`• {blue ${page}}`);
  });
}

function createTwoStepMessage(msgGen: (...args: Array<any>) => string) {
  return (...args: Array<any>) => {
    process.stdout.write(msgGen(...args));
    return () => {
      console.log(chalk`{green done}`);
    };
  };
}

export const loadingFalmerContent = createTwoStepMessage((count: number) =>
  chalk`{white loading ${count.toString()} documents from falmer contentAPI... }`
);

export const savingState = createTwoStepMessage(() =>
  chalk`{white saving state file...}`
);

export const renderingComponents = createTwoStepMessage(() =>
  chalk`{white rendering components to markup... }`
);

export function compTag() {
  console.log(chalk`{bold.white comp}`);
}

export function missingCompfile() {
  console.log(chalk`{red Can't find compfile.js here!}`);
}
