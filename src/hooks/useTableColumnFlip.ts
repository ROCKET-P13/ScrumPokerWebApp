import { type RefObject, useLayoutEffect, useRef } from 'react';

import { SELF_FLIP_COLUMN_KEY } from '@/Components/Voting/votingTableConstants';
import { FLIGHT_DURATION_MS, prefersReducedMotion } from '@/utils/runVoteCardFlight';

const FLIP_COLUMN_ANIMATION_DURATION_MS = FLIGHT_DURATION_MS;
const FLIP_COLUMN_ANIMATION_EASING_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';
/** Ignore noise smaller than this (device px); compare raw deltas, snap only when applying CSS. */
const FLIP_LAYOUT_DELTA_EPSILON_PIXELS = 0.02;

function snapLayoutDeltaPixels (layoutDelta: number): number {
	return Math.round(layoutDelta * 100) / 100;
}

type FlipAnimationFrameChainIds = {
	outerFrameRequestId?: number;
	innerFrameRequestId?: number;
};

export function useTableColumnFlip (
	tableRowRef: RefObject<HTMLDivElement | null>,
	flipLayoutKey: string,
	isRevealed: boolean,
	exitingForLayout: ReadonlySet<string>
) {
	const previousColumnBoundingRectsRef = useRef<Map<string, DOMRectReadOnly>>(new Map());
	const flipInlineStylesClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const flipAnimationFrameChainIdsRef = useRef<FlipAnimationFrameChainIds>({});

	useLayoutEffect(() => {
		const clearFlipInlineStylesFromColumns = () => {
			const animationFrameChain = flipAnimationFrameChainIdsRef.current;

			if (animationFrameChain.outerFrameRequestId !== undefined) {
				cancelAnimationFrame(animationFrameChain.outerFrameRequestId);
				animationFrameChain.outerFrameRequestId = undefined;
			}

			if (animationFrameChain.innerFrameRequestId !== undefined) {
				cancelAnimationFrame(animationFrameChain.innerFrameRequestId);
				animationFrameChain.innerFrameRequestId = undefined;
			}

			if (flipInlineStylesClearTimeoutRef.current !== undefined) {
				clearTimeout(flipInlineStylesClearTimeoutRef.current);
				flipInlineStylesClearTimeoutRef.current = undefined;
			}

			tableRowRef.current?.querySelectorAll<HTMLElement>('[data-table-flip-column]').forEach((columnElement) => {
				columnElement.style.transition = '';
				columnElement.style.removeProperty('transform');
			});
		};

		if (isRevealed) {
			previousColumnBoundingRectsRef.current.clear();
			clearFlipInlineStylesFromColumns();

			return;
		}

		const tableRowElement = tableRowRef.current;

		if (!tableRowElement) {
			return;
		}

		const previousRectsSnapshot = new Map(previousColumnBoundingRectsRef.current);
		const columnElements = tableRowElement.querySelectorAll<HTMLElement>('[data-table-flip-column]');
		const nextColumnBoundingRects = new Map<string, DOMRectReadOnly>();
		const columnKeysScheduledForFlipAnimation = new Set<string>();

		columnElements.forEach((columnElement) => {
			const flipColumnKey = columnElement.dataset.tableFlipColumn;

			if (!flipColumnKey) {
				return;
			}

			nextColumnBoundingRects.set(flipColumnKey, columnElement.getBoundingClientRect());
		});

		const columnIsEligibleForFlipTransform = (flipColumnKey: string): boolean => {
			if (flipColumnKey === SELF_FLIP_COLUMN_KEY) {
				return false;
			}

			if (exitingForLayout.has(flipColumnKey)) {
				return false;
			}

			return true;
		};

		const buildStoredBoundingRectsForNextFrame = (): Map<string, DOMRectReadOnly> => {
			const storedBoundingRects = new Map(nextColumnBoundingRects);

			for (const exitingParticipantDisplayName of exitingForLayout) {
				if (!nextColumnBoundingRects.has(exitingParticipantDisplayName)) {
					continue;
				}

				const frozenBoundingRect = previousRectsSnapshot.get(exitingParticipantDisplayName);

				if (frozenBoundingRect) {
					storedBoundingRects.set(exitingParticipantDisplayName, frozenBoundingRect);
				}
			}

			return storedBoundingRects;
		};

		if (prefersReducedMotion()) {
			previousColumnBoundingRectsRef.current = nextColumnBoundingRects;

			return clearFlipInlineStylesFromColumns;
		}

		columnElements.forEach((columnElement) => {
			const flipColumnKey = columnElement.dataset.tableFlipColumn;

			if (!flipColumnKey || !columnIsEligibleForFlipTransform(flipColumnKey)) {
				return;
			}

			const nextBoundingRect = nextColumnBoundingRects.get(flipColumnKey);

			if (!nextBoundingRect) {
				return;
			}

			const previousBoundingRect = previousRectsSnapshot.get(flipColumnKey);

			if (!previousBoundingRect) {
				return;
			}

			const layoutDeltaX = previousBoundingRect.left - nextBoundingRect.left;
			const layoutDeltaY = previousBoundingRect.top - nextBoundingRect.top;

			if (
				Math.abs(layoutDeltaX) > FLIP_LAYOUT_DELTA_EPSILON_PIXELS
				|| Math.abs(layoutDeltaY) > FLIP_LAYOUT_DELTA_EPSILON_PIXELS
			) {
				columnKeysScheduledForFlipAnimation.add(flipColumnKey);
				columnElement.style.transform
					= `translate3d(${snapLayoutDeltaPixels(layoutDeltaX)}px, ${snapLayoutDeltaPixels(layoutDeltaY)}px, 0)`;
				columnElement.style.transition = 'transform 0s';
			}
		});

		if (columnKeysScheduledForFlipAnimation.size === 0) {
			previousColumnBoundingRectsRef.current = buildStoredBoundingRectsForNextFrame();

			return clearFlipInlineStylesFromColumns;
		}

		const animationFrameChain = flipAnimationFrameChainIdsRef.current;

		animationFrameChain.outerFrameRequestId = requestAnimationFrame(() => {
			animationFrameChain.outerFrameRequestId = undefined;

			animationFrameChain.innerFrameRequestId = requestAnimationFrame(() => {
				animationFrameChain.innerFrameRequestId = undefined;

				const tableRowElementAfterFrames = tableRowRef.current;

				if (!tableRowElementAfterFrames) {
					return;
				}

				tableRowElementAfterFrames.querySelectorAll<HTMLElement>('[data-table-flip-column]').forEach((columnElement) => {
					const flipColumnKey = columnElement.dataset.tableFlipColumn;

					if (!flipColumnKey || !columnKeysScheduledForFlipAnimation.has(flipColumnKey)) {
						return;
					}

					columnElement.style.transition
						= `transform ${FLIP_COLUMN_ANIMATION_DURATION_MS}ms ${FLIP_COLUMN_ANIMATION_EASING_CSS}`;
					columnElement.style.transform = 'translate3d(0, 0, 0)';
				});

				previousColumnBoundingRectsRef.current = buildStoredBoundingRectsForNextFrame();

				if (flipInlineStylesClearTimeoutRef.current !== undefined) {
					clearTimeout(flipInlineStylesClearTimeoutRef.current);
				}

				flipInlineStylesClearTimeoutRef.current = window.setTimeout(() => {
					flipInlineStylesClearTimeoutRef.current = undefined;

					const tableRowElementForCleanup = tableRowRef.current;

					if (!tableRowElementForCleanup) {
						return;
					}

					tableRowElementForCleanup.querySelectorAll<HTMLElement>('[data-table-flip-column]').forEach((columnElement) => {
						const flipColumnKey = columnElement.dataset.tableFlipColumn;

						if (!flipColumnKey || !columnKeysScheduledForFlipAnimation.has(flipColumnKey)) {
							return;
						}

						columnElement.style.transition = '';
						columnElement.style.removeProperty('transform');
					});
				}, FLIP_COLUMN_ANIMATION_DURATION_MS);
			});
		});

		return clearFlipInlineStylesFromColumns;
	}, [flipLayoutKey, isRevealed, exitingForLayout, tableRowRef]);
}
