import * as React from 'react';
import * as ReactDOM from 'react-dom/server';
import {
  getContentForElement,
  getContentForElements,
} from './generator/contentAPI';
import * as ui from './generator/ui';
import * as PropTypes from 'prop-types';
import { ApolloProvider, ApolloClient } from 'react-apollo';
import { StaticRouter } from 'react-router';
import {
  HydroleafMode,
  PageComponentMap,
  PageResultMap,
  RenderedTemplateMap,
  TemplateResultMap,
} from './types';

export function createRenderBase(contentAPIStore: object) {
  class RenderBase extends React.Component {
    static childContextTypes = {
      contentAPI: PropTypes.object.isRequired,
    };

    getChildContext() {
      return {
        contentAPI: contentAPIStore,
      };
    }

    render() {
      return React.createElement(
        ApolloProvider,
        { client: new ApolloClient() },
        React.createElement(StaticRouter, {}, this.props.children)
      );
    }
  }
  return RenderBase;
}

function render(
  Component: any,
  props: object,
  remoteStore: any,
  hydroLeafRenderMode: HydroleafMode
) {
  const RenderBase = createRenderBase(remoteStore);

  process.env['HYDROLEAF_MODE'] = hydroLeafRenderMode;
  return ReactDOM.renderToStaticMarkup(
    React.createElement(RenderBase, {}, React.createElement(Component, props))
  );
}

export const renderHtml = (
  Html: any,
  children: any,
  assets: object,
  other: { inject?: object } = {}
) => {
  if (other.inject) {
    (<any>global).mslInject = {
      ...((<any>global).mslInject || {}),
      ...other.inject,
    };
  }

  return ReactDOM.renderToStaticMarkup(
    React.createElement(Html, { assets: assets }, children)
  ).replace('{head_content}', '');
};

export async function renderComponent(Component: any, props = {}) {
  const remoteStore = await getContentForElement(
    React.createElement(Component, props)
  );
  return render(Component, props, remoteStore, HydroleafMode.RenderToString);
}

export function renderTemplates(
  templates: TemplateResultMap,
  assets: any
): RenderedTemplateMap {
  const renderedTemplates: RenderedTemplateMap = {};

  Object.keys(templates).forEach(templateName => {
    renderedTemplates[templateName] = {
      name: templateName,
      head: templates[templateName].head(assets),
      templateLoggedIn: render(
        templates[templateName].templateLoggedIn,
        {
          assets,
          loggedIn: true,
        },
        {},
        HydroleafMode.RenderToString
      ),
      templatePublic: render(
        templates[templateName].templatePublic,
        {
          assets,
          loggedIn: false,
        },
        {},
        HydroleafMode.RenderToString
      ),
    };
  });

  return renderedTemplates;
}

function filterStoreForRequests(store: any, requests: Array<string>) {
  const filteredStore: any = {};

  requests.forEach(request => (filteredStore[request] = store[request]));

  return filteredStore;
}

export async function renderComponents(
  pages: PageComponentMap
): Promise<PageResultMap> {
  const renderedPages: PageResultMap = {};

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
        filterStoreForRequests(store, requests[index]),
        HydroleafMode.RenderToString
      ),
    };
  });

  done();

  return renderedPages;
}
