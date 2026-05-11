import { animate, type JSAnimation } from 'animejs';
import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

import { voteCardMotionEase } from './animeEasing';

const LABEL_FADE_MS = 280;

/**
 * Drives `opacity` on a DOM node for simple show/hide without React re-mount churn.
 */
export const useAnimeOpacity = (
	elementRef: RefObject<HTMLElement | null>,
	targetOpacity: number,
	options: { reducedMotion: boolean }
): void => {
	const { reducedMotion } = options;
	const animationRef = useRef<JSAnimation | null>(null);

	useLayoutEffect(() => {
		const element = elementRef.current;

		if (!element) {
			return;
		}

		animationRef.current?.revert();
		animationRef.current = null;

		if (reducedMotion) {
			element.style.opacity = String(targetOpacity);

			return;
		}

		animationRef.current = animate(element, {
			opacity: targetOpacity,
			duration: LABEL_FADE_MS,
			ease: voteCardMotionEase,
		});

		return () => {
			animationRef.current?.revert();
			animationRef.current = null;
		};
	}, [elementRef, reducedMotion, targetOpacity]);
};
