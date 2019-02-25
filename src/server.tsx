import * as React from 'react';
import * as express from 'express';
import fetch from 'node-fetch';
import * as jsdom from 'jsdom';
import { renderHtml } from './renderer';
import {
  createCompfileWatcher,
  resolveAllTemplates,
} from './compfile';
import * as ui from './generator/ui';
import { Compfile, CompfileWatcher } from './types';
import * as bodyParser from 'body-parser';

// todo: current assets.mainifest makes this more complex.
const localAssetsStub = {
  map: new Proxy(
    {},
    {
      get(_target, name) {
        return new Proxy(
          {},
          {
            get(_atTarget, atName) {
              if (atName === 'js') {
                return `/assets/${name as string}.js`;
              }

              if (atName === 'css') {
                return `/assets/style.${name as string}.css`;
              }
            },
          },
        );
      },
    },
  ),
};

function handleTemplaing(conf: Compfile, html: string) {
  const { window } = new jsdom.JSDOM(html);
  const pageContentHTMLLegacy = window.document.querySelector(
    'main .Container',
  );
  const pageContentHTMLLoki = window.document.querySelector(
    'main .LokiContainer',
  );
  const pageContentHTML = pageContentHTMLLegacy
    ? pageContentHTMLLegacy
    : pageContentHTMLLoki;
  const Main = resolveAllTemplates(conf)['main']['templatePublic'];
  return renderHtml(
    conf.html,
    React.createElement(Main, { assets: localAssetsStub }),
    localAssetsStub,
    {
      inject: { Content: pageContentHTML ? pageContentHTML.innerHTML : html },
    },
  );
}

function loadFromSite(compfileWatcher: CompfileWatcher, req: any, res: any) {
  const conf = compfileWatcher.getCompfile();
  fetch(`https://www.sussexstudent.com/${req.originalUrl}`)
    .then((response) => {
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.startsWith('text')) {
        response
          .text()
          .then((text) => {
            if (contentType.startsWith('text/html')) {
              return handleTemplaing(conf, text);
            }

            return text;
          })
          .then((text) =>
            res.send(text.replace(/http:\/\/sussexstudent.com/gi, '')),
          );
      } else {
        response.buffer().then((buf) => res.send(buf));
      }
    })
    .catch((e) => console.log(e));
}

function handlePage(compfileWatcher: CompfileWatcher, req: any, res: any) {
  if (!compfileWatcher.getCompfile()) {
    res.status(503).send('Compfile has not finished compiling yet!');
    return;
  }

  return loadFromSite(compfileWatcher, req, res);
}

function createServer(compfileWatcher: CompfileWatcher) {
  ui.compTag();

  const server = express();

  server.use(bodyParser.json());

  server.get('/*', handlePage.bind({}, compfileWatcher));

  return server;
}

export default function compMiddleware() {
  const compfileWatcher = createCompfileWatcher();
  return createServer(compfileWatcher);
}
