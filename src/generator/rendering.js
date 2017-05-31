import React from 'react';
import ReactDOM from 'react-dom/server';
import { getContentIdsFromTrees } from './contentAPI';

function createRenderBase(contentAPIStore) {
  class RenderBase extends React.Component {
    getChildContext() {
      return {
        contentAPI: contentAPIStore,
      };
    }

    render() {
      return React.createElement('div', {}, this.props.children);
    }
  }

  RenderBase.childContextTypes = {
    contentAPI: React.PropTypes.object.isRequired,
  };

  return RenderBase;
}

export const render = (Element, other = {}, context = {}) => {
  if (other.inject) {
    global.mslInject = other.inject;
  }
  const RenderBase = createRenderBase(context.store);
  return ReactDOM.renderToStaticMarkup(
    React.createElement(RenderBase, {}, React.createElement(Element, other))
  );
};

export const renderHtml = (Html, children, assets, other = {}) => {
  if (other.inject) {
    global.mslInject = other.inject;
  }

  return ReactDOM.renderToStaticMarkup(
    React.createElement(Html, { assets: assets }, children)
  ).replace('{head_content}', '');
};

export function renderTemplates(templates, assets) {
  const renderedTemplates = {};
  Object.keys(templates).forEach(templateName => {
    renderedTemplates[templateName] = {
      name: templateName,
      head: templates[templateName].head(assets),
      templateLoggedIn: render(templates[templateName].templateLoggedIn, {
        assets,
        loggedIn: true,
      }),
      templatePublic: render(templates[templateName].templatePublic, {
        assets,
        loggedIn: false,
      }),
    };
  });

  return renderedTemplates;
}

export function renderPages(pages) {
  const renderedPages = {};

  const trees = Object.keys(pages).map(pageName => {
    return React.createElement(pages[pageName]);
  });

  return getContentIdsFromTrees(trees)
    .then(store => {
      Object.keys(pages).forEach(pageName => {
        renderedPages[pageName] = {
          name: pageName,
          content: render(pages[pageName], {}, { store }),
        };
      });

      return renderedPages;
    })
    .catch(err => {
      throw err;
    });
}
