import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import _ from 'lodash';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Participant } from '@/types/Participant';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';
import {
	TABLE_CARD_FLIP_DURATION_MS,
	TABLE_COLUMN_LAYOUT_TRANSITION,
	TABLE_DECK_FADE_DURATION_MS,
	TABLE_DECK_STACK_DURATION_MS,
	VOTE_CARD_FLIGHT_DURATION_MS
} from '@/utils/voteFlightGeometry';

import { FlippableFaceDownVoteCard } from './FlippableFaceDownVoteCard';
import { sortParticipantsByVoteArrival } from './sortParticipantsByVoteArrival';
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
	snapshotParticipants: Participant[];
	voteOrderMap: Map<string, number>;
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
	const participantsList = participants;

	const voteArrivalOrderRef = useRef<Map<string, number>>(new Map());
	const voteArrivalOrderBackupRef = useRef<Map<string, number>>(new Map());
	const nextVoteSeqRef = useRef(0);
	const prevOthersHasVotedRef = useRef<Map<string, boolean>>(new Map());
	const exitTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	const skipParticipantTransitionEffectRef = useRef(true);
	const [exitingVoteNames, setExitingVoteNames] = useState(() => new Set<string>());
	const voteSnapEndPrevCommitRef = useRef<Map<string, boolean>>(new Map());
	const prevParticipantsRef = useRef(participantsList);
	const prevIsRevealedRef = useRef(isRevealed);
	const [gatherDeck, setGatherDeck] = useState<GatherDeckState | null>(null);

	voteArrivalOrderBackupRef.current = new Map(voteArrivalOrderRef.current);

	const otherParticipants = _.filter(
		participantsList,
		(participant) => participant.displayName !== selfDisplayName
	);
	const hasAnyOtherParticipantVoted = otherParticipants.some((participant) => participant.hasVoted);

	useEffect(() => {
		const timeoutsMapRef = exitTimeoutsRef;

		return () => {
			const pending = timeoutsMapRef.current;

			for (const exitTimeoutId of pending.values()) {
				clearTimeout(exitTimeoutId);
			}

			pending.clear();
		};
	}, []);

	useEffect(() => {
		const otherParticipantsList = _.filter(
			participantsList,
			(participant) => participant.displayName !== selfDisplayName
		);

		if (skipParticipantTransitionEffectRef.current) {
			skipParticipantTransitionEffectRef.current = false;
			prevOthersHasVotedRef.current = new Map(
				otherParticipantsList.map((participant) => [participant.displayName, participant.hasVoted])
			);

			return;
		}

		for (const otherParticipant of otherParticipantsList) {
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
					voteArrivalOrderRef.current.delete(otherParticipant.displayName);
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

		prevOthersHasVotedRef.current = new Map(
			otherParticipantsList.map((participant) => [participant.displayName, participant.hasVoted])
		);
	}, [participantsList, selfDisplayName]);

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

	const noCardsOnTable
		= !hasAnyOtherParticipantVoted && exitingForLayout.size === 0 && !selfHasVisibleTableActivity;

	if (noCardsOnTable && voteArrivalOrderRef.current.size > 0 && gatherDeck === null) {
		voteArrivalOrderRef.current.clear();
		nextVoteSeqRef.current = 0;
	}

	if (!selfHasVisibleTableActivity) {
		voteArrivalOrderRef.current.delete(selfDisplayName);
	}

	for (const participant of participantsList) {
		if (participant.hasVoted && !voteArrivalOrderRef.current.has(participant.displayName)) {
			voteArrivalOrderRef.current.set(participant.displayName, nextVoteSeqRef.current);
			nextVoteSeqRef.current += 1;
		}
	}

	if (!isRevealed && selfVoteDisplay !== '' && !voteArrivalOrderRef.current.has(selfDisplayName)) {
		voteArrivalOrderRef.current.set(selfDisplayName, nextVoteSeqRef.current);
		nextVoteSeqRef.current += 1;
	}

	const voteArrivalOrderByDisplayName = voteArrivalOrderRef.current;

	const participantDisplayNamesShownOnTable = new Set<string>();

	for (const otherParticipant of otherParticipants) {
		if (otherParticipant.hasVoted) {
			participantDisplayNamesShownOnTable.add(otherParticipant.displayName);
		}
	}

	for (const exitingParticipantDisplayName of exitingForLayout) {
		participantDisplayNamesShownOnTable.add(exitingParticipantDisplayName);
	}

	if (!isRevealed && selfHasVisibleTableActivity) {
		participantDisplayNamesShownOnTable.add(selfDisplayName);
	}

	const tableRowParticipantsReveal = sortParticipantsByVoteArrival(
		participantsList,
		voteArrivalOrderByDisplayName
	);

	useLayoutEffect(() => {
		voteSnapEndPrevCommitRef.current = new Map(
			_.map(otherParticipants, (participant) => [participant.displayName, participant.hasVoted] as const)
		);
	}, [otherParticipants]);

	useEffect(() => {
		const previousParticipants = prevParticipantsRef.current;
		const previousIsRevealed = prevIsRevealedRef.current;

		const votesExistedPreviously = _.some(
			previousParticipants,
			(participant) =>
				participant.hasVoted || Boolean(participant.vote && participant.vote !== '')
		);

		const allVotesClearedNow = _.every(
			participantsList,
			(participant) => !participant.hasVoted && !(participant.vote && participant.vote !== '')
		);

		const resetFromRevealedRound = previousIsRevealed === true
			&& isRevealed === false
			&& votesExistedPreviously
			&& allVotesClearedNow;

		if (resetFromRevealedRound && gatherDeck === null && !prefersReducedMotion) {
			setGatherDeck({
				phase: 'flip',
				snapshotParticipants: _.cloneDeep(previousParticipants),
				voteOrderMap: new Map(voteArrivalOrderBackupRef.current),
			});
		}

		prevParticipantsRef.current = participantsList;
		prevIsRevealedRef.current = isRevealed;
	}, [participantsList, isRevealed, gatherDeck, prefersReducedMotion]);

	useEffect(() => {
		if (!gatherDeck || prefersReducedMotion) {
			return;
		}

		const { phase } = gatherDeck;

		if (phase === 'flip') {
			const timerId = window.setTimeout(() => {
				setGatherDeck((previous) => (previous ? { ...previous, phase: 'stack' } : null));
			}, TABLE_CARD_FLIP_DURATION_MS);

			return () => {
				window.clearTimeout(timerId);
			};
		}

		if (phase === 'stack') {
			const timerId = window.setTimeout(() => {
				setGatherDeck((previous) => (previous ? { ...previous, phase: 'fade' } : null));
			}, TABLE_DECK_STACK_DURATION_MS);

			return () => {
				window.clearTimeout(timerId);
			};
		}

		if (phase === 'fade') {
			const timerId = window.setTimeout(() => {
				setGatherDeck(null);
			}, TABLE_DECK_FADE_DURATION_MS);

			return () => {
				window.clearTimeout(timerId);
			};
		}
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
									snapshotParticipants={gatherDeck.snapshotParticipants}
									voteOrderByDisplayName={gatherDeck.voteOrderMap}
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
