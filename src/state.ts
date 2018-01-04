import * as fs from 'fs-extra';
import * as ui from './generator/ui';
import {
  DirtyChangeset,
  DirtyPages,
  DirtyTemplates,
  StateSnapshot,
} from './types';

export function saveSnapshot(state: StateSnapshot) {
  const done = ui.savingState();
  return fs.writeJson('./compstate.json', state).then(done);
}

export function loadSnapshot() {
  return fs
    .readJson('./compstate.json')
    .then((snapshot: StateSnapshot) => {
      return { templates: {}, pages: {}, ...snapshot };
    })
    .catch(() => {
      return { templates: {}, pages: {} };
    });
}

export function findDirtyComponents(
  next: StateSnapshot,
  previous: StateSnapshot
): DirtyChangeset {
  const dirtyTemplates: DirtyTemplates = [];
  const dirtyPages: DirtyPages = [];

  Object.keys(next.templates).forEach((templateName) => {
    const nextTemplate = next.templates[templateName];
    const previousTemplate = previous.templates[templateName];

    if (previousTemplate === undefined) {
      const templatesCombined =
        nextTemplate.templatePublic === nextTemplate.templateLoggedIn;

      dirtyTemplates.push({
        name: templateName,
        isNew: true,
        templatesCombined,
      });
    } else {
      const dirtyHead = nextTemplate.head !== previousTemplate.head;
      const dirtyTemplateLoggedIn =
        nextTemplate.templateLoggedIn !== previousTemplate.templateLoggedIn;
      const dirtyTemplatePublic =
        nextTemplate.templatePublic !== previousTemplate.templatePublic;
      const templatesCombined =
        nextTemplate.templatePublic === nextTemplate.templateLoggedIn;
      if (dirtyHead || dirtyTemplateLoggedIn || dirtyTemplatePublic) {
        dirtyTemplates.push({
          name: templateName,
          dirtyHead,
          dirtyTemplateLoggedIn,
          dirtyTemplatePublic,
          templatesCombined,
        });
      }
    }
  });

  Object.keys(next.pages).forEach((pageName) => {
    if (
      !Object.hasOwnProperty.call(previous.pages, pageName) ||
      next.pages[pageName].content !== previous.pages[pageName].content
    ) {
      dirtyPages.push(pageName);
    }
  });

  return { dirtyTemplates, dirtyPages };
}
