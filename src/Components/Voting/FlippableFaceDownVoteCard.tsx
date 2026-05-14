import { memo, type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { GatherDeckPhase } from '@/Common/GatherDeckPhase';
import { useCard3DRotateY } from '@/hooks/animations';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

import { FaceDownCard } from './FaceDownCard';
import { VotingCard } from './VotingCard';

const facePlaneStyle: CSSProperties = {
	backfaceVisibility: 'hidden',
	WebkitBackfaceVisibility: 'hidden',
};

export const FlippableFaceDownVoteCard = memo(({
	isRevealed,
	revealedValue,
	isExiting,
	prefersReducedMotion,
	frontFaceSelected = false,
	showFrontFaceWhileConcealed = false,
	tableSlotSuppressedForFlight = false,
	gatherDeckPhase = null,
}: {
	isRevealed: boolean;
	revealedValue: string;
	isExiting: boolean;
	prefersReducedMotion: boolean | null;
	frontFaceSelected?: boolean;
	/** Your own vote: keep the value face-up while the round is still concealed. */
	showFrontFaceWhileConcealed?: boolean;
	/** While true: the table slot is hidden during the hand→table flight; used to replay face-down entrance when shown again. */
	tableSlotSuppressedForFlight?: boolean;
	/** In-place deck gather: flip (FLIP) then stack/fade on the same DOM as the table. */
	gatherDeckPhase?: GatherDeckPhase | null;
}) => {
	const reduced = Boolean(prefersReducedMotion);
	const gathering = gatherDeckPhase != null;

	const [suppressFaceDownEnterAfterGather, setSuppressFaceDownEnterAfterGather] = useState(false);
	const prevGatherDeckPhaseRef = useRef(gatherDeckPhase);

	useLayoutEffect(() => {
		const previousGatherDeckPhase = prevGatherDeckPhaseRef.current;

		if (isRevealed) {
			setSuppressFaceDownEnterAfterGather(false);
		} else if (gatherDeckPhase != null) {
			setSuppressFaceDownEnterAfterGather(false);
		} else if (previousGatherDeckPhase != null) {
			setSuppressFaceDownEnterAfterGather(true);
		}

		prevGatherDeckPhaseRef.current = gatherDeckPhase;
	}, [gatherDeckPhase, isRevealed]);

	const [gatherFlipFaceUp, setGatherFlipFaceUp] = useState(true);

	useEffect(() => {
		if (!gathering) {
			return;
		}

		if (gatherDeckPhase !== GatherDeckPhase.FLIP || reduced) {
			setGatherFlipFaceUp(true);

			return;
		}

		setGatherFlipFaceUp(true);
		const frameId = requestAnimationFrame(() => {
			setGatherFlipFaceUp(false);
		});

		return () => {
			cancelAnimationFrame(frameId);
		};
	}, [gatherDeckPhase, gathering, reduced]);

	const effectiveIsRevealed = gathering
		? gatherDeckPhase === GatherDeckPhase.FLIP && gatherFlipFaceUp
		: isRevealed;

	const effectiveShowFrontWhileConcealed = gathering
		? gatherDeckPhase === GatherDeckPhase.FLIP && gatherFlipFaceUp && showFrontFaceWhileConcealed
		: showFrontFaceWhileConcealed;

	const frontFaceRotationDegrees = effectiveIsRevealed || effectiveShowFrontWhileConcealed ? 180 : 0;

	const [frontFaceValue, setFrontFaceValue] = useState(revealedValue);
	const [faceDownPlaneMountKey, setFaceDownPlaneMountKey] = useState(0);
	const flipRootRef = useRef<HTMLDivElement>(null);
	const previousTableSlotSuppressedRef = useRef(tableSlotSuppressedForFlight);

	useEffect(() => {
		const suppressed = tableSlotSuppressedForFlight;
		const wasSuppressed = previousTableSlotSuppressedRef.current;

		previousTableSlotSuppressedRef.current = suppressed;

		if (wasSuppressed && !suppressed) {
			setFaceDownPlaneMountKey((previousKey) => previousKey + 1);
		}
	}, [tableSlotSuppressedForFlight]);

	useEffect(() => {
		if (effectiveIsRevealed || effectiveShowFrontWhileConcealed) {
			setFrontFaceValue(revealedValue);
		}
	}, [effectiveIsRevealed, effectiveShowFrontWhileConcealed, revealedValue]);

	const handleFlipAnimationComplete = useCallback(() => {
		if (!effectiveIsRevealed && !effectiveShowFrontWhileConcealed) {
			setFrontFaceValue(revealedValue);
		}
	}, [effectiveIsRevealed, effectiveShowFrontWhileConcealed, revealedValue]);

	useCard3DRotateY(flipRootRef, frontFaceRotationDegrees, {
		reducedMotion: reduced,
		onSettled: handleFlipAnimationComplete,
	});

	let faceDownMotionClassName = 'animate-table-face-down-in';

	if (isExiting) {
		faceDownMotionClassName = 'animate-table-face-down-out';
	} else if (gathering || suppressFaceDownEnterAfterGather) {
		faceDownMotionClassName = '';
	}

	return (
		<div className="w-full perspective-distant">
			<div
				ref={flipRootRef}
				className="relative aspect-5/7 w-full"
				style={{ transformStyle: 'preserve-3d' }}
			>
				<div
					key={faceDownPlaneMountKey}
					className="absolute inset-0"
					style={{ ...facePlaneStyle, transform: 'rotateY(0deg)' }}
				>
					<FaceDownCard
						className={
							mergeTailwindClasses(
								'aspect-auto h-full min-h-0 w-full max-w-none sm:w-full',
								faceDownMotionClassName
							)
						}
					/>
				</div>
				<div
					className="absolute inset-0"
					style={{ ...facePlaneStyle, transform: 'rotateY(180deg)' }}
				>
					<VotingCard
						value={frontFaceValue}
						isSelected={frontFaceSelected}
						disabled
						tabIndex={-1}
						className="h-full w-full shadow-md"
					/>
				</div>
			</div>
		</div>
	);
});

FlippableFaceDownVoteCard.displayName = 'FlippableFaceDownVoteCard';
