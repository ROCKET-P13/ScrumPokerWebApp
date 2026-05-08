import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import _ from 'lodash';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { voteArrivalStore } from '@/stores/voteArrivalStore';
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
	TABLE_COLUMN_LAYOUT_TRANSITION,
	TABLE_DECK_FADE_DURATION_MS,
	TABLE_DECK_STACK_DURATION_MS,
	VOTE_CARD_FLIGHT_DURATION_MS
} from '@/utils/voteFlightGeometry';

import { FlippableFaceDownVoteCard } from './FlippableFaceDownVoteCard';
import { TableDeckGatherOverlay } from './TableDeckGatherOverlay';
import { VotingCard } from './VotingCard';

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
	phase: 'flip' | 'stack' | 'fade';
};

export const VotingTable = memo(function VotingTable (
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
) {
	const prefersReducedMotion = useReducedMotion();

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

	const voteArrivalOrderByDisplayName = new Map(
		Object.entries(voteArrivalStore.getState().orderByDisplayName)
	);

	const participantDisplayNamesShownOnTable = useMemo(() => {
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

	useEffect(() => {
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
			setGatherDeck({ phase: 'flip' });
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

		if (phase === 'flip') {
			return advanceAfter(TABLE_CARD_FLIP_DURATION_MS, () => {
				setGatherDeck((previous) => (previous ? { ...previous, phase: 'stack' } : null));
			});
		}

		if (phase === 'stack') {
			return advanceAfter(TABLE_DECK_STACK_DURATION_MS, () => {
				setGatherDeck((previous) => (previous ? { ...previous, phase: 'fade' } : null));
			});
		}

		return advanceAfter(TABLE_DECK_FADE_DURATION_MS, () => {
			voteArrivalStore.getState().endGatherDeck();
			setGatherDeck(null);
		});
	}, [gatherDeck, prefersReducedMotion]);

	return (
		<div
			className={
				mergeTailwindClasses(
					`rounded-xl border border-border/80 bg-muted/20 px-4 py-6 backdrop-blur-xs`,
					className
				)
			}
		>
			<p className="mb-4 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
				Table
			</p>
			<div className="relative">
				{
					gatherDeck
						? (
							<div className="relative min-h-48 sm:min-h-52">
								<TableDeckGatherOverlay
									phase={gatherDeck.phase}
									selfDisplayName={selfDisplayName}
									prefersReducedMotion={prefersReducedMotion}
								/>
							</div>
						)
						: (
							<LayoutGroup>
								<div className="flex min-h-48 flex-wrap items-end justify-center gap-4 sm:min-h-52 sm:gap-5">
									{
										tableRowParticipantsReveal.map((participant) => {
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

											if (isRevealed && !hadTablePresence) {
												const revealedOnlyCard = (
													<div className="w-full animate-table-card-in">
														<VotingCard
															value={revealedValue}
															disabled
															tabIndex={-1}
															className="w-full shadow-md"
														/>
													</div>
												);
												const selfCardWrapperClassName = mergeTailwindClasses(
													'w-full',
													hideSelfTableCard ? 'pointer-events-none opacity-0' : ''
												);

												return (
													<motion.div
														key={participant.displayName}
														layout="position"
														transition={TABLE_COLUMN_LAYOUT_TRANSITION}
														className="flex flex-col items-center gap-2"
														data-table-flip-column={participant.displayName}
													>
														<div className="flex min-h-42 w-24 items-end justify-center sm:min-h-46 sm:w-28">
															{
																isSelf
																	? (
																		<div ref={selfSlotRef} className="w-full">
																			<div ref={selfCardRef} className={selfCardWrapperClassName}>
																				{revealedOnlyCard}
																			</div>
																		</div>
																	)
																	: revealedOnlyCard
															}
														</div>
														<span className="max-w-28 truncate text-center text-xs text-muted-foreground">
															{participant.displayName}
														</span>
													</motion.div>
												);
											}

											const flipRevealedValue = isSelf && selfVoteDisplay !== ''
												? selfVoteDisplay
												: revealedValue;

											const tableFlipCard = (
												<FlippableFaceDownVoteCard
													isRevealed={isRevealed}
													revealedValue={flipRevealedValue}
													isExiting={isExiting}
													prefersReducedMotion={prefersReducedMotion}
													frontFaceSelected={isSelf && Boolean(selfVoteDisplay)}
													showFrontFaceWhileConcealed={isSelf && Boolean(selfVoteDisplay)}
												/>
											);
											const selfFlipCardWrapperClassName = mergeTailwindClasses(
												'w-full',
												hideSelfTableCard ? 'pointer-events-none opacity-0' : ''
											);

											return (
												<motion.div
													key={participant.displayName}
													layout="position"
													transition={TABLE_COLUMN_LAYOUT_TRANSITION}
													className="flex flex-col items-center gap-2"
													data-table-flip-column={participant.displayName}
												>
													<div className="flex min-h-42 w-24 items-end justify-center sm:min-h-46 sm:w-28">
														{
															isSelf
																? (
																	<div ref={selfSlotRef} className="w-full">
																		<div ref={selfCardRef} className={selfFlipCardWrapperClassName}>
																			{tableFlipCard}
																		</div>
																	</div>
																)
																: tableFlipCard
														}
													</div>
													{
														isSelf
															? (
																selfVoteDisplay !== '' && (
																	<motion.span
																		className="max-w-28 truncate text-center text-xs text-muted-foreground"
																		initial={{ opacity: 0 }}
																		animate={{
																			opacity: hideSelfTableParticipantLabel ? 0 : 1,
																		}}
																		transition={
																			prefersReducedMotion
																				? { duration: 0 }
																				: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
																		}
																		aria-hidden={hideSelfTableParticipantLabel}
																	>
																		{selfDisplayName}
																	</motion.span>
																)
															)
															: (
																<span className="max-w-28 truncate text-center text-xs text-muted-foreground">
																	{participant.displayName}
																</span>
															)
													}
												</motion.div>
											);
										})
									}
								</div>
							</LayoutGroup>
						)
				}
			</div>
		</div>
	);
});
