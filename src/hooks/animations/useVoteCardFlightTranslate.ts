import { animate, type JSAnimation } from 'animejs';
import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

import { VOTE_CARD_FLIGHT_DURATION_MS } from '@/utils/voteFlightGeometry';

import { voteCardMotionEase } from './animeEasing';

/**
 * One-shot overlay flight from `(0, 0)` to `(x, y)` in layer space; calls `onComplete` when finished or when motion is reduced.
 */
export const useVoteCardFlightTranslate = (
	elementRef: RefObject<HTMLElement | null>,
	params: {
		x: number;
		y: number;
		reducedMotion: boolean;
		onComplete: () => void;
	}
): void => {
	const { x, y, reducedMotion, onComplete } = params;
	const animationRef = useRef<JSAnimation | null>(null);
	const onCompleteRef = useRef(onComplete);

	useLayoutEffect(() => {
		onCompleteRef.current = onComplete;

		const element = elementRef.current;

		if (!element) {
			return;
		}

		let effectCancelled = false;

		const finish = () => {
			if (effectCancelled) {
				return;
			}

			onCompleteRef.current();
		};

		animationRef.current?.revert();
		animationRef.current = null;

		if (reducedMotion) {
			element.style.transform = `translate(${x}px, ${y}px)`;
			finish();

			return () => {
				effectCancelled = true;
			};
		}

		animationRef.current = animate(element, {
			x,
			y,
			duration: VOTE_CARD_FLIGHT_DURATION_MS,
			ease: voteCardMotionEase,
			onComplete: finish,
		});

		return () => {
			effectCancelled = true;
			animationRef.current?.revert();
			animationRef.current = null;
		};
	}, [elementRef, reducedMotion, x, y]); // eslint-disable-line react-hooks/exhaustive-deps -- onComplete via ref
};
