import { animate, type JSAnimation } from 'animejs';
import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

type TransformTarget = {
	x: number;
	y: number;
	opacity: number;
	scale: number;
};

type EaseFn = (time: number) => number;

/**
 * Tweens transform (`x`/`y`), `opacity`, and `scale` on a single element when `target` or `durationMs` changes.
 * Ends prior tweens with `complete(true)` so chained phases (e.g. gather stack → fade) do not `revert()` to t=0.
 */
export const useTranslateOpacityScale = (
	elementRef: RefObject<HTMLElement | null>,
	target: TransformTarget,
	options: {
		durationMs: number;
		ease: EaseFn;
		reducedMotion: boolean;
	}
): void => {
	const { durationMs, ease, reducedMotion } = options;
	const animationRef = useRef<JSAnimation | null>(null);

	const finishActiveAnimationPreserveEndState = () => {
		const active = animationRef.current;

		if (!active) {
			return;
		}

		active.complete(true);
		animationRef.current = null;
	};

	useLayoutEffect(() => {
		const element = elementRef.current;

		if (!element) {
			return;
		}

		finishActiveAnimationPreserveEndState();

		if (reducedMotion || durationMs <= 0) {
			element.style.opacity = String(target.opacity);
			element.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) scale(${target.scale})`;

			return () => {
				finishActiveAnimationPreserveEndState();
			};
		}

		animationRef.current = animate(element, {
			x: target.x,
			y: target.y,
			opacity: target.opacity,
			scale: target.scale,
			duration: durationMs,
			ease,
		});

		return () => {
			finishActiveAnimationPreserveEndState();
		};
	}, [
		durationMs,
		ease,
		elementRef,
		reducedMotion,
		target.opacity,
		target.scale,
		target.x,
		target.y,
	]);
};
