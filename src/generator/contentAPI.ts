import * as React from 'react';
import reactTreeWalker from 'react-tree-walker';
import flatten from 'lodash/flatten';
import * as ui from './ui';
import { HydroleafMode } from '../types';
import { createRenderBase } from '../renderer';

function createContentStore(promises: Array<{ id: number }>) {
  const m: {
    [key: number]: Object;
  } = {};
  promises.forEach((doc: { id: number }) => {
    m[doc.id] = doc;
  });

  return m;
}

export function contentAPILoadAll(ids: Array<number>) {
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

export function getContentIdsFromElement(element: any) {
  const pageIds: Array<number> = [];
  function visitor(_element: any, instance: any) {
    if (instance && Object.hasOwnProperty.call(instance, 'getPageId')) {
      pageIds.push(instance.getPageId());
    }
    return true;
  }
  const RenderBase = createRenderBase({});
  process.env['HYDROLEAF_MODE'] = HydroleafMode.RenderToComponent;
  return reactTreeWalker(
    React.createElement(RenderBase, {}, element),
    visitor
  ).then(() => {
    return pageIds;
  });
}

export function getContentForElement(element: any) {
  return getContentIdsFromElement(element).then(contentAPILoadAll);
}

export async function getContentForElements(elements: Array<any>) {
  const requests = await Promise.all(
    elements.map(el => getContentIdsFromElement(el))
  );
  const store = await contentAPILoadAll(flatten(requests));

  return [requests, store];
}
