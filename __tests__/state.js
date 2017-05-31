import { saveSnapshot, loadSnapshot } from '../src/state';
import fs from 'fs-extra';

it('should save snapshot and load snapshot', async () => {
  const SNAPSHOT_DATA = { templates: { main: "<html>" } };
  await saveSnapshot(SNAPSHOT_DATA);

  const snapshot = await loadSnapshot();

  expect(snapshot.templates.main).toEqual(SNAPSHOT_DATA.templates.main);
  expect(snapshot.pages).toMatchObject({});
});

it('should not require a snapshot', async () => {
  await fs.remove('./compstate.json');

  const snapshot = await loadSnapshot();

  expect(snapshot.templates).toMatchObject({});
  expect(snapshot.pages).toMatchObject({});
});
