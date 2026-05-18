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

export default defineConfig(({ mode }) => ({
	base: mode === 'production' ? productionBase : '/',
	plugins: [
		react(),
		tailwindcss(),
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
}));
