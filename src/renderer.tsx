import * as React from 'react';
import * as ReactDOM from 'react-dom/server';
import * as ui from './generator/ui';
import * as PropTypes from 'prop-types';
import {ApolloProvider, getDataFromTree} from 'react-apollo';
import { ApolloClient, InMemoryCache, HttpLink } from 'apollo-client-preset';
import { StaticRouter } from 'react-router';
import {
  HydroleafMode,
  PageComponentMap,
  PageResultMap,
  RenderedTemplateMap,
  TemplateResultMap,
} from './types';

const ENDPOINT = 'https://falmer.sussexstudent.com/graphql';

function createFreshApolloClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: ENDPOINT,
    }),
    ssrMode: true
  });
}

export function createRenderBase(contentAPIStore: object, location: string | undefined = undefined) {
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: ENDPOINT,
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
  other: { inject?: object, compOptions?: string } = {}
) => {
  if (other.inject) {
    ((global as any)).mslInject = {
      ...(((global as any)).mslInject || {}),
      ...other.inject,
    };
  }

  let additionalHead = [];

  if (other.compOptions) {
    additionalHead.push(other.compOptions);
  }

  const finalElement: any = React.createElement(Html, { assets: assets, additionalHead }, children);
  return ReactDOM.renderToStaticMarkup(finalElement)
    .replace('{head_content}', '');
};

export async function renderComponent(Component: any, props = {}, location: string | undefined = undefined) {
  process.env['HYDROLEAF_MODE'] = HydroleafMode.RenderToComponent;

  const finalElement: any = (
    <ApolloProvider client={createFreshApolloClient()}>
      <StaticRouter location={location} context={{}}>
        <Component {...props} />
      </StaticRouter>
    </ApolloProvider>
  );

  return getDataFromTree(finalElement).then(() => {
    process.env['HYDROLEAF_MODE'] = HydroleafMode.RenderToString;

    return ReactDOM.renderToStaticMarkup(finalElement as any);
  });
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

export async function renderComponents(
  pages: PageComponentMap
): Promise<PageResultMap> {
  const renderedPages: PageResultMap = {};

  const componentNames = Object.keys(pages);

  const done = ui.renderingComponents();

  await Promise.all(componentNames.map(async (pageName, _index) => {
    const content = await renderComponent(
      pages[pageName],
      { path: pageName },
      pageName,
    );
    renderedPages[pageName] = {
      name: pageName,
      content,
    };
  }));

  done();

  return renderedPages;
}
