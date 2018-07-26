export interface ContentApiOptions {
  endpoint: string;
  template: any;
  transformPath?(path: string): string;
  skipPaths: Array<string>;
}

export interface Compfile {
  root: string;
  html: any;
  pages: {
    [path: string]: any;
  };
  templates: {
    [name: string]: any;
  };
  assets: {
    gitRev?: string;
  };
  providers: any;
  contentApi?: ContentApiOptions;
}

export interface CompfileWatcher {
  getCompfile(): Compfile;
}

type HeadFunction = (assets: any) => string;

export interface TemplateResult {
  name?: string;
  head: HeadFunction;
  templatePublic?: any;
  templateLoggedIn?: any;
  template?: any;
}

export interface TemplateResultMap {
  [templateName: string]: TemplateResult;
}

export interface RenderedTemplate {
  name: string;
  head: string;
  templatePublic?: string;
  templateLoggedIn?: string;
  template?: string;
}

export interface RenderedTemplateMap {
  [templateName: string]: RenderedTemplate;
}

export type PageComponent = any;

export interface PageComponentMap {
  [pageName: string]: PageComponent;
}

export interface PageResult {
  name: string;
  content: string;
}

export interface PageResultMap {
  [path: string]: PageResult;
}

export type StateSnapshot = {
  pages: PageResultMap;
  templates: RenderedTemplateMap;
};

export type DirtyTemplates = Array<{
  name: string;
  isNew?: boolean;
  dirtyHead?: boolean;
  dirtyTemplateLoggedIn?: boolean;
  dirtyTemplatePublic?: boolean;
  templatesCombined: boolean;
}>;

export type DirtyPages = Array<string>;

export interface DirtyChangeset {
  dirtyTemplates: DirtyTemplates;
  dirtyPages: DirtyPages;
}

export enum HydroleafMode {
  RenderToString = 'RENDER_TO_STRING',
  RenderToComponent = 'RENDER_TO_COMPONENT',
}
