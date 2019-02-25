import deploy from './deploy';
import proxy from './server';
process.env['COMP'] = '1';

export { proxy, deploy };
