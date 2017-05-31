import React from 'react';
import reactTreeWalker from 'react-tree-walker';
import flatten from 'lodash/flatten';
import * as ui from './ui';

function createContentStore(promises) {
  const m = {};
  promises.forEach(doc => {
    m[doc.id] = doc;
  });

  return m;
}

export function contentAPILoadAll(ids) {
  const done = ui.loadingFalmerContent(ids.length);
  const pages = ids.map(id =>
    fetch(`https://falmer.sussexstudent.com/content-api/v2/pages/${id}/`)
      .then(data => data.json())
      .then(data => {
        return data;
      })
  );
  return Promise.all(pages)
    .then(content => {
      done();
      return content;
    })
    .then(createContentStore);
}

export function getContentIdsFromElement(element) {
  const pageIds = [];
  function visitor(element, instance, context) {
    if (instance && Object.hasOwnProperty.call(instance, 'getPageId')) {
      pageIds.push(instance.getPageId());
    }
    return true;
  }

  return reactTreeWalker(element, visitor).then(() => {
    process.env['HYDROLEAF_MODE'] = 'RENDER_STRING';
    return pageIds;
  });
}

export function getContentForElement(element) {
  process.env['HYDROLEAF_MODE'] = 'RENDER_COMPONENT';
  return getContentIdsFromElement(element).then(contentAPILoadAll);
}

export async function getContentForElements(elements) {
  process.env['HYDROLEAF_MODE'] = 'RENDER_COMPONENT';

  const requests = await Promise.all(
    elements.map(el => getContentIdsFromElement(el))
  );
  const store = await contentAPILoadAll(flatten(requests));

  return [requests, store];
}
