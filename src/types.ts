export interface Compfile {
  skin: string;
  root: string;
  html: any;
  templates: {
    [name: string]: any;
  };
  assets: {
    gitRev?: string;
  };
  providers: any;
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
