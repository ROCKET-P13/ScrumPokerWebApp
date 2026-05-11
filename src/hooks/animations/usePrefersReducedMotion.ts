import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Mirrors `window.matchMedia('(prefers-reduced-motion: reduce)')` for animation gating.
 */
export const usePrefersReducedMotion = (): boolean | null => {
	const [matches, setMatches] = useState<boolean | null>(null);

	useEffect(() => {
		const mediaQueryList = window.matchMedia(QUERY);

		const sync = () => {
			setMatches(mediaQueryList.matches);
		};

		sync();
		mediaQueryList.addEventListener('change', sync);

		return () => {
			mediaQueryList.removeEventListener('change', sync);
		};
	}, []);

	return matches;
};
