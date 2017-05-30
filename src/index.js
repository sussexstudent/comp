import generator from './generator';
import proxy from './server';
console.log('comp v1');
process.env['COMP'] = 1;


export { generator, proxy };
