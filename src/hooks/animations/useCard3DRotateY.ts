import { animate, type JSAnimation } from 'animejs';
import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

import { TABLE_CARD_FLIP_DURATION_MS } from '@/utils/voteFlightGeometry';

import { tableCardFlipEase } from './animeEasing';

/**
 * Animates a 3D flip container’s `rotateY` (degrees). Invokes `onSettled` once per completed tween toward `targetDegrees`.
 */
export const useCard3DRotateY = (
	elementRef: RefObject<HTMLElement | null>,
	targetDegrees: number,
	options: {
		reducedMotion: boolean;
		onSettled?: () => void;
	}
): void => {
	const { reducedMotion, onSettled } = options;
	const animationRef = useRef<JSAnimation | null>(null);
	const onSettledRef = useRef(onSettled);
	const previousDegreesRef = useRef<number | undefined>(undefined);

	useLayoutEffect(() => {
		onSettledRef.current = onSettled;

		const element = elementRef.current;

		if (!element) {
			return;
		}

		let effectCancelled = false;

		animationRef.current?.revert();
		animationRef.current = null;

		if (previousDegreesRef.current === undefined) {
			previousDegreesRef.current = targetDegrees;
			element.style.transform = `rotateY(${targetDegrees}deg)`;

			return () => {
				effectCancelled = true;
			};
		}

		if (previousDegreesRef.current === targetDegrees) {
			return () => {
				effectCancelled = true;
			};
		}

		const fromDegrees = previousDegreesRef.current;

		previousDegreesRef.current = targetDegrees;

		if (reducedMotion) {
			element.style.transform = `rotateY(${targetDegrees}deg)`;
			onSettledRef.current?.();

			return () => {
				effectCancelled = true;
			};
		}

		element.style.transform = `rotateY(${fromDegrees}deg)`;

		animationRef.current = animate(element, {
			rotateY: targetDegrees,
			duration: TABLE_CARD_FLIP_DURATION_MS,
			ease: tableCardFlipEase,
			onComplete: () => {
				if (effectCancelled) {
					return;
				}

				onSettledRef.current?.();
			},
		});

		return () => {
			effectCancelled = true;
			animationRef.current?.revert();
			animationRef.current = null;
		};
	}, [elementRef, reducedMotion, targetDegrees]); // eslint-disable-line react-hooks/exhaustive-deps -- onSettled via ref
};
