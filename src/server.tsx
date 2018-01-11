import * as React from 'react';
import * as express from 'express';
import fetch from 'node-fetch';
import * as jsdom from 'jsdom';
import { renderHtml, renderComponent } from './renderer';
import {
  createCompfileWatcher,
  getPageComponentFromConf,
  resolveAllTemplates,
} from './compfile';
import * as ui from './generator/ui';
import { Compfile, CompfileWatcher } from './types';

const localAssetsStub = {
  main: {
    js: '/assets/main.js',
    css: '/assets/style.main.css',
  },
  productionFonts: {
    css: '/assets/style.productionFonts.css',
  },
  vendor: {
    js: '/assets/vendor.js',
  },
  freshers: {
    js: '/assets/freshers.js',
    css: '/assets/style.freshers.css',
  },
};

function handleTemplaing(conf: Compfile, html: string) {
  const { window } = new jsdom.JSDOM(html);
  const pageContentHTML = window.document.querySelector('main .Container');
  const Main = resolveAllTemplates(conf)['main']['templatePublic'];
  return renderHtml(
    conf.html,
    React.createElement(Main, { assets: localAssetsStub }),
    localAssetsStub,
    {
      inject: { Content: pageContentHTML ? pageContentHTML.innerHTML : html },
    }
  );
}

function loadFromLocal(
  compfileWatcher: CompfileWatcher,
  req: express.Request,
  res: express.Response
) {
  const conf = compfileWatcher.getCompfile();
  const pages = conf.pages;
  const path = req.url.slice(2);

  if (Object.hasOwnProperty.call(pages, path)) {
    const PageComponent = getPageComponentFromConf(conf, path);
    renderComponent(PageComponent).then((componentString) => {
      const templateName = Object.hasOwnProperty.call(PageComponent, 'template')
        ? PageComponent.template
        : 'main';

      const Template = resolveAllTemplates(conf)[templateName][
        'templatePublic'
      ];

      const page = renderHtml(
        conf.html,
        (<Template assets={localAssetsStub} loggedIn={Object.hasOwnProperty.call(req.query, 'auth')} />),
        localAssetsStub,
        {
          inject: {
            Content: componentString,
          },
        }
      );
      res.send(page);
    });
  } else {
    res.status(404);
    res.send('404 ~ Not found.');
  }
}

function loadFromSite(compfileWatcher: CompfileWatcher, req: any, res: any) {
  const conf = compfileWatcher.getCompfile();
  fetch(`https://www.sussexstudent.com/${req.originalUrl}`)
    .then((response) => {
      const contentType = response.headers.get('Content-Type');
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
            res.send(text.replace(/http:\/\/sussexstudent.com/gi, ''))
          );
      } else {
        response.buffer().then((buf) => res.send(buf));
      }
    })
    .catch((e) => console.log(e));
}

function createServer(compfileWatcher: CompfileWatcher) {
  ui.compTag();

  const server = express();

  server.get('/~/:page(*)', loadFromLocal.bind({}, compfileWatcher));
  server.get('/*', loadFromSite.bind({}, compfileWatcher));

  return server;
}

export default function compMiddleware() {
  const compfileWatcher = createCompfileWatcher();
  return createServer(compfileWatcher);
}
