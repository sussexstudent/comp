import * as React from 'react';
import * as ReactDOM from 'react-dom/server';
import {
  getContentForElement,
  getContentForElements,
} from './generator/contentAPI';
import * as ui from './generator/ui';
import * as PropTypes from 'prop-types';
import { ApolloProvider } from 'react-apollo';
import { ApolloClient, InMemoryCache, HttpLink } from 'apollo-client-preset';
import { StaticRouter } from 'react-router';
import {
  HydroleafMode,
  PageComponentMap,
  PageResultMap,
  RenderedTemplateMap,
  TemplateResultMap,
} from './types';

export function createRenderBase(contentAPIStore: object, location: string | undefined = undefined) {
  const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new HttpLink({
        uri: 'https://falmer.sussexstudent.com',
      }),
    ssrMode: true
  });

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
      return (
        <ApolloProvider client={client}>
          <StaticRouter location={location} context={{}}>
            {this.props.children}
          </StaticRouter>
        </ApolloProvider>
      );
    }
  }

  return RenderBase;
}

function render(
  Component: any,
  props: object,
  remoteStore: any,
  hydroLeafRenderMode: HydroleafMode,
  location: string | undefined = undefined,
) {
  const RenderBase = createRenderBase(remoteStore, location);

  process.env['HYDROLEAF_MODE'] = hydroLeafRenderMode;
  const finalElement: any = React.createElement(RenderBase, {}, React.createElement(Component, props));
  return ReactDOM.renderToStaticMarkup(finalElement);
}

export const renderHtml = (
  Html: any,
  children: any,
  assets: object,
  other: { inject?: object } = {}
) => {
  if (other.inject) {
    ((global as any)).mslInject = {
      ...(((global as any)).mslInject || {}),
      ...other.inject,
    };
  }
  const finalElement: any = React.createElement(Html, { assets: assets }, children);
  return ReactDOM.renderToStaticMarkup(finalElement)
    .replace('{head_content}', '');
};

export async function renderComponent(Component: any, props = {}, location: string | undefined = undefined) {
  const remoteStore = await getContentForElement(
    React.createElement(Component, props)
  );
  return render(Component, props, remoteStore, HydroleafMode.RenderToString, location);
}

export function renderTemplates(
  templates: TemplateResultMap,
  assets: any
): RenderedTemplateMap {
  const renderedTemplates: RenderedTemplateMap = {};

  Object.keys(templates).forEach((templateName) => {
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

  requests.forEach((request) => (filteredStore[request] = store[request]));

  return filteredStore;
}

export async function renderComponents(
  pages: PageComponentMap
): Promise<PageResultMap> {
  const renderedPages: PageResultMap = {};

  const componentNames = Object.keys(pages);
  const asElements = componentNames.map((pageName) => {
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
