import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const indexPath = path.join(dist, 'index.html');
const notFoundPath = path.join(dist, '404.html');

if (!fs.existsSync(indexPath)) {
	console.error('Missing dist/index.html. Run vite build first.');
	process.exit(1);
}

fs.copyFileSync(indexPath, notFoundPath);
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log('Wrote dist/404.html and dist/.nojekyll (GitHub Pages).');
