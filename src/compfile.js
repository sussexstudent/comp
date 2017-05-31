import path from 'path';

export function loadCompfile(name = './compfile.js') {

  return require(path.join(process.cwd(), name)).default;
}

export function getPageComponentFromConf(compfile, componentPath) {
  return require(path.join(compfile.root, compfile.pages[componentPath])).default;
}


export function resolveAllPages(compfile) {
  const components = {};

  Object.keys(compfile.pages).forEach(componentPath => {
    components[componentPath] = getPageComponentFromConf(compfile, componentPath);
  });

  return components;
}
