import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
}

const getInitialTheme = (): Theme => {
	if (typeof window === 'undefined') {
		return 'light';
	};

	const stored = localStorage.getItem('theme') as Theme | null;

	if (stored) return stored;

	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

	return prefersDark ? 'dark' : 'light';
};

const applyTheme = (theme: Theme) => {
	const root = document.documentElement;

	if (theme === 'dark') {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}
};

export const themeStore = create < ThemeState > ((set, get) => ({
	theme: getInitialTheme(),

	setTheme: (theme) => {
		localStorage.setItem('theme', theme);
		applyTheme(theme);
		set({ theme });
	},

	toggleTheme: () => {
		const current = get().theme;
		const next = current === 'light' ? 'dark' : 'light';

		localStorage.setItem('theme', next);
		applyTheme(next);
		set({ theme: next });
	},
}));