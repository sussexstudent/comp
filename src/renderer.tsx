import * as React from 'react';
import * as ReactDOM from 'react-dom/server';
import {
  RenderedTemplateMap,
  TemplateResultMap,
} from './types';

function render(
  Component: any,
  props: object,
  Providers: any,
  // location: string | undefined = undefined,
) {
  const finalElement: any = React.createElement(
    Providers,
    {},
    React.createElement(Component, props),
  );
  return ReactDOM.renderToStaticMarkup(finalElement);
}

export const renderHtml = (
  Html: any,
  children: any,
  assets: object,
  other: { inject?: object; compOptions?: string } = {},
) => {
  if (other.inject) {
    (global as any).mslInject = {
      ...((global as any).mslInject || {}),
      ...other.inject,
    };
  }

  let additionalHead = [];

  if (other.compOptions) {
    additionalHead.push(other.compOptions);
  }

  const finalElement: any = React.createElement(
    Html,
    { assets: assets, additionalHead },
    children,
  );
  return ReactDOM.renderToStaticMarkup(finalElement).replace(
    '{head_content}',
    '',
  );
};

export function renderTemplates(
  templates: TemplateResultMap,
  assets: any,
  Providers: any,
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
        Providers,
      ),
      templatePublic: render(
        templates[templateName].templatePublic,
        {
          assets,
          loggedIn: false,
        },
        Providers,
      ),
    };
  });

  return renderedTemplates;
}
