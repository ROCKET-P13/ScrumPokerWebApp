import _ from 'lodash';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { VoteCardFlightDirection } from '@/Common/VoteCardFlightDirection';
import { ParticipantList } from '@/Components/Participants/ParticipantList';
import { VoteCardFlightOverlay } from '@/Components/Voting/VoteCardFlightOverlay';
import { VotingHand } from '@/Components/Voting/VotingHand';
import { VotingTable } from '@/Components/Voting/VotingTable';
import { usePrefersReducedMotion } from '@/hooks/animations';
import { useSendVote } from '@/hooks/useSendVote';
import { roomStore } from '@/stores/roomStore';

type VoteFlightBoundingRects = {
	sourceBoundingRect: DOMRect;
	destinationBoundingRect: DOMRect;
};

type FlightPayload = {
	voteOptionValue: string;
	sourceBoundingRect: DOMRect;
	destinationBoundingRect: DOMRect;
	direction: VoteCardFlightDirection;
};

type ActiveFlight = FlightPayload & { flightOverlayInstanceId: number };

const afterNextPaint = (): Promise<void> =>
	new Promise((resolve) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				resolve();
			});
		});
	});

export const RoomPage = () => {
	const session = roomStore((storeSnapshot) => storeSnapshot.session);
	const room = roomStore((storeSnapshot) => storeSnapshot.room);
	const { mutateAsync: sendVote } = useSendVote();
	const [currentVote, setCurrentVote] = useState('');
	const [activeFlights, setActiveFlights] = useState<ActiveFlight[]>([]);
	const [voteInteractionLocked, setVoteInteractionLocked] = useState(false);

	const voteInteractionLockedRef = useRef(false);
	const handCardButtonElementsByVoteValueRef = useRef<Map<string, HTMLButtonElement>>(new Map());
	const tableSelfSlotWrapperRef = useRef<HTMLDivElement>(null);
	const tableSelfCardContainerRef = useRef<HTMLDivElement>(null);
	const flightOverlaySequenceCounterRef = useRef(0);
	const flightCompletionPromiseResolveRef = useRef<(() => void) | null>(null);
	const activeFlightBatchSnapshotRef = useRef<ActiveFlight[]>([]);
	const flightBatchExpectedCountRef = useRef(0);
	const flightBatchCompletedCountRef = useRef(0);
	const prevSelfHadVoteRef = useRef<boolean | null>(null);

	const prefersReducedMotionFromSystem = usePrefersReducedMotion();

	useEffect(() => {
		if (!session.displayName) {
			return;
		}

		const selfParticipant = _.find(
			room.participants,
			(participant) => participant.displayName === session.displayName
		);

		if (!selfParticipant) {
			return;
		}

		const hasVoteNow = Boolean(selfParticipant.hasVoted);

		if (prevSelfHadVoteRef.current === true && !hasVoteNow && currentVote !== '') {
			setCurrentVote('');
		}

		prevSelfHadVoteRef.current = hasVoteNow;
	}, [room.participants, session.displayName, currentVote]);

	const registerCardRef = useCallback((voteOptionValue: string, cardButtonElement: HTMLButtonElement | null) => {
		if (cardButtonElement) {
			handCardButtonElementsByVoteValueRef.current.set(voteOptionValue, cardButtonElement);
		} else {
			handCardButtonElementsByVoteValueRef.current.delete(voteOptionValue);
		}
	}, []);

	const selfVoteDisplay = useMemo(() => {
		if (room.isRevealed) {
			const sessionParticipant = _.find(
				room.participants,
				(participant) => participant.displayName === session.displayName
			);

			return sessionParticipant?.vote ?? currentVote;
		}

		return currentVote;
	}, [room, session.displayName, currentVote]);

	const activeFlightUi = useMemo(() => {
		let anyToHand = false;
		let anyToTable = false;
		let selfVoteInFlight = false;
		const liftDuringFlightForValues: string[] = [];

		for (const activeFlightRecord of activeFlights) {
			liftDuringFlightForValues.push(activeFlightRecord.voteOptionValue);
			if (activeFlightRecord.direction === VoteCardFlightDirection.TO_HAND) {
				anyToHand = true;
			}
			if (activeFlightRecord.direction === VoteCardFlightDirection.TO_TABLE) {
				anyToTable = true;
			}
			if (
				selfVoteDisplay !== ''
				&& activeFlightRecord.voteOptionValue === selfVoteDisplay
				&& (
					activeFlightRecord.direction === VoteCardFlightDirection.TO_HAND
					|| activeFlightRecord.direction === VoteCardFlightDirection.TO_TABLE
				)
			) {
				selfVoteInFlight = true;
			}
		}

		const hasFlights = activeFlights.length > 0;

		return {
			hideSelfTableCard: hasFlights && selfVoteDisplay !== '' && selfVoteInFlight,
			hideSelfTableParticipantLabel: anyToHand && !anyToTable,
			liftDuringFlightForValues,
		};
	}, [activeFlights, selfVoteDisplay]);

	const suppressHandLiftTransition = voteInteractionLocked && activeFlights.length > 0;

	useLayoutEffect(() => {
		if (activeFlights.length === 0) {
			return;
		}

		activeFlightBatchSnapshotRef.current = activeFlights;
		flightBatchCompletedCountRef.current = 0;
		flightBatchExpectedCountRef.current = activeFlights.length;
	}, [activeFlights]);

	const handleVoteFlightOverlayAnimationComplete = useCallback(() => {
		flightBatchCompletedCountRef.current += 1;

		if (flightBatchCompletedCountRef.current < flightBatchExpectedCountRef.current) {
			return;
		}

		const batchThatJustFinished = activeFlightBatchSnapshotRef.current;

		if (
			batchThatJustFinished.length === 1
			&& batchThatJustFinished[0].direction === VoteCardFlightDirection.TO_HAND
		) {
			setCurrentVote('');
		}

		setActiveFlights([]);

		flightCompletionPromiseResolveRef.current?.();
		flightCompletionPromiseResolveRef.current = null;
	}, []);

	const beginFlights = useCallback((flightPayloads: FlightPayload[]) => {
		return new Promise<void>((resolveCompletion) => {
			flightCompletionPromiseResolveRef.current = resolveCompletion;
			setActiveFlights(
				flightPayloads.map((flightPayload) => ({
					...flightPayload,
					flightOverlayInstanceId: ++flightOverlaySequenceCounterRef.current,
				}))
			);
		});
	}, []);

	const beginFlight = useCallback(
		(flightPayload: FlightPayload) => beginFlights([flightPayload]),
		[beginFlights]
	);

	const measureFlightBoundingRectsToTable = useCallback((voteOptionValue: string): VoteFlightBoundingRects | null => {
		const handCardButtonElement = handCardButtonElementsByVoteValueRef.current.get(voteOptionValue);
		const tableSelfSlotWrapperElement = tableSelfSlotWrapperRef.current;

		if (!handCardButtonElement || !tableSelfSlotWrapperElement) {
			return null;
		}

		return {
			sourceBoundingRect: handCardButtonElement.getBoundingClientRect(),
			destinationBoundingRect: tableSelfSlotWrapperElement.getBoundingClientRect(),
		};
	}, []);

	const measureFlightBoundingRectsToHand = useCallback((voteOptionValue: string): VoteFlightBoundingRects | null => {
		const tableSelfCardContainerElement = tableSelfCardContainerRef.current;
		const handCardButtonElement = handCardButtonElementsByVoteValueRef.current.get(voteOptionValue);

		if (!tableSelfCardContainerElement || !handCardButtonElement) {
			return null;
		}

		return {
			sourceBoundingRect: tableSelfCardContainerElement.getBoundingClientRect(),
			destinationBoundingRect: handCardButtonElement.getBoundingClientRect(),
		};
	}, []);

	const selectVote = useCallback(
		async (newVoteValue: string) => {
			if (!room || room.isRevealed) {
				return '';
			}

			if (voteInteractionLockedRef.current) {
				return '';
			}

			voteInteractionLockedRef.current = true;
			setVoteInteractionLocked(true);

			try {
				const runReturnToHandFlightIfPossible = async (voteOptionValue: string): Promise<boolean> => {
					const handReturnFlightBoundingRects = measureFlightBoundingRectsToHand(voteOptionValue);

					if (!handReturnFlightBoundingRects) {
						return false;
					}

					await beginFlight({
						voteOptionValue,
						sourceBoundingRect: handReturnFlightBoundingRects.sourceBoundingRect,
						destinationBoundingRect: handReturnFlightBoundingRects.destinationBoundingRect,
						direction: VoteCardFlightDirection.TO_HAND,
					});

					return true;
				};

				if (newVoteValue === currentVote) {
					const didRunHandReturnFlightAnimation = await runReturnToHandFlightIfPossible(currentVote);

					if (!didRunHandReturnFlightAnimation) {
						setCurrentVote('');
					}

					await sendVote({ vote: '' });

					return '';
				}

				if (currentVote !== '' && newVoteValue !== currentVote) {
					const previousVoteValue = currentVote;
					const returnToHandFlightBoundingRects = measureFlightBoundingRectsToHand(previousVoteValue);

					setCurrentVote(newVoteValue);
					await afterNextPaint();

					const placeOnTableFlightBoundingRects = measureFlightBoundingRectsToTable(newVoteValue);

					if (returnToHandFlightBoundingRects && placeOnTableFlightBoundingRects) {
						await beginFlights([
							{
								voteOptionValue: previousVoteValue,
								sourceBoundingRect: returnToHandFlightBoundingRects.sourceBoundingRect,
								destinationBoundingRect: returnToHandFlightBoundingRects.destinationBoundingRect,
								direction: VoteCardFlightDirection.TO_HAND,
							},
							{
								voteOptionValue: newVoteValue,
								sourceBoundingRect: placeOnTableFlightBoundingRects.sourceBoundingRect,
								destinationBoundingRect: placeOnTableFlightBoundingRects.destinationBoundingRect,
								direction: VoteCardFlightDirection.TO_TABLE,
							},
						]);
					} else if (placeOnTableFlightBoundingRects) {
						await beginFlight({
							voteOptionValue: newVoteValue,
							sourceBoundingRect: placeOnTableFlightBoundingRects.sourceBoundingRect,
							destinationBoundingRect: placeOnTableFlightBoundingRects.destinationBoundingRect,
							direction: VoteCardFlightDirection.TO_TABLE,
						});
					}

					await sendVote({ vote: newVoteValue });

					return newVoteValue;
				}

				setCurrentVote(newVoteValue);
				await afterNextPaint();

				const firstVoteTableFlightBoundingRects = measureFlightBoundingRectsToTable(newVoteValue);

				if (!firstVoteTableFlightBoundingRects) {
					await sendVote({ vote: newVoteValue });

					return newVoteValue;
				}

				await beginFlight({
					voteOptionValue: newVoteValue,
					sourceBoundingRect: firstVoteTableFlightBoundingRects.sourceBoundingRect,
					destinationBoundingRect: firstVoteTableFlightBoundingRects.destinationBoundingRect,
					direction: VoteCardFlightDirection.TO_TABLE,
				});

				await sendVote({ vote: newVoteValue });

				return newVoteValue;
			} finally {
				voteInteractionLockedRef.current = false;
				setVoteInteractionLocked(false);
			}
		},
		[
			room,
			currentVote,
			sendVote,
			beginFlight,
			beginFlights,
			measureFlightBoundingRectsToTable,
			measureFlightBoundingRectsToHand,
		]
	);

	if (!session.roomCode || !session.displayName) {
		return null;
	}

	if (!room) {
		return (
			<div className="mx-auto flex min-h-svh max-w-4xl flex-col justify-center px-4 py-8">
				<p className="text-center text-sm text-muted-foreground">Loading room…</p>
			</div>
		);
	}

	return (
		<div className="relative min-h-svh">
			<div className="mx-auto max-w-5xl px-4 pb-72 pt-8 sm:pb-80">
				<div className="mb-8 flex flex-col items-center justify-center text-center">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">Scrum Poker</h1>
					<div className="mt-1 flex flex-row gap-1 text-sm text-muted-foreground">
						<p>Room</p>
						<p className="font-mono font-medium text-foreground">{session.roomCode}</p>
					</div>
				</div>

				<div className='flex flex-col gap-4'>
					<ParticipantList
						participants={room.participants}
						isRevealed={room.isRevealed}
					/>

					<VotingTable
						selfDisplayName={session.displayName}
						participants={_.filter(room.participants, 'isPlayer')}
						isRevealed={room.isRevealed}
						selfVoteDisplay={selfVoteDisplay}
						hideSelfTableCard={activeFlightUi.hideSelfTableCard}
						hideSelfTableParticipantLabel={activeFlightUi.hideSelfTableParticipantLabel}
						selfSlotRef={tableSelfSlotWrapperRef}
						selfCardRef={tableSelfCardContainerRef}
						className="mb-8"
					/>
				</div>

			</div>

			{
				session.isPlayer && <VotingHand
					currentVote={currentVote}
					disabled={room.isRevealed}
					interactionLocked={voteInteractionLocked}
					suppressHandLiftTransition={suppressHandLiftTransition}
					liftDuringFlightForValues={activeFlightUi.liftDuringFlightForValues}
					onSelect={selectVote}
					registerCardRef={registerCardRef}
				/>
			}

			{
				activeFlights.map((activeFlightRecord) => (
					<VoteCardFlightOverlay
						key={activeFlightRecord.flightOverlayInstanceId}
						voteOptionValue={activeFlightRecord.voteOptionValue}
						sourceBoundingRect={activeFlightRecord.sourceBoundingRect}
						destinationBoundingRect={activeFlightRecord.destinationBoundingRect}
						direction={activeFlightRecord.direction}
						reducedMotion={Boolean(prefersReducedMotionFromSystem)}
						onFlightComplete={handleVoteFlightOverlayAnimationComplete}
					/>
				))
			}
		</div>
	);
};
