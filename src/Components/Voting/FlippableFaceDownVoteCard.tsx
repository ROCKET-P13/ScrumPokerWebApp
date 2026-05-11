import { memo, type CSSProperties, useEffect, useRef, useState } from 'react';

import { useCard3DRotateY } from '@/hooks/animations';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

import { FaceDownCard } from './FaceDownCard';
import { VotingCard } from './VotingCard';

const facePlaneStyle: CSSProperties = {
	backfaceVisibility: 'hidden',
	WebkitBackfaceVisibility: 'hidden',
};

export const FlippableFaceDownVoteCard = memo(function FlippableFaceDownVoteCard ({
	isRevealed,
	revealedValue,
	isExiting,
	prefersReducedMotion,
	frontFaceSelected = false,
	showFrontFaceWhileConcealed = false,
	tableSlotSuppressedForFlight = false,
}: {
	isRevealed: boolean;
	revealedValue: string;
	isExiting: boolean;
	prefersReducedMotion: boolean | null;
	frontFaceSelected?: boolean;
	/** Your own vote: keep the value face-up while the round is still concealed. */
	showFrontFaceWhileConcealed?: boolean;
	/** While true, the table slot is hidden during the hand→table flight; used to replay face-down entrance when shown again. */
	tableSlotSuppressedForFlight?: boolean;
}) {
	const reduced = Boolean(prefersReducedMotion);

	const frontFaceRotationDegrees = isRevealed || showFrontFaceWhileConcealed ? 180 : 0;

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
		if (isRevealed || showFrontFaceWhileConcealed) {
			setFrontFaceValue(revealedValue);
		}
	}, [isRevealed, revealedValue, showFrontFaceWhileConcealed]);

	const handleFlipAnimationComplete = () => {
		if (!isRevealed && !showFrontFaceWhileConcealed) {
			setFrontFaceValue(revealedValue);
		}
	};

	useCard3DRotateY(flipRootRef, frontFaceRotationDegrees, {
		reducedMotion: reduced,
		onSettled: handleFlipAnimationComplete,
	});

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
								isExiting
									? 'animate-table-face-down-out'
									: 'animate-table-face-down-in'
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
