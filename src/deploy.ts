import chalk from 'chalk';
import * as ui from './generator/ui';
import { renderTemplates } from './renderer';
import { getCompfile, resolveAllTemplates } from './compfile';
import {
  Compfile,
  HydroleafMode
} from './types';
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

  let templates;
  try {
    templates = await renderTemplates(
      resolveAllTemplates(compfile),
      compfile.assets,
      compfile.providers,
    );
  } catch (err) {
    console.log(err);
    process.exit(1);
  }

  if (templates === undefined) {
    process.exit(1);
    return;
  }

  await writeFile('./deploy.json', JSON.stringify({
    [compfile.skin]: templates,
  }));

  console.log('written to ./deploy.json');
}
