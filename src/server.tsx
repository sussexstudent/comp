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
import { Compfile, CompfileWatcher, ContentApiOptions } from './types';
import * as bodyParser from 'body-parser';
import { createContentCache, normaliseContentPath } from './content';
import chalk from 'chalk';

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
                return `/assets/${name}.js`;
              }

              if (atName === 'css') {
                return `/assets/style.${name}.css`;
              }
            },
          },
        );
      },
    },
  ),
};

enum PageMode {
  Local = 'local',
  Proxy = 'proxy',
}

const contentCache = createContentCache();

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
    },
  );
}

function loadFromLocal(
  compfileWatcher: CompfileWatcher,
  req: express.Request,
  res: express.Response,
) {
  const conf = compfileWatcher.getCompfile();
  const pages = conf.pages;
  const path = req.path;

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
        <Template assets={localAssetsStub} />,
        localAssetsStub,
        {
          inject: {
            Content: componentString,
          },
        },
      );
      res.send(page);
    });
  } else {
    res.status(404);
    res.send('404 ~ Not found.');
  }
}

function loadFromContentApi(
  path: string,
  options: ContentApiOptions,
  compfileWatcher: CompfileWatcher,
  req: express.Request,
  res: express.Response,
) {
  console.log(chalk`{keyword('teal') [server] loading from content api}`);
  const conf = compfileWatcher.getCompfile();

  const PageComponent = options.template;

  renderComponent(PageComponent, { path }, path).then((componentString) => {
    const templateName = 'main';

    const Template = resolveAllTemplates(conf)[templateName]['templatePublic'];

    const page = renderHtml(
      conf.html,
      <Template
        assets={localAssetsStub}
        loggedIn={Object.hasOwnProperty.call(req.query, 'auth')}
      />,
      localAssetsStub,
      {
        inject: {
          Content: componentString,
        },
      },
    );
    res.send(page);
  });
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
    res.send('Compfile has not finished compiling yet!');
    return;
  }
  const compfile = compfileWatcher.getCompfile();

  if (!compfile.contentApi) {
    if (req.query.mode === PageMode.Local) {
      return loadFromLocal(compfileWatcher, req, res);
    } else {
      return loadFromSite(compfileWatcher, req, res);
    }
  } else {
    const contentApiOptions = compfile.contentApi;
    if (req.query.mode === PageMode.Local) {
      return loadFromLocal(compfileWatcher, req, res);
    } else {
      contentCache.getAllPaths(contentApiOptions).then((paths) => {
        const normalisedRequestPath = normaliseContentPath(req.originalUrl);

        if (paths.indexOf(normalisedRequestPath) >= 0) {
          try {
            return loadFromContentApi(
              normalisedRequestPath,
              contentApiOptions,
              compfileWatcher,
              req,
              res,
            );
          } catch (e) {
            console.log(
              chalk`{keyword('orange') [content] page failed to render from content api}`,
            );
            console.log(e);
          }
        } else {
          return loadFromSite(compfileWatcher, req, res);
        }
      });
    }
  }
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
