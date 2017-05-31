import React from 'react';
import ReactDOM from 'react-dom/server';
import {
  getContentForElement,
  getContentForElements,
} from './generator/contentAPI';
import * as ui from './generator/ui';

function createRenderBase(contentAPIStore) {
  class RenderBase extends React.Component {
    getChildContext() {
      return {
        contentAPI: contentAPIStore,
      };
    }

    render() {
      return this.props.children;
      //return React.createElement('div', {}, this.props.children);
    }
  }

  RenderBase.childContextTypes = {
    contentAPI: React.PropTypes.object.isRequired,
  };

  return RenderBase;
}

function render(Component, props, remoteStore) {
  const RenderBase = createRenderBase(remoteStore);

  return ReactDOM.renderToStaticMarkup(
    React.createElement(RenderBase, {}, React.createElement(Component, props))
  );
}

export const renderHtml = (Html, children, assets, other = {}) => {
  if (other.inject) {
    global.mslInject = other.inject;
  }

  return ReactDOM.renderToStaticMarkup(
    React.createElement(Html, { assets: assets }, children)
  ).replace('{head_content}', '');
};

export async function renderComponent(Component, props = {}) {
  const remoteStore = await getContentForElement(
    React.createElement(Component, props)
  );
  return render(Component, props, remoteStore);
}

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

function filterStoreForRequests(store, requests) {
  const filteredStore = {};

  requests.forEach(request => (filteredStore[request] = store[request]));

  return filteredStore;
}

export async function renderComponents(pages) {
  const renderedPages = {};

  const componentNames = Object.keys(pages);
  const asElements = componentNames.map(pageName => {
    return React.createElement(pages[pageName]);
  });

  const [requests, store] = await getContentForElements(asElements);
  const done = ui.renderingComponents();
  componentNames.forEach((pageName, index) => {
    renderedPages[pageName] = {
      name: pageName,
      content: render(
        pages[pageName],
        {},
        filterStoreForRequests(store, requests[index])
      ),
    };
  });

  done();

  return renderedPages;
}
