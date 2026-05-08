import type { CSSProperties } from 'react';

/** Matches historical flight timing / CSS comments */
export const VOTE_CARD_FLIGHT_DURATION_MS = 420;

/** Table flip cards (`FlippableFaceDownVoteCard`) — single source for flip + gather timers */
export const TABLE_CARD_FLIP_DURATION_MS = 770;

/** After reveal-reset: gather columns into a pile, then fade */
export const TABLE_DECK_STACK_DURATION_MS = 520;
export const TABLE_DECK_FADE_DURATION_MS = 420;

export const VOTE_CARD_FLIGHT_TRANSITION = {
	duration: VOTE_CARD_FLIGHT_DURATION_MS / 1000,
	ease: [0.22, 1, 0.36, 1] as const,
};

/** Shared easing/duration for Framer `layout` on table columns (horizontal reorder). */
export const TABLE_COLUMN_LAYOUT_TRANSITION = {
	layout: {
		duration: VOTE_CARD_FLIGHT_DURATION_MS / 1000,
		ease: [0.22, 1, 0.36, 1] as const,
	},
};

/**
 * Fixed layer: destination size, top-left centered over the source rect (hand or table).
 */
export function getVoteCardFlightFixedLayerStyle (
	sourceBoundingRect: DOMRectReadOnly,
	destinationBoundingRect: DOMRectReadOnly
): CSSProperties {
	return {
		position: 'fixed',
		left:
			sourceBoundingRect.left
			+ (sourceBoundingRect.width - destinationBoundingRect.width) / 2,
		top:
			sourceBoundingRect.top
			+ (sourceBoundingRect.height - destinationBoundingRect.height) / 2,
		width: destinationBoundingRect.width,
		height: destinationBoundingRect.height,
	};
}

export function getVoteCardFlightTranslationPixels (
	sourceBoundingRect: DOMRectReadOnly,
	destinationBoundingRect: DOMRectReadOnly
): { translationXPixels: number; translationYPixels: number } {
	const layerStartLeft
		= sourceBoundingRect.left + (sourceBoundingRect.width - destinationBoundingRect.width) / 2;
	const layerStartTop
		= sourceBoundingRect.top + (sourceBoundingRect.height - destinationBoundingRect.height) / 2;

	return {
		translationXPixels: destinationBoundingRect.left - layerStartLeft,
		translationYPixels: destinationBoundingRect.top - layerStartTop,
	};
}
