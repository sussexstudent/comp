import chalk from 'chalk';

export function renderDifferencesList(differences) {
  console.log(chalk.underline('Templates'));
  differences.dirtyTemplates.forEach(template => {
    let changes;
    if (template.isNew) {
      changes = 'NEW';
    } else {
      changes = [];
      if (template.head) {
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
    console.log(`• ${chalk.blue(template.name)} - ${chalk.green(changes)}`);
  });

  console.log(chalk.underline('\nPages'));

  differences.dirtyPages.forEach(page => {
    console.log(`• ${chalk.blue(page)}`);
  });
}

function createTwoStepMessage(msgGen) {
  return (...args) => {
    process.stdout.write(msgGen(...args));
    return () => {
      console.log(`${chalk.green('done')}`);
    };
  };
}

export const loadingFalmerContent = createTwoStepMessage(count =>
  chalk.white(`loading ${count} documents from falmer contentAPI... `)
);

export const savingState = createTwoStepMessage(() =>
  chalk.white(`saving state file... `)

);

export const renderingComponents = createTwoStepMessage(() =>
  chalk.white(`rendering components to markup... `)
);

export function compTag() {
  console.log(chalk.bold.white('comp'));
}

export function missingCompfile() {
  console.log(chalk.red(`Can't find compfile.js here!`));
}
