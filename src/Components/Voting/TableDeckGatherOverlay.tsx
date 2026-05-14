import { memo, useMemo, useRef, type ReactNode } from 'react';

import { GatherDeckPhase } from '@/Common/GatherDeckPhase';
import { useTranslateOpacityScale, voteCardMotionEase } from '@/hooks/animations';
import { TABLE_DECK_FADE_DURATION_MS, TABLE_DECK_STACK_DURATION_MS } from '@/utils/voteFlightGeometry';

/** Approximate column pitch (card width + gap) for centering the stack. */
export const GATHER_DECK_COLUMN_PITCH_PX = 124;

const gatherDeckColumnMotionDurationMs = (phase: GatherDeckPhase | null, reduced: boolean): number => {
	if (phase == null || reduced) {
		return 0;
	}

	if (phase === GatherDeckPhase.FLIP) {
		return 0;
	}

	if (phase === GatherDeckPhase.STACK) {
		return TABLE_DECK_STACK_DURATION_MS;
	}

	return TABLE_DECK_FADE_DURATION_MS;
};

/**
 * Column wrapper for deck-gather: stack + fade motion on the **same** in-flow table column
 * so cards stay aligned with the flex row until transforms run.
 */
export const GatherDeckAnimatedColumn = memo(({
	phase,
	reduced,
	zIndex,
	towardCenterPx,
	tableFlipColumnKey,
	children,
}: {
	phase: GatherDeckPhase | null;
	reduced: boolean;
	zIndex?: number;
	towardCenterPx: number;
	tableFlipColumnKey: string;
	children: ReactNode;
}) => {
	const columnRootRef = useRef<HTMLDivElement>(null);

	const motionTarget = useMemo(() => {
		if (phase == null) {
			return {
				x: 0,
				y: 0,
				opacity: 1,
				scale: 1,
			};
		}

		const stackActive = phase !== GatherDeckPhase.FLIP;

		return {
			x: stackActive ? towardCenterPx : 0,
			y: 0,
			opacity: phase === GatherDeckPhase.FADE ? 0 : 1,
			scale: phase === GatherDeckPhase.FADE ? 0.88 : 1,
		};
	}, [phase, towardCenterPx]);

	const durationMs = gatherDeckColumnMotionDurationMs(phase, reduced);

	useTranslateOpacityScale(columnRootRef, motionTarget, {
		durationMs,
		ease: voteCardMotionEase,
		reducedMotion: reduced,
	});

	return (
		<div
			ref={columnRootRef}
			className="relative flex flex-col items-center gap-2"
			style={typeof zIndex === 'number' ? { zIndex } : undefined}
			data-table-flip-column={tableFlipColumnKey}
		>
			{children}
		</div>
	);
});

GatherDeckAnimatedColumn.displayName = 'GatherDeckAnimatedColumn';
