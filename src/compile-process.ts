import * as path from "path";
import * as webpack from "webpack";
import * as nodeExternals from "webpack-node-externals";

function getWebpackInstance(compfilePath: string) {
  const prodOptions = require(path.join(
    process.cwd(),
    './config/webpack.comp.config.js'
  ));
  const options = {
    ...prodOptions,
    entry: compfilePath,
    target: 'node',
    externals: nodeExternals(),
    plugins: [
      ...prodOptions.plugins,
      new webpack.DefinePlugin({
        'process.env.COMP_NODE': '1',
      }),
    ],
    output: {
      ...prodOptions.output,
      library: 'CompApp',
      libraryTarget: 'umd',
    },
  };

  return webpack(options);
}

if (!process.send) {
  console.error('not in child process');
  process.exit(1);
} else {
  function watch(compfilePath: string, process: any) {
    const webpack = getWebpackInstance(compfilePath);
    webpack.watch({}, (err, _stats) => {
      if (err) {
        console.log(err);
      } else {
        process.send({ type: 'status', value: 'compiled' })
      }
    })
  }

  function run(compfilePath: string, process: any) {
    const webpack = getWebpackInstance(compfilePath);

    webpack.run((err, _stats) => {
      if (err) {
        console.log(err);
        process.send({ type: 'status', value: 'error' })
      } else {
        process.send({ type: 'status', value: 'compiled' })
      }
    })
  }


  process.on('message', (message) => {
    const { type, value } = message;
    if (type === 'start') {
      if (value === 'watch') {
        watch(message.compfilePath, process);
      } else if (value === 'run') {
        run(message.compfilePath, process);
      }
    }
  });
}
