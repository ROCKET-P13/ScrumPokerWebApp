import _ from 'lodash';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useTableColumnFlip } from '@/hooks/useTableColumnFlip';
import { Participant } from '@/types/Participant';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

import { FaceDownCard } from './FaceDownCard';
import { SelfVoteStack } from './SelfVoteStack';
import { sortParticipantsByVoteArrival } from './sortParticipantsByVoteArrival';
import { VotingCard } from './VotingCard';
import { SELF_FLIP_COLUMN_KEY, TABLE_FACE_DOWN_MS } from './votingTableConstants';

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
	const participantsList = participants;
	const tableRowRef = useRef<HTMLDivElement>(null);

	const voteArrivalOrderRef = useRef<Map<string, number>>(new Map());
	const nextVoteSeqRef = useRef(0);
	const prevOthersHasVotedRef = useRef<Map<string, boolean>>(new Map());
	const exitTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	const skipParticipantTransitionEffectRef = useRef(true);
	const [exitingVoteNames, setExitingVoteNames] = useState(() => new Set<string>());
	const voteSnapEndPrevCommitRef = useRef<Map<string, boolean>>(new Map());

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
				}, TABLE_FACE_DOWN_MS);

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
			const matchingOtherParticipant = otherParticipants.find(
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

	if (noCardsOnTable && voteArrivalOrderRef.current.size > 0) {
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

	const tableRowParticipantsHidden = sortParticipantsByVoteArrival(
		_.filter(
			_.map(
				Array.from(participantDisplayNamesShownOnTable),
				(displayName) => _.find(participantsList, (participant) => participant.displayName === displayName)
			),
			(participant): participant is Participant => participant != null
		),
		voteArrivalOrderByDisplayName
	);

	const tableRowParticipantsReveal = sortParticipantsByVoteArrival(
		participantsList,
		voteArrivalOrderByDisplayName
	);

	const flipLayoutKey = useMemo(
		() =>
			[
				isRevealed,
				_.map(participantsList, (participant) => `${participant.displayName}:${String(participant.hasVoted)}`).join(','),
				_.sortBy([...exitingForLayout], (displayName) => displayName).join(','),
				selfVoteDisplay,
			].join('|'),
		[isRevealed, participantsList, exitingForLayout, selfVoteDisplay]
	);

	useLayoutEffect(() => {
		voteSnapEndPrevCommitRef.current = new Map(
			_.map(otherParticipants, (participant) => [participant.displayName, participant.hasVoted] as const)
		);
	}, [otherParticipants]);

	useTableColumnFlip(tableRowRef, flipLayoutKey, isRevealed, exitingForLayout);

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
			<div
				ref={tableRowRef}
				className="flex min-h-48 flex-wrap items-end justify-center gap-4 sm:min-h-52 sm:gap-5"
			>
				{
					isRevealed
						? tableRowParticipantsReveal.map((participant, index) => {
							const key = `${participant.displayName}-${index}`;
							const revealedValue = participant.vote && participant.vote !== ''
								? participant.vote
								: '—';

							return (
								<div key={key} className="flex flex-col items-center gap-2">
									<div className="flex min-h-42 w-24 items-end justify-center sm:min-h-46 sm:w-28">
										<div className="w-full animate-table-card-in">
											<VotingCard
												value={revealedValue}
												disabled
												tabIndex={-1}
												className="w-full shadow-md"
											/>
										</div>
									</div>
									<span className="max-w-28 truncate text-center text-xs text-muted-foreground">
										{participant.displayName}
									</span>
								</div>
							);
						})
						: tableRowParticipantsHidden.map((participant) => {
							const isSelf = participant.displayName === selfDisplayName;

							if (isSelf) {
								return (
									<div
										key="__self__"
										className="flex flex-col items-center gap-2"
										data-table-flip-column={SELF_FLIP_COLUMN_KEY}
									>
										<div className="flex min-h-42 w-24 items-end justify-center sm:min-h-46 sm:w-28">
											<div ref={selfSlotRef} className="w-full">
												<SelfVoteStack
													selfVoteDisplay={selfVoteDisplay}
													hideSelfTableCard={hideSelfTableCard}
													selfCardRef={selfCardRef}
													isRevealed={isRevealed}
												/>
											</div>
										</div>
										{!hideSelfTableParticipantLabel && selfVoteDisplay !== '' && (
											<span className="max-w-28 truncate text-center text-xs text-muted-foreground">
												{selfDisplayName}
											</span>
										)}
									</div>
								);
							}

							const key = participant.displayName;
							const isExiting = exitingForLayout.has(participant.displayName)
								&& !participant.hasVoted;
							const motionClass = isExiting
								? 'animate-table-face-down-out'
								: 'animate-table-face-down-in';

							return (
								<div
									key={key}
									className="flex flex-col items-center gap-2"
									data-table-flip-column={participant.displayName}
								>
									<div className="flex min-h-42 w-24 items-end justify-center sm:min-h-46 sm:w-28">
										<FaceDownCard
											key={`${participant.displayName}-${participant.hasVoted}`}
											className={motionClass}
										/>
									</div>
									<span className="max-w-28 truncate text-center text-xs text-muted-foreground">
										{participant.displayName}
									</span>
								</div>
							);
						})
				}
			</div>
		</div>
	);
});
