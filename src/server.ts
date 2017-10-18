import * as React from 'react';
import * as express from 'express';
import fetch from 'node-fetch';
import * as jsdom from 'jsdom';
import * as chokidar from 'chokidar';
import { renderHtml, renderComponent } from './renderer';
import {
  getPageComponentFromConf,
  loadCompfile,
  resolveAllTemplates,
} from './compfile';
import * as ui from './generator/ui';
import { Compfile } from './types';

const moduleDetectRegEx = /(layout|components|setup).*\.js$/;

function clearRequireCache() {
  Object.keys(require.cache).forEach(module => {
    if (moduleDetectRegEx.test(require.cache[module].filename)) {
      console.log(`deleting ${require.cache[module].filename}`);
      delete require.cache[module];
    }
  });
}

function watchAndClearCache() {
  chokidar
    .watch(['./generator/layouts', './generator/components'])
    .on('change', () => {
      console.log('updated!');
      clearRequireCache();
    });
}

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
  conf: Compfile,
  req: express.Request,
  res: express.Response
) {
  const pages = conf.pages;
  const path = req.url.slice(2);

  if (Object.hasOwnProperty.call(pages, path)) {
    const PageComponent = getPageComponentFromConf(conf, path);
    renderComponent(PageComponent).then(componentString => {
      const templateName = Object.hasOwnProperty.call(PageComponent, 'template')
        ? PageComponent.template
        : 'main';

      const Template = resolveAllTemplates(conf)[templateName][
        'templatePublic'
      ];

      const page = renderHtml(
        conf.html,
        React.createElement(Template, {
          assets: localAssetsStub,
          loggedIn: Object.hasOwnProperty.call(req.query, 'auth'),
        }),
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

function loadFromSite(conf: Compfile, req: any, res: any) {
  fetch(`https://www.sussexstudent.com/${req.originalUrl}`)
    .then(response => {
      const contentType = response.headers.get('Content-Type');
      if (contentType.startsWith('text')) {
        response
          .text()
          .then(text => {
            if (contentType.startsWith('text/html')) {
              return handleTemplaing(conf, text);
            }

            return text;
          })
          .then(text =>
            res.send(text.replace(/http:\/\/sussexstudent.com/gi, ''))
          );
      } else {
        response.buffer().then(buf => res.send(buf));
      }
    })
    .catch(e => console.log(e));
}

function createServer(compfile: Compfile) {
  ui.compTag();

  watchAndClearCache();

  const server = express();

  server.get('/~/:page(*)', loadFromLocal.bind({}, compfile));
  server.get('/*', loadFromSite.bind({}, compfile));

  return server;
}

export default function compMiddleware() {
  const compfile = loadCompfile();
  return createServer(compfile);
}