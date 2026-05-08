import { motion } from 'framer-motion';
import { memo, useEffect, useState } from 'react';

import { Participant } from '@/types/Participant';
import { TABLE_DECK_FADE_DURATION_MS, TABLE_DECK_STACK_DURATION_MS } from '@/utils/voteFlightGeometry';

import { FlippableFaceDownVoteCard } from './FlippableFaceDownVoteCard';
import { sortParticipantsByVoteArrival } from './sortParticipantsByVoteArrival';

/** Approximate column pitch (card width + gap) for centering the stack */
const CARD_STACK_PITCH_PX = 124;

const STACK_EASE = [0.22, 1, 0.36, 1] as const;

function GatherFlippableCard ({
	revealedValue,
	phase,
	prefersReducedMotion,
	frontFaceSelected,
	showOwnVoteFaceUpWhileFlip,
	isExiting,
}: {
	revealedValue: string;
	phase: 'flip' | 'stack' | 'fade';
	prefersReducedMotion: boolean | null;
	frontFaceSelected: boolean;
	showOwnVoteFaceUpWhileFlip: boolean;
	isExiting: boolean;
}) {
	const [faceUp, setFaceUp] = useState(() => !(prefersReducedMotion ?? false));

	useEffect(() => {
		if ((prefersReducedMotion ?? false) || phase !== 'flip') {
			return;
		}

		const frameId = requestAnimationFrame(() => {
			setFaceUp(false);
		});

		return () => {
			cancelAnimationFrame(frameId);
		};
	}, [phase, prefersReducedMotion]);

	const isRevealedOnCard = phase === 'flip' ? faceUp : false;

	const showFrontFaceWhileConcealed = showOwnVoteFaceUpWhileFlip && phase === 'flip' && faceUp;

	return (
		<FlippableFaceDownVoteCard
			isRevealed={isRevealedOnCard}
			revealedValue={revealedValue}
			isExiting={isExiting}
			prefersReducedMotion={prefersReducedMotion}
			frontFaceSelected={frontFaceSelected}
			showFrontFaceWhileConcealed={showFrontFaceWhileConcealed}
		/>
	);
}

export const TableDeckGatherOverlay = memo(function TableDeckGatherOverlay ({
	snapshotParticipants,
	voteOrderByDisplayName,
	phase,
	selfDisplayName,
	prefersReducedMotion,
}: {
	snapshotParticipants: Participant[];
	voteOrderByDisplayName: ReadonlyMap<string, number>;
	phase: 'flip' | 'stack' | 'fade';
	selfDisplayName: string;
	prefersReducedMotion: boolean | null;
}) {
	const sorted = sortParticipantsByVoteArrival(snapshotParticipants, voteOrderByDisplayName);
	const reduced = Boolean(prefersReducedMotion);

	const midpointIndex = sorted.length > 0 ? (sorted.length - 1) / 2 : 0;

	return (
		<div
			className="pointer-events-none absolute inset-0 flex min-h-48 flex-wrap items-end justify-center gap-4 sm:min-h-52 sm:gap-5"
			aria-hidden
		>
			{
				sorted.map((participant, columnIndex) => {
					const revealedValue = participant.vote && participant.vote !== ''
						? participant.vote
						: '—';

					const isSelf = participant.displayName === selfDisplayName;
					const hadVote = Boolean(participant.vote && participant.vote !== '');
					const towardCenterPx = (midpointIndex - columnIndex) * CARD_STACK_PITCH_PX;
					const stackLiftPx = columnIndex * 4;

					let layoutTransitionSeconds = 0;

					if (!reduced) {
						if (phase === 'flip') {
							layoutTransitionSeconds = 0;
						} else if (phase === 'stack') {
							layoutTransitionSeconds = TABLE_DECK_STACK_DURATION_MS / 1000;
						} else {
							layoutTransitionSeconds = TABLE_DECK_FADE_DURATION_MS / 1000;
						}
					}

					const motionReducedTarget = {
						x: 0,
						y: 0,
						opacity: phase === 'fade' ? 0 : 1,
						scale: phase === 'fade' ? 0.88 : 1,
					};

					const motionFullTarget = {
						x: phase === 'flip' ? 0 : towardCenterPx,
						y: phase === 'flip' ? 0 : stackLiftPx,
						opacity: phase === 'fade' ? 0 : 1,
						scale: phase === 'fade' ? 0.88 : 1,
					};

					return (
						<motion.div
							key={participant.displayName}
							className="relative flex flex-col items-center gap-2"
							style={{ zIndex: 10 + columnIndex }}
							initial={false}
							animate={reduced ? motionReducedTarget : motionFullTarget}
							transition={{
								duration: layoutTransitionSeconds,
								ease: STACK_EASE,
							}}
						>
							<div className="flex min-h-42 w-24 items-end justify-center sm:min-h-46 sm:w-28">
								<div className="w-full">
									<GatherFlippableCard
										revealedValue={revealedValue}
										phase={phase}
										prefersReducedMotion={prefersReducedMotion}
										frontFaceSelected={isSelf && hadVote}
										showOwnVoteFaceUpWhileFlip={isSelf && hadVote}
										isExiting={false}
									/>
								</div>
							</div>
						</motion.div>
					);
				})
			}
		</div>
	);
});
