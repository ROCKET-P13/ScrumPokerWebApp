import { motion } from 'framer-motion';
import { memo, type CSSProperties, useEffect, useState } from 'react';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';
import { TABLE_CARD_FLIP_DURATION_MS } from '@/utils/voteFlightGeometry';

import { FaceDownCard } from './FaceDownCard';
import { VotingCard } from './VotingCard';

const FLIP_DURATION_SEC = TABLE_CARD_FLIP_DURATION_MS / 1000;
const FLIP_EASE = [0.33, 1, 0.36, 1] as const;

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
}: {
	isRevealed: boolean;
	revealedValue: string;
	isExiting: boolean;
	prefersReducedMotion: boolean | null;
	frontFaceSelected?: boolean;
	/** Your own vote: keep the value face-up while the round is still concealed. */
	showFrontFaceWhileConcealed?: boolean;
}) {
	const reduced = Boolean(prefersReducedMotion);

	const frontFaceRotationDegrees = isRevealed || showFrontFaceWhileConcealed ? 180 : 0;

	const [frontFaceValue, setFrontFaceValue] = useState(revealedValue);

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

	return (
		<div className="w-full perspective-distant">
			<motion.div
				className="relative aspect-5/7 w-full"
				style={{ transformStyle: 'preserve-3d' }}
				initial={false}
				animate={{ rotateY: frontFaceRotationDegrees }}
				transition={
					reduced
						? { duration: 0 }
						: { duration: FLIP_DURATION_SEC, ease: [...FLIP_EASE] }
				}
				onAnimationComplete={handleFlipAnimationComplete}
			>
				<div
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
			</motion.div>
		</div>
	);
});
