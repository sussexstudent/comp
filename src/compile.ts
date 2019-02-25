import * as childProcess from 'child_process';
import * as EventEmitter from 'events';
import * as path from 'path';

class WebpackEmitter extends EventEmitter {}

export function createCompilerWatcher(compfilePath: string): WebpackEmitter {
  const compilerChild = childProcess.fork(
    path.join(__dirname, './compile-process'),
  );
  const ee = new WebpackEmitter();

  compilerChild.send({ type: 'start', value: 'watch', compfilePath });

  compilerChild.on('message', ({ type, value }) => {
    if (type === 'status') {
      if (value === 'compiling') {
      } else if (value === 'compiled') {
        ee.emit('compile');
      }
    }
  });

  return ee;
}

export function createCompiler(compfilePath: string) {
  const compilerChild = childProcess.fork(
    path.join(__dirname, './compile-process'),
  );
  compilerChild.send({ type: 'start', value: 'run', compfilePath });

  return new Promise((resolve, reject) => {
    compilerChild.on('message', ({ type, value }) => {
      if (type === 'status') {
        if (value === 'compiled') {
          compilerChild.kill();
          resolve();
        } else if (value === 'error') {
          compilerChild.kill();
          reject();
        }
      }
    });
  });
}
