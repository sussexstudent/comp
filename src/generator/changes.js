function* getTemplateChanges(differences, renders) {
  for (const template of differences.dirtyTemplates) {
    const d = { type: 'template', name: template.name };
    if (template.dirtyHead || template.isNew) {
      yield {
        ...d,
        part: 'head',
        content: renders.templates[template.name].head,
      };
    }

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

function* getPageChanges(differences, renders) {
  for (const page of differences.dirtyPages) {
    yield { type: 'page', name: page, content: renders.pages[page].content };
  }
}

export function* createChangesGenerator(differences, renders) {
  yield* getTemplateChanges(differences, renders);
  yield* getPageChanges(differences, renders);
}
