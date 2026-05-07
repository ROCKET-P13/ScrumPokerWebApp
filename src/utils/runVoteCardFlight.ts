export const FLIGHT_EASING_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const FLIGHT_DURATION_MS = 420;

const EASING = FLIGHT_EASING_CSS;
const DURATION_MS = FLIGHT_DURATION_MS;

export function prefersReducedMotion (): boolean {
	if (typeof window === 'undefined' || !window.matchMedia) {
		return false;
	}

	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animates a fixed-position layer from `from` to `to` using transform (top-left origin).
 * The layer should already be laid out at `from` size and screen position.
 */
export function runVoteCardFlight (
	element: HTMLElement,
	from: DOMRectReadOnly,
	to: DOMRectReadOnly
): Promise<void> {
	const dx = to.left - from.left;
	const dy = to.top - from.top;
	const sx = to.width / from.width;
	const sy = to.height / from.height;

	if (prefersReducedMotion()) {
		element.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
		element.style.transformOrigin = 'top left';

		return Promise.resolve();
	}

	const animation = element.animate(
		[
			{
				transform: 'translate(0, 0) scale(1)',
				transformOrigin: 'top left',
			},
			{
				transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
				transformOrigin: 'top left',
			},
		],
		{
			duration: DURATION_MS,
			easing: EASING,
			fill: 'forwards',
		}
	);

	return new Promise((resolve) => {
		animation.onfinish = () => {
			resolve();
		};

		animation.oncancel = () => {
			resolve();
		};
	});
}
