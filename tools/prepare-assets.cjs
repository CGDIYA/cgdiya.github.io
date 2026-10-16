const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const fontRoot = path.dirname(require.resolve('@fortawesome/fontawesome-free/package.json'));
const target = path.join(projectRoot, 'source/vendor/fontawesome');
fs.mkdirSync(path.join(target, 'css'), { recursive: true });
fs.copyFileSync(path.join(fontRoot, 'css/all.min.css'), path.join(target, 'css/all.min.css'));
fs.cpSync(path.join(fontRoot, 'webfonts'), path.join(target, 'webfonts'), { recursive: true });
fs.copyFileSync(path.join(fontRoot, 'LICENSE.txt'), path.join(target, 'LICENSE.txt'));
console.log('Local icon styles and fonts prepared.');
