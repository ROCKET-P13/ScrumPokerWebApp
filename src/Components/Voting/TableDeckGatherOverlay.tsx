import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { GatherDeckPhase } from '@/Common/GatherDeckPhase';
import { useTranslateOpacityScale, voteCardMotionEase } from '@/hooks/animations';
import { useVoteArrivalStore } from '@/stores/voteArrivalStore';
import type { Participant } from '@/types/Participant';
import { sortParticipantsByVoteArrival } from '@/utils/sortParticipantsByVoteArrival';
import { TABLE_DECK_FADE_DURATION_MS, TABLE_DECK_STACK_DURATION_MS } from '@/utils/voteFlightGeometry';

import { FlippableFaceDownVoteCard } from './FlippableFaceDownVoteCard';

/** Stable fallback so `?? []` does not allocate a new array every render when snapshot is null. */
const EMPTY_GATHER_SNAPSHOT_PARTICIPANTS: Participant[] = [];

/** Approximate column pitch (card width + gap) for centering the stack */
const CARD_STACK_PITCH_PX = 124;

function GatherFlippableCard ({
	revealedValue,
	phase,
	prefersReducedMotion,
	frontFaceSelected,
	showOwnVoteFaceUpWhileFlip,
	isExiting,
}: {
	revealedValue: string;
	phase: GatherDeckPhase;
	prefersReducedMotion: boolean | null;
	frontFaceSelected: boolean;
	showOwnVoteFaceUpWhileFlip: boolean;
	isExiting: boolean;
}) {
	const [faceUp, setFaceUp] = useState(() => !(prefersReducedMotion ?? false));

	useEffect(() => {
		if ((prefersReducedMotion ?? false) || phase !== GatherDeckPhase.FLIP) {
			return;
		}

		const frameId = requestAnimationFrame(() => {
			setFaceUp(false);
		});

		return () => {
			cancelAnimationFrame(frameId);
		};
	}, [phase, prefersReducedMotion]);

	const isRevealedOnCard = phase === GatherDeckPhase.FLIP ? faceUp : false;

	const showFrontFaceWhileConcealed = showOwnVoteFaceUpWhileFlip && phase === GatherDeckPhase.FLIP && faceUp;

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

/** Stack / fade column motion duration (ms) for gather overlay. */
function gatherDeckColumnMotionDurationMs (phase: GatherDeckPhase, reduced: boolean): number {
	if (reduced) {
		return 0;
	}

	if (phase === GatherDeckPhase.FLIP) {
		return 0;
	}

	if (phase === GatherDeckPhase.STACK) {
		return TABLE_DECK_STACK_DURATION_MS;
	}

	return TABLE_DECK_FADE_DURATION_MS;
}

const GatherDeckAnimatedColumn = memo(function GatherDeckAnimatedColumn ({
	phase,
	reduced,
	zIndex,
	towardCenterPx,
	stackLiftPx,
	children,
}: {
	phase: GatherDeckPhase;
	reduced: boolean;
	zIndex: number;
	towardCenterPx: number;
	stackLiftPx: number;
	children: ReactNode;
}) {
	const columnRootRef = useRef<HTMLDivElement>(null);

	const motionTarget = useMemo(() => {
		const stackActive = phase !== GatherDeckPhase.FLIP;

		return {
			x: stackActive ? towardCenterPx : 0,
			y: stackActive ? stackLiftPx : 0,
			opacity: phase === GatherDeckPhase.FADE ? 0 : 1,
			scale: phase === GatherDeckPhase.FADE ? 0.88 : 1,
		};
	}, [phase, towardCenterPx, stackLiftPx]);

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
			style={{ zIndex }}
		>
			{children}
		</div>
	);
});

export const TableDeckGatherOverlay = memo(function TableDeckGatherOverlay ({
	phase,
	selfDisplayName,
	prefersReducedMotion,
}: {
	phase: GatherDeckPhase;
	selfDisplayName: string;
	prefersReducedMotion: boolean | null;
}) {
	const snapshotParticipants = useVoteArrivalStore((state) => state.gatherSnapshotParticipants)
		?? EMPTY_GATHER_SNAPSHOT_PARTICIPANTS;
	const voteOrderRecord = useVoteArrivalStore((state) => state.gatherFrozenVoteOrderByDisplayName);
	const voteOrderByDisplayName = new Map(Object.entries(voteOrderRecord ?? {}));

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

					return (
						<GatherDeckAnimatedColumn
							key={participant.displayName}
							phase={phase}
							reduced={reduced}
							zIndex={10 + columnIndex}
							towardCenterPx={towardCenterPx}
							stackLiftPx={stackLiftPx}
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
						</GatherDeckAnimatedColumn>
					);
				})
			}
		</div>
	);
});
