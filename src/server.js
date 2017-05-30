import React from 'react';
import express from 'express';
import fetch from 'node-fetch';
import jsdom from 'jsdom';
import chokidar from 'chokidar';
import { render, renderHtml } from './generator/rendering';

function watchAndClearCache() {
  const moduleDetectRegEx = /(layout|components|setup).*\.js$/;
  chokidar
    .watch(['./generator/layouts', './generator/components'])
    .on('change', () => {
      console.log('updated!');
      Object.keys(require.cache).forEach(module => {
        if (moduleDetectRegEx.test(require.cache[module].filename)) {
          console.log(`deleting ${require.cache[module].filename}`);
          delete require.cache[module];
        }
      });
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
};

function handleTemplaing(conf, html) {
  const { window } = new jsdom.JSDOM(html);
  const pageContentHTML = window.document.querySelector('main .Container');
  const Main = conf.templates.main.templatePublic;
  return renderHtml(conf.html, React.createElement(Main, { assets: localAssetsStub}), localAssetsStub, {
    inject: { Content: pageContentHTML ? pageContentHTML.innerHTML : html },
  });
}

function loadFromLocal(conf, req, res) {
  const pages = conf.pages;
  if (Object.hasOwnProperty.call(pages, req.params.page)) {
    const Main = conf.templates.main.templatePublic;
    const page = renderHtml(
      conf.html,
      React.createElement(Main, {
        assets: localAssetsStub,
        loggedIn: Object.hasOwnProperty.call(req.query, 'auth')
      }),
      localAssetsStub,
      { inject: { Content: render(pages[req.params.page]) } }
    );
    res.send(page);
  } else {
    res.status(404);
    res.send('404 ~ Not found.');
  }
}

function loadFromSite(conf, req, res) {
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
          .then(text => res.send(text));
      } else {
        response.buffer().then(buf => res.send(buf));
      }
    })
    .catch(e => console.log(e));
}

function createServer(conf) {
  const server = express();

  server.get('/~/:page(*)', loadFromLocal.bind({}, conf));
  server.get('/*', loadFromSite.bind({}, conf));

  return server;
}

export default function compMiddleware(conf) {
  watchAndClearCache();
  return createServer(conf);
}
