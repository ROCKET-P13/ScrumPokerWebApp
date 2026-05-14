import _ from 'lodash';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { GatherDeckPhase } from '@/Common/GatherDeckPhase';
import { useAnimeOpacity, useFlipColumnLayout, usePrefersReducedMotion } from '@/hooks/animations';
import { useVoteArrivalStore, voteArrivalStore } from '@/stores/voteArrivalStore';
import { Participant } from '@/types/Participant';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';
import {
	participantsEveryVoteSignalCleared,
	participantsHasVotedFlagMap,
	participantsSomeHaveVoteSignal
} from '@/utils/participantVoteSignals';
import { sortParticipantsByVoteArrival } from '@/utils/sortParticipantsByVoteArrival';
import {
	TABLE_CARD_FLIP_DURATION_MS,
	TABLE_DECK_FADE_DURATION_MS,
	TABLE_DECK_STACK_DURATION_MS,
	VOTE_CARD_FLIGHT_DURATION_MS
} from '@/utils/voteFlightGeometry';

import { PeerVoteCard } from './PeerVoteCard';
import { SelfVoteCard } from './SelfVoteCard';
import { GatherDeckAnimatedColumn, GATHER_DECK_COLUMN_PITCH_PX } from './TableDeckGatherOverlay';

export interface VotingTableProps {
	selfDisplayName: string;
	participants: Participant[];
	isRevealed: boolean;
	selfVoteDisplay: string;
	hideSelfTableCard: boolean;
	hideSelfTableParticipantLabel?: boolean;
	selfSlotRef: React.RefObject<HTMLDivElement | null>;
	selfCardRef: React.RefObject<HTMLDivElement | null>;
	className?: string;
}

type GatherDeckState = {
	phase: GatherDeckPhase;
};

