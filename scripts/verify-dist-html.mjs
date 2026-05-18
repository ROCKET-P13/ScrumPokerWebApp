import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const indexPath = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	'..',
	'dist',
	'index.html'
);

const html = fs.readFileSync(indexPath, 'utf8');

if (html.includes('/src/') || html.includes('src/main.')) {
	console.error(
		'dist/index.html still references /src/ — build output is invalid for deploy.',
	);
	process.exit(1);
}

if (!html.includes('/assets/')) {
	console.error('dist/index.html has no /assets/ bundle — build output looks wrong.');
	process.exit(1);
}

console.log('dist/index.html OK (hashed bundles).');
