import type { CSSProperties } from 'react';

/** Matches historical flight timing / CSS comments */
export const VOTE_CARD_FLIGHT_DURATION_MS = 420;

/** Table flip cards (`FlippableFaceDownVoteCard`) — single source for flip + gather timers */
export const TABLE_CARD_FLIP_DURATION_MS = 770;

/** After reveal-reset: gather columns into a pile, then fade */
export const TABLE_DECK_STACK_DURATION_MS = 380;
export const TABLE_DECK_FADE_DURATION_MS = 420;

/**
 * Fixed layer: destination size, top-left centered over the source rect (hand or table).
 */
export const getVoteCardFlightFixedLayerStyle = (
	sourceBoundingRect: DOMRectReadOnly,
	destinationBoundingRect: DOMRectReadOnly
): CSSProperties => ({
	position: 'fixed',
	left:
		sourceBoundingRect.left
		+ (sourceBoundingRect.width - destinationBoundingRect.width) / 2,
	top:
		sourceBoundingRect.top
		+ (sourceBoundingRect.height - destinationBoundingRect.height) / 2,
	width: destinationBoundingRect.width,
	height: destinationBoundingRect.height,
	isolation: 'isolate',
	willChange: 'transform',
	transform: 'translateZ(0)',
});

export const getVoteCardFlightTranslationPixels = (
	sourceBoundingRect: DOMRectReadOnly,
	destinationBoundingRect: DOMRectReadOnly
): { translationXPixels: number; translationYPixels: number } => {
	const layerStartLeft
		= sourceBoundingRect.left + (sourceBoundingRect.width - destinationBoundingRect.width) / 2;
	const layerStartTop
		= sourceBoundingRect.top + (sourceBoundingRect.height - destinationBoundingRect.height) / 2;

	return {
		translationXPixels: destinationBoundingRect.left - layerStartLeft,
		translationYPixels: destinationBoundingRect.top - layerStartTop,
	};
};
