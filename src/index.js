require('babel-register');
import generator from './generator';
import proxy from './server';
process.env['COMP'] = 1;
process.on('unhandledRejection', (err, p) => {
  console.log('An unhandledRejection occurred');
  console.log(`Rejected Promise: ${p}`);
  console.log(`Rejection: ${err}`);
});
export { generator, proxy };