export const VotingTable = memo((
	{
		selfDisplayName,
		participants = [],
		isRevealed,
		selfVoteDisplay,
		hideSelfTableCard,
		hideSelfTableParticipantLabel = false,
		selfSlotRef,
		selfCardRef,
		className = '',
	}: VotingTableProps
) => {
	const prefersReducedMotion = usePrefersReducedMotion();
	const tableColumnsContainerRef = useRef<HTMLDivElement>(null);
	const selfParticipantLabelRef = useRef<HTMLSpanElement>(null);

	const otherParticipants = useMemo(
		() => _.filter(
			participants,
			(participant) => participant.displayName !== selfDisplayName
		),
		[participants, selfDisplayName]
	);

	const prevOthersHasVotedRef = useRef<Map<string, boolean>>(new Map());
	const exitTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	const skipParticipantTransitionEffectRef = useRef(true);
	const [exitingVoteNames, setExitingVoteNames] = useState(() => new Set<string>());
	const voteSnapEndPrevCommitRef = useRef<Map<string, boolean>>(new Map());
	const revealedRoundParticipantsRef = useRef<Participant[]>([]);
	const prevIsRevealedRef = useRef(isRevealed);
	const [gatherDeck, setGatherDeck] = useState<GatherDeckState | null>(null);
	const prevGatherDeckRef = useRef<GatherDeckState | null>(null);

	useLayoutEffect(() => {
		const wasGatherDeck = prevGatherDeckRef.current;

		prevGatherDeckRef.current = gatherDeck;

		if (wasGatherDeck != null && gatherDeck == null) {
			voteArrivalStore.getState().endGatherDeck();
		}
	}, [gatherDeck]);

	const hasAnyOtherParticipantVoted = otherParticipants.some((participant) => participant.hasVoted);

	useEffect(() => {
		const pendingExitTimeouts = exitTimeoutsRef.current;

		return () => {
			for (const exitTimeoutId of pendingExitTimeouts.values()) {
				clearTimeout(exitTimeoutId);
			}

			pendingExitTimeouts.clear();
		};
	}, []);

	useEffect(() => {
		if (skipParticipantTransitionEffectRef.current) {
			skipParticipantTransitionEffectRef.current = false;
			prevOthersHasVotedRef.current = participantsHasVotedFlagMap(otherParticipants);

			return;
		}

		for (const otherParticipant of otherParticipants) {
			const hadVotedPreviously = prevOthersHasVotedRef.current.get(otherParticipant.displayName) ?? false;
			const hasVotedNow = otherParticipant.hasVoted;

			if (hadVotedPreviously && !hasVotedNow) {
				setExitingVoteNames((previousExitingVoteDisplayNames) => {
					const nextExitingVoteDisplayNames = new Set(previousExitingVoteDisplayNames);

					nextExitingVoteDisplayNames.add(otherParticipant.displayName);

					return nextExitingVoteDisplayNames;
				});

				const existingExitTimeoutId = exitTimeoutsRef.current.get(otherParticipant.displayName);

				if (existingExitTimeoutId) {
					clearTimeout(existingExitTimeoutId);
				}

				const faceDownExitAnimationTimeoutId = setTimeout(() => {
					setExitingVoteNames((previousExitingVoteDisplayNames) => {
						const nextExitingVoteDisplayNames = new Set(previousExitingVoteDisplayNames);

						nextExitingVoteDisplayNames.delete(otherParticipant.displayName);

						return nextExitingVoteDisplayNames;
					});
					voteArrivalStore.getState().removeVoteArrival(otherParticipant.displayName);
					exitTimeoutsRef.current.delete(otherParticipant.displayName);
				}, VOTE_CARD_FLIGHT_DURATION_MS);

				exitTimeoutsRef.current.set(otherParticipant.displayName, faceDownExitAnimationTimeoutId);
			}

			if (!hadVotedPreviously && hasVotedNow) {
				const pendingExitTimeoutId = exitTimeoutsRef.current.get(otherParticipant.displayName);

				if (pendingExitTimeoutId) {
					clearTimeout(pendingExitTimeoutId);
					exitTimeoutsRef.current.delete(otherParticipant.displayName);
				}

				setExitingVoteNames((previousExitingVoteDisplayNames) => {
					if (!previousExitingVoteDisplayNames.has(otherParticipant.displayName)) {
						return previousExitingVoteDisplayNames;
					}

					const nextExitingVoteDisplayNames = new Set(previousExitingVoteDisplayNames);

					nextExitingVoteDisplayNames.delete(otherParticipant.displayName);

					return nextExitingVoteDisplayNames;
				});
			}
		}

		prevOthersHasVotedRef.current = participantsHasVotedFlagMap(otherParticipants);
	}, [otherParticipants]);

	const exitingForLayout = useMemo(() => {
		const mergedExitingParticipantDisplayNames = new Set(exitingVoteNames);

		for (const otherParticipant of otherParticipants) {
			const hadVotedAtPreviousLayoutCommit
				= voteSnapEndPrevCommitRef.current.get(otherParticipant.displayName) ?? false;

			if (hadVotedAtPreviousLayoutCommit && !otherParticipant.hasVoted) {
				mergedExitingParticipantDisplayNames.add(otherParticipant.displayName);
			}
		}

		for (const exitingCandidateDisplayName of Array.from(mergedExitingParticipantDisplayNames)) {
			const matchingOtherParticipant = _.find(
				otherParticipants,
				(participant) => participant.displayName === exitingCandidateDisplayName
			);

			if (matchingOtherParticipant?.hasVoted) {
				mergedExitingParticipantDisplayNames.delete(exitingCandidateDisplayName);
			}
		}

		return mergedExitingParticipantDisplayNames;
	}, [otherParticipants, exitingVoteNames]);

	const selfHasVisibleTableActivity = Boolean(selfVoteDisplay !== '' || hideSelfTableCard);

	const orderByDisplayNameRecord = useVoteArrivalStore((state) => state.orderByDisplayName);
	const gatherSnapshotParticipants = useVoteArrivalStore((state) => state.gatherSnapshotParticipants);
	const gatherFrozenVoteOrderByDisplayName = useVoteArrivalStore(
		(state) => state.gatherFrozenVoteOrderByDisplayName
	);

	const voteArrivalOrderByDisplayName = useMemo(
		() => new Map(Object.entries(orderByDisplayNameRecord)),
		[orderByDisplayNameRecord]
	);

	useLayoutEffect(() => {
		voteArrivalStore.getState().syncTableTick({
			participantsList: participants,
			selfDisplayName,
			selfVoteDisplay,
			isRevealed,
			hideSelfTableCard,
			gatherDeckIsNull: gatherDeck === null,
			exitingForLayout,
			hasAnyOtherParticipantVoted,
		});
	}, [
		participants,
		selfDisplayName,
		selfVoteDisplay,
		isRevealed,
		hideSelfTableCard,
		gatherDeck,
		exitingForLayout,
		hasAnyOtherParticipantVoted,
	]);

	const participantDisplayNamesShownOnTable = useMemo(() => {
		if (gatherDeck != null && gatherSnapshotParticipants != null) {
			const names = new Set<string>();

			for (const snapshotParticipant of gatherSnapshotParticipants) {
				if (snapshotParticipant.hasVoted) {
					names.add(snapshotParticipant.displayName);
				}
			}

			for (const exitingParticipantDisplayName of exitingForLayout) {
				names.add(exitingParticipantDisplayName);
			}

			const selfInSnapshot = gatherSnapshotParticipants.find(
				(participant) => participant.displayName === selfDisplayName
			);
			const selfHadTableActivityInSnapshot = Boolean(
				selfInSnapshot?.hasVoted || (selfInSnapshot?.vote && selfInSnapshot.vote !== '')
			);

			if (!isRevealed && selfHadTableActivityInSnapshot) {
				names.add(selfDisplayName);
			}

			return names;
		}

		const names = new Set<string>();

		for (const otherParticipant of otherParticipants) {
			if (otherParticipant.hasVoted) {
				names.add(otherParticipant.displayName);
			}
		}

		for (const exitingParticipantDisplayName of exitingForLayout) {
			names.add(exitingParticipantDisplayName);
		}

		if (!isRevealed && selfHasVisibleTableActivity) {
			names.add(selfDisplayName);
		}

		return names;
	}, [
		gatherDeck,
		gatherSnapshotParticipants,
		otherParticipants,
		exitingForLayout,
		isRevealed,
		selfHasVisibleTableActivity,
		selfDisplayName,
	]);

	const tableRowParticipantsReveal = sortParticipantsByVoteArrival(
		participants,
		voteArrivalOrderByDisplayName
	);

	const sortedForTable = useMemo(() => {
		if (
			gatherDeck != null
			&& gatherSnapshotParticipants != null
			&& gatherSnapshotParticipants.length > 0
		) {
			return sortParticipantsByVoteArrival(
				gatherSnapshotParticipants,
				new Map(Object.entries(gatherFrozenVoteOrderByDisplayName ?? {}))
			);
		}

		return tableRowParticipantsReveal;
	}, [
		gatherDeck,
		gatherSnapshotParticipants,
		gatherFrozenVoteOrderByDisplayName,
		tableRowParticipantsReveal,
	]);

	const gatherColumnLayoutMeta = useMemo(() => {
		if (gatherDeck == null) {
			return null;
		}

		const visibleNames: string[] = [];

		for (const participant of sortedForTable) {
			if (!isRevealed && !participantDisplayNamesShownOnTable.has(participant.displayName)) {
				continue;
			}

			visibleNames.push(participant.displayName);
		}

		const n = visibleNames.length;
		const middle = n > 0 ? (n - 1) / 2 : 0;
		const indexByName = new Map(visibleNames.map((name, index) => [name, index]));

		return { n, middle, indexByName };
	}, [gatherDeck, sortedForTable, isRevealed, participantDisplayNamesShownOnTable]);

	const tableColumnLayoutEpoch = useMemo(
		() => JSON.stringify({
			participantOrderKeys: sortedForTable.map((participant) => participant.displayName),
			shownKeysSorted: [...participantDisplayNamesShownOnTable].sort(),
			isRevealed,
			exitingKeysSorted: [...exitingForLayout].sort(),
		}),
		[
			sortedForTable,
			participantDisplayNamesShownOnTable,
			isRevealed,
			exitingForLayout,
		]
	);

	/** First paint after admin reset: `gatherDeck` is still null but layout epoch already flipped — without this, FLIP column tweens run and cards jump before gather. */
	const resetRevealedToClearedConcealedEdge = prefersReducedMotion !== true
		&& prevIsRevealedRef.current === true
		&& isRevealed === false
		&& participantsEveryVoteSignalCleared(participants)
		&& participantsSomeHaveVoteSignal(revealedRoundParticipantsRef.current);

	const suspendFlipTransformForGather = gatherDeck != null
		|| gatherSnapshotParticipants != null
		|| resetRevealedToClearedConcealedEdge;

	/** Prevents `FlippableFaceDownVoteCard` from flipping to face-down before `gatherDeckPhase` is `FLIP` (one-frame `isRevealed` false + `gatherPhase` null). */
	const tableFlipIsRevealedForCard = isRevealed
		|| resetRevealedToClearedConcealedEdge
		|| (gatherSnapshotParticipants != null && gatherDeck == null);

	useFlipColumnLayout(tableColumnsContainerRef, {
		layoutEpoch: tableColumnLayoutEpoch,
		reducedMotion: prefersReducedMotion === true,
		hideSelfTableCardDuringFlight: hideSelfTableCard,
		suspendFlipTransform: suspendFlipTransformForGather,
	});

	useAnimeOpacity(selfParticipantLabelRef, hideSelfTableParticipantLabel ? 0 : 1, {
		reducedMotion: prefersReducedMotion === true,
	});

	useLayoutEffect(() => {
		voteSnapEndPrevCommitRef.current = participantsHasVotedFlagMap(otherParticipants);
	}, [otherParticipants]);

	useEffect(() => {
		if (!isRevealed) {
			return;
		}

		if (participantsSomeHaveVoteSignal(participants)) {
			revealedRoundParticipantsRef.current = _.cloneDeep(participants);
		}
	}, [isRevealed, participants]);

	useLayoutEffect(() => {
		const snapshotWhenRevealedWithVotes = revealedRoundParticipantsRef.current;
		const previousIsRevealed = prevIsRevealedRef.current;

		const votesExistedPreviously = participantsSomeHaveVoteSignal(snapshotWhenRevealedWithVotes);
		const allVotesClearedNow = participantsEveryVoteSignalCleared(participants);

		const resetFromRevealedRound = previousIsRevealed === true
			&& isRevealed === false
			&& votesExistedPreviously
			&& allVotesClearedNow;

		if (resetFromRevealedRound && gatherDeck === null && !prefersReducedMotion) {
			voteArrivalStore.getState().beginGatherDeck(_.cloneDeep(snapshotWhenRevealedWithVotes));
			setGatherDeck({ phase: GatherDeckPhase.FLIP });
		}

		prevIsRevealedRef.current = isRevealed;
	}, [participants, isRevealed, gatherDeck, prefersReducedMotion]);

	useEffect(() => {
		if (!gatherDeck || prefersReducedMotion) {
			return;
		}

		const { phase } = gatherDeck;

		const advanceAfter = (durationMs: number, advance: () => void) => {
			const timerId = window.setTimeout(advance, durationMs);

			return () => window.clearTimeout(timerId);
		};

		if (phase === GatherDeckPhase.FLIP) {
			return advanceAfter(TABLE_CARD_FLIP_DURATION_MS, () => {
				setGatherDeck((previous) => (previous ? { ...previous, phase: GatherDeckPhase.STACK } : null));
			});
		}

		if (phase === GatherDeckPhase.STACK) {
			return advanceAfter(TABLE_DECK_STACK_DURATION_MS, () => {
				setGatherDeck((previous) => (previous ? { ...previous, phase: GatherDeckPhase.FADE } : null));
			});
		}

		return advanceAfter(TABLE_DECK_FADE_DURATION_MS, () => {
			setGatherDeck(null);
		});
	}, [gatherDeck, prefersReducedMotion]);

	const gatherPhase = gatherDeck?.phase ?? null;
	const reducedMotionGather = prefersReducedMotion === true;

	return (
		<div
			className={
				mergeTailwindClasses(
					'rounded-xl border border-border/80 bg-muted/20 px-4 py-6',
					className
				)
			}
		>
			<p className="mb-4 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
				Table
			</p>
			<div className="relative">
				<div
					ref={tableColumnsContainerRef}
					className="flex min-h-48 flex-wrap items-end justify-center gap-4 sm:min-h-52 sm:gap-5"
				>
					{
						sortedForTable.map((participant) => {
							const isSelf = participant.displayName === selfDisplayName;

							if (!isRevealed && !participantDisplayNamesShownOnTable.has(participant.displayName)) {
								return null;
							}

							const revealedValue = participant.vote && participant.vote !== ''
								? participant.vote
								: '—';

							const hadTablePresence = participant.hasVoted
								|| exitingForLayout.has(participant.displayName);

							const isExiting = exitingForLayout.has(participant.displayName)
								&& !participant.hasVoted;

							const gatherIndex = gatherColumnLayoutMeta?.indexByName.get(participant.displayName);

							const wrapColumn = (inner: ReactNode) => (
								<GatherDeckAnimatedColumn
									key={participant.displayName}
									phase={gatherPhase}
									reduced={reducedMotionGather}
									zIndex={gatherDeck != null ? 10 + (gatherIndex ?? 0) : undefined}
									towardCenterPx={
										gatherDeck != null && gatherColumnLayoutMeta != null && gatherIndex != null
											? (gatherColumnLayoutMeta.middle - gatherIndex) * GATHER_DECK_COLUMN_PITCH_PX
											: 0
									}
									tableFlipColumnKey={participant.displayName}
								>
									{inner}
								</GatherDeckAnimatedColumn>
							);

							if (isRevealed && !hadTablePresence) {
								const selfCardWrapperClassName = mergeTailwindClasses(
									'w-full',
									hideSelfTableCard ? 'pointer-events-none opacity-0' : ''
								);

								return wrapColumn(
									<>
										<div className="flex min-h-42 w-24 items-end justify-center sm:min-h-46 sm:w-28">
											{
												isSelf
													? (
														<SelfVoteCard
															mode="table-revealed-static"
															revealedValue={revealedValue}
															slotRef={selfSlotRef}
															cardRef={selfCardRef}
															wrapperClassName={selfCardWrapperClassName}
														/>
													)
													: (
														<PeerVoteCard
															mode="table-revealed-static"
															revealedValue={revealedValue}
														/>
													)
											}
										</div>
										<span className="max-w-28 truncate text-center text-xs text-muted-foreground">
											{participant.displayName}
										</span>
									</>
								);
							}

							const flipRevealedValue = isSelf && selfVoteDisplay !== ''
								? selfVoteDisplay
								: revealedValue;

							const selfFlipCardWrapperClassName = mergeTailwindClasses(
								'w-full',
								hideSelfTableCard ? 'pointer-events-none opacity-0' : ''
							);

							return wrapColumn(
								<>
									<div className="flex min-h-42 w-24 items-end justify-center sm:min-h-46 sm:w-28">
										{
											isSelf
												? (
													<SelfVoteCard
														mode="table-flip"
														isRevealed={tableFlipIsRevealedForCard}
														revealedValue={flipRevealedValue}
														isExiting={isExiting}
														prefersReducedMotion={prefersReducedMotion}
														selfVoteDisplay={selfVoteDisplay}
														hideSelfTableCard={hideSelfTableCard}
														slotRef={selfSlotRef}
														cardRef={selfCardRef}
														wrapperClassName={selfFlipCardWrapperClassName}
														gatherDeckPhase={gatherPhase}
													/>
												)
												: (
													<PeerVoteCard
														mode="table-flip"
														isRevealed={tableFlipIsRevealedForCard}
														revealedValue={flipRevealedValue}
														isExiting={isExiting}
														prefersReducedMotion={prefersReducedMotion}
														gatherDeckPhase={gatherPhase}
													/>
												)
										}
									</div>
									{
										isSelf
											? (
												<span
													ref={selfParticipantLabelRef}
													className={
														mergeTailwindClasses(
															'max-w-28 truncate text-center text-xs text-muted-foreground',
															selfVoteDisplay === '' ? 'invisible' : ''
														)
													}
													aria-hidden={hideSelfTableParticipantLabel}
												>
													{selfDisplayName}
												</span>
											)
											: (
												<span className="max-w-28 truncate text-center text-xs text-muted-foreground">
													{participant.displayName}
												</span>
											)
									}
								</>
							);
						})
					}
				</div>
			</div>
		</div>
	);
});

VotingTable.displayName = 'VotingTable';
