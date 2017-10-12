import { DirtyChangeset, StateSnapshot } from '../types';

function* getTemplateChanges(
  differences: DirtyChangeset,
  renders: StateSnapshot
) {
  for (const template of differences.dirtyTemplates) {
    const d = { type: 'template', name: template.name };
    if (template.dirtyHead || template.isNew) {
      yield {
        ...d,
        part: 'head',
        content: renders.templates[template.name].head,
      };
    }

    if (template.templatesCombined) {
      if (
        template.isNew ||
        template.dirtyTemplatePublic ||
        template.dirtyTemplateLoggedIn
      ) {
        yield {
          ...d,
          part: 'template',
          content: renders.templates[template.name].templatePublic,
        };
      }
    } else {
      if (template.dirtyTemplatePublic || template.isNew) {
        yield {
          ...d,
          part: 'templatePublic',
          content: renders.templates[template.name].templatePublic,
        };
      }

      if (template.dirtyTemplateLoggedIn || template.isNew) {
        yield {
          ...d,
          part: 'templateLoggedIn',
          content: renders.templates[template.name].templateLoggedIn,
        };
      }
    }
  }
}

function* getPageChanges(differences: DirtyChangeset, renders: StateSnapshot) {
  for (const page of differences.dirtyPages) {
    yield {
      type: 'page',
      name: page,
      content: renders.pages[page].content,
      part: null,
    };
  }
}

export function* createChangesGenerator(
  differences: DirtyChangeset,
  renders: StateSnapshot
) {
  yield* getTemplateChanges(differences, renders);
  yield* getPageChanges(differences, renders);
}
