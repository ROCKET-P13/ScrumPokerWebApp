export const FLIGHT_EASING_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const FLIGHT_DURATION_MS = 420;

const FLIGHT_EASING = FLIGHT_EASING_CSS;
const FLIGHT_DURATION_MILLISECONDS = FLIGHT_DURATION_MS;

export function prefersReducedMotion (): boolean {
	if (typeof window === 'undefined' || !window.matchMedia) {
		return false;
	}

	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animates a fixed-position layer along the path from `sourceBoundingRect` to `destinationBoundingRect`.
 * The layer must use destination width/height and sit centered over the source (RoomPage).
 * Only translation runs so text is laid out at final size for the whole tween (no scale).
 */
export function runVoteCardFlight (
	flightLayerElement: HTMLElement,
	sourceBoundingRect: DOMRectReadOnly,
	destinationBoundingRect: DOMRectReadOnly
): Promise<void> {
	const layerStartLeft
		= sourceBoundingRect.left + (sourceBoundingRect.width - destinationBoundingRect.width) / 2;
	const layerStartTop
		= sourceBoundingRect.top + (sourceBoundingRect.height - destinationBoundingRect.height) / 2;
	const translationXPixels = destinationBoundingRect.left - layerStartLeft;
	const translationYPixels = destinationBoundingRect.top - layerStartTop;

	if (prefersReducedMotion()) {
		flightLayerElement.style.transform = `translate(${translationXPixels}px, ${translationYPixels}px)`;
		flightLayerElement.style.transformOrigin = 'top left';

		return Promise.resolve();
	}

	const webAnimationsApiKeyframeEffect = flightLayerElement.animate(
		[
			{
				transform: 'translate(0, 0)',
				transformOrigin: 'top left',
			},
			{
				transform: `translate(${translationXPixels}px, ${translationYPixels}px)`,
				transformOrigin: 'top left',
			},
		],
		{
			duration: FLIGHT_DURATION_MILLISECONDS,
			easing: FLIGHT_EASING,
			fill: 'forwards',
		}
	);

	return new Promise((resolve) => {
		webAnimationsApiKeyframeEffect.onfinish = () => {
			webAnimationsApiKeyframeEffect.commitStyles?.();
			resolve();
		};

		webAnimationsApiKeyframeEffect.oncancel = () => {
			resolve();
		};
	});
}
