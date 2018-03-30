import fetch from 'node-fetch';
import { ContentApiOptions } from './types';
import chalk from 'chalk';

export function normaliseContentPath(path: string) {
  if (path === '/') {
    return path;
  }

  let fixedPath = path.endsWith('/') ? path.slice(0, -1) : path;
  fixedPath = !fixedPath.startsWith('/') ? `/${fixedPath}` : fixedPath;

  return fixedPath;
}

async function loadContentPathsFromApi(contentApiOptions: ContentApiOptions) {
  const response = await fetch(contentApiOptions.endpoint, {
    method: 'post',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query: `query AllContentPages {
        allPages {
          path
        }
      }`,
    }),
  });

  const data = await response.json();

  console.log(
    chalk`{keyword('orange') [content] {bold ${
      data.data.allPages.length
    }} page paths loaded from content api}`,
  );

  return data.data.allPages
    .map((page: { path: string | null }) => {
      if (!page.path || contentApiOptions.skipPaths.indexOf(page.path) >= 0) {
        return null;
      }

      return normaliseContentPath(page.path);
    })
    .filter((page: { path: string | null }) => page !== null);
}

export function createContentCache() {
  const cache = { paths: null, data: null };
  console.log(chalk`{keyword('orange') [content] content api enabled.}`);

  return {
    async getAllPaths(contentApiOptions: ContentApiOptions) {
      if (cache.paths !== null) {
        return cache.paths;
      }

      const paths = await loadContentPathsFromApi(contentApiOptions);
      cache.paths = paths;

      return paths;
    },
  };
}
