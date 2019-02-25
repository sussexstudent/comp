import chalk from 'chalk';

function createTwoStepMessage(msgGen: (...args: Array<any>) => string) {
  return (...args: Array<any>) => {
    process.stdout.write(msgGen(...args));
    return () => {
      console.log(chalk`{green done}`);
    };
  };
}

export const savingState = createTwoStepMessage(
  () => chalk`{white saving state file...}`,
);

export function compTag() {
  console.log(chalk`{bold.white comp}`);
}

export function missingCompfile() {
  console.log(process.cwd());
  console.log(chalk`{red Can't find compfile.js here!}`);
}
