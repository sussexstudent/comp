import fs from 'fs-extra';
import * as ui from './generator/ui';

export function saveSnapshot(state) {
  const done = ui.savingState();
  return fs.writeJson('./compstate.json', state)
    .then(done);
}

export function loadSnapshot() {
  return fs
    .readJson('./compstate.json')
    .then(snapshot => {
      return { templates: {}, pages: {}, ...snapshot };
    })
    .catch(err => {
      return { templates: {}, pages: {} };
    });
}
