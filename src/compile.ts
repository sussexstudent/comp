import * as webpack from 'webpack';
import * as nodeExternals from 'webpack-node-externals';
import * as path from 'path';

export function createCompiler(compfilePath: string) {
  const prodOptions = require(path.join(
    process.cwd(),
    'webpack.comp.config.js'
  ));
  const options = {
    ...prodOptions,
    entry: compfilePath,
    target: 'node',
    externals: nodeExternals(),
    plugins: [...prodOptions.plugins],
    output: {
      ...prodOptions.output,
      library: 'CompApp',
      libraryTarget: 'umd',
    },
  };

  return webpack(options);
}
