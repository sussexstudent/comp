import React from 'react';
import reactTreeWalker from 'react-tree-walker';
import * as ui from './ui';

function createContentStore(promises) {
  ui.finishedLoadFromContentAPI();

  const m = {};
  promises.forEach(doc => {
    m[doc.id] = doc;
  });

  return m;
}

export function contentAPILoadAll(ids) {
  ui.startedLoadFromContentAPI(ids.length);
  const pages = ids.map(id =>
    fetch(`https://falmer.sussexstudent.com/content-api/v2/pages/${id}/`)
      .then(data => data.json())
      .then(data => {
        return data;
      })
  );
  return Promise.all(pages).then(createContentStore);
}

export function getContentIdsFromTrees(trees) {
  const pageIds = [];
  function visitor(element, instance, context) {
    if (instance && Object.hasOwnProperty.call(instance, 'getPageId')) {
      pageIds.push(instance.getPageId());
    }
    return true;
  }

  const waiting = trees.map(tree => reactTreeWalker(tree, visitor));

  return Promise.all(waiting).then(() => {
    process.env['HYDROLEAF_MODE'] = 'RENDER_STRING';
    return pageIds;
  });
}

export function getContentForElement(component) {
  process.env['HYDROLEAF_MODE'] = 'RENDER_COMPONENT';
  return getContentIdsFromTrees([React.createElement(component)]).then(
    contentAPILoadAll
  );
}
