import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Project sites load at https://username.github.io/repository-name/ — Vite `base` must match that path.
 * Local/production override: GH_PAGES_BASE=/RepoName/ npm run build
 * CI sets this from the repository name in `.github/workflows/deploy-github-pages.yml`.
 */
function normalizePublicBase (value: string): string {
	const trimmed = value.trim();
	const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
	return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

const DEFAULT_GH_PAGES_BASE = '/ScrumPokerWebApp/';
const productionBase = process.env.GH_PAGES_BASE
	? normalizePublicBase(process.env.GH_PAGES_BASE)
	: DEFAULT_GH_PAGES_BASE;

export default defineConfig(({ mode }) => {
	const resolvedBase = mode === 'production' ? productionBase : '/';

	return {
		base: resolvedBase,
		plugins: [
			react(),
			tailwindcss(),
			/**
			 * `./vite.svg` is resolved relative to the *current* URL. Client-side routes like
			 * `/room/…` would request `/room/vite.svg` (404). Use base-prefixed path instead.
			 */
			{
				name: 'html-favicon-base',
				transformIndexHtml (html) {
					return html.replace(
						'<link rel="icon" type="image/svg+xml" href="./vite.svg" />',
						`<link rel="icon" type="image/svg+xml" href="${resolvedBase}vite.svg" />`
					);
				},
			},
		],
		server: {
			proxy: {
				'/api': {
					target: 'http://localhost:5046',
					changeOrigin: true,
					secure: false,
				},
			},
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
				'@ui': path.resolve(__dirname, './src/ui'),
			},
		},
	};
});
