require('babel-register');
import generator from './generator';
import proxy from './server';
process.env['COMP'] = 1;

export { generator, proxy };
