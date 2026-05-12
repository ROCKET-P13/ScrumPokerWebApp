import { animate, type JSAnimation } from 'animejs';
import { useLayoutEffect, useRef } from 'react';
import type { MutableRefObject, RefObject } from 'react';

import { VOTE_CARD_FLIGHT_DURATION_MS } from '@/utils/voteFlightGeometry';

import { voteCardMotionEase } from './animeEasing';

const COLUMN_SELECTOR = '[data-table-flip-column]';

function readColumnKey (element: Element): string | null {
	return element.getAttribute('data-table-flip-column');
}

function cloneRect (rect: DOMRect): DOMRect {
	return new DOMRect(rect.x, rect.y, rect.width, rect.height);
}

function collectColumnRectSnapshot (containerElement: HTMLElement): Map<string, DOMRect> {
	const snapshot = new Map<string, DOMRect>();
	const columnElements = Array.from(containerElement.querySelectorAll(COLUMN_SELECTOR));

	for (const columnElement of columnElements) {
		const columnKey = readColumnKey(columnElement);

		if (!columnKey) {
			continue;
		}

		snapshot.set(columnKey, cloneRect(columnElement.getBoundingClientRect()));
	}

	return snapshot;
}

function revertAndClearColumnTransforms (
	activeByKeyRef: MutableRefObject<Map<string, JSAnimation>>,
	containerElement: HTMLElement
): void {
	for (const activeAnimation of activeByKeyRef.current.values()) {
		activeAnimation.revert();
	}

	activeByKeyRef.current.clear();

	const columnElements = Array.from(containerElement.querySelectorAll(COLUMN_SELECTOR));

	for (const columnElement of columnElements) {
		if (columnElement instanceof HTMLElement) {
			columnElement.style.transform = '';
			columnElement.style.willChange = '';
		}
	}
}

/**
 * FLIP translation for flex-reordered table columns (replaces Framer `layout="position"`).
 * When `hideSelfTableCardDuringFlight` toggles alone (vote flight overlay), only the rect snapshot
 * is refreshed so peer columns are not inverted then tweened — that produced visible lateral wobble.
 */
export const useFlipColumnLayout = (
	containerRef: RefObject<HTMLElement | null>,
	options: {
		layoutEpoch: string;
		reducedMotion: boolean;
		hideSelfTableCardDuringFlight: boolean;
	}
): void => {
	const { layoutEpoch, reducedMotion, hideSelfTableCardDuringFlight } = options;
	const previousRectsByKeyRef = useRef<Map<string, DOMRect>>(new Map());
	const activeByKeyRef = useRef<Map<string, JSAnimation>>(new Map());
	const previousLayoutEpochRef = useRef(layoutEpoch);
	const previousHideSelfTableCardRef = useRef(hideSelfTableCardDuringFlight);

	useLayoutEffect(() => {
		const containerElement = containerRef.current;

		if (!containerElement) {
			return;
		}

		const epochChanged = previousLayoutEpochRef.current !== layoutEpoch;
		const hideSelfCardChanged = previousHideSelfTableCardRef.current !== hideSelfTableCardDuringFlight;

		previousLayoutEpochRef.current = layoutEpoch;
		previousHideSelfTableCardRef.current = hideSelfTableCardDuringFlight;

		if (reducedMotion) {
			revertAndClearColumnTransforms(activeByKeyRef, containerElement);
			previousRectsByKeyRef.current = collectColumnRectSnapshot(containerElement);

			return;
		}

		if (hideSelfCardChanged && !epochChanged) {
			// Do not revert running FLIP tweens: that was cutting off column motion when the vote
			// flight hid the self slot on the following commit with an unchanged layout epoch.
			previousRectsByKeyRef.current = collectColumnRectSnapshot(containerElement);

			return;
		}

		const columnElements = Array.from(containerElement.querySelectorAll(COLUMN_SELECTOR));

		for (const activeAnimation of activeByKeyRef.current.values()) {
			activeAnimation.revert();
		}

		activeByKeyRef.current.clear();

		for (const columnElement of Array.from(containerElement.querySelectorAll(COLUMN_SELECTOR))) {
			if (columnElement instanceof HTMLElement) {
				columnElement.style.willChange = '';
			}
		}

		const previousRectsByKey = previousRectsByKeyRef.current;
		const nextSnapshot = new Map<string, DOMRect>();

		for (const columnElement of columnElements) {
			const columnKey = readColumnKey(columnElement);

			if (!columnKey || !(columnElement instanceof HTMLElement)) {
				continue;
			}

			const currentRect = cloneRect(columnElement.getBoundingClientRect());
			const previousRect = previousRectsByKey.get(columnKey);

			if (previousRect) {
				const deltaX = previousRect.left - currentRect.left;
				const deltaY = previousRect.top - currentRect.top;

				if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
					columnElement.style.willChange = 'transform';
					columnElement.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;

					const activeAnimation = animate(columnElement, {
						x: 0,
						y: 0,
						duration: VOTE_CARD_FLIGHT_DURATION_MS,
						ease: voteCardMotionEase,
						onComplete: () => {
							columnElement.style.transform = '';
							columnElement.style.willChange = '';
							activeByKeyRef.current.delete(columnKey);
						},
					});

					activeByKeyRef.current.set(columnKey, activeAnimation);
				}
			}

			nextSnapshot.set(columnKey, currentRect);
		}

		previousRectsByKeyRef.current = nextSnapshot;
	}, [containerRef, layoutEpoch, reducedMotion, hideSelfTableCardDuringFlight]);
};
