import generator from './generator';
import deploy from './deploy';
import proxy from './server';
process.env['COMP'] = '1';

export { generator, proxy, deploy };
