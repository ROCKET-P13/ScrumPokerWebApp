import { useNavigate, useParams } from '@tanstack/react-router';
import _ from 'lodash';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { Routes } from '@/Common/Routes';
import { VoteCardFlightDirection } from '@/Common/VoteCardFlightDirection';
import { ParticipantList } from '@/Components/Participants/ParticipantList';
import { VoteCardFlightOverlay } from '@/Components/Voting/VoteCardFlightOverlay';
import { VotingHand } from '@/Components/Voting/VotingHand';
import { VotingTable } from '@/Components/Voting/VotingTable';
import { usePrefersReducedMotion } from '@/hooks/animations';
import { useSendVote } from '@/hooks/useSendVote';
import { joinRoomStore } from '@/stores/joinRoomStore';
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

const roomCodesEqualCaseInsensitive = (sessionRoomCode: string | null, urlRoomCode: string): boolean => {
	if (sessionRoomCode == null || urlRoomCode === '') {
		return false;
	}

	return sessionRoomCode.toUpperCase() === urlRoomCode.toUpperCase();
};

export const RoomPage = () => {
	const navigate = useNavigate();
	const routeParams = useParams({ strict: false });
	const urlRoomCode = _.chain(routeParams).get('roomCode', '').trim().value();

	const session = roomStore((storeSnapshot) => storeSnapshot.session);
	const room = roomStore((storeSnapshot) => storeSnapshot.room);
	const { mutateAsync: sendVote } = useSendVote();
	const [currentVote, setCurrentVote] = useState('');
	const [activeFlights, setActiveFlights] = useState<ActiveFlight[]>([]);
	const [voteInteractionLocked, setVoteInteractionLocked] = useState(false);
	/** Hides the self table slot between committing `currentVote` and mounting flight overlays (avoids a one-frame flash). */
	const [suppressSelfTableForVoteFlight, setSuppressSelfTableForVoteFlight] = useState(false);

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

	const [roomPersistHydrated, setRoomPersistHydrated] = useState(() => roomStore.persist.hasHydrated());

	useEffect(() => {
		if (roomStore.persist.hasHydrated()) {
			return;
		}

		return roomStore.persist.onFinishHydration(() => {
			setRoomPersistHydrated(true);
		});
	}, []);

	const sessionMatchesUrlRoom = useMemo(
		() => !!session.displayName && roomCodesEqualCaseInsensitive(session.roomCode, urlRoomCode),
		[session.displayName, session.roomCode, urlRoomCode]
	);

	useLayoutEffect(() => {
		if (!roomPersistHydrated || urlRoomCode === '') {
			return;
		}

		if (sessionMatchesUrlRoom) {
			return;
		}

		joinRoomStore.getState().updateJoinData({ roomCode: urlRoomCode });
		navigate({ to: Routes.JOIN_ROOM, replace: true });
	}, [roomPersistHydrated, urlRoomCode, sessionMatchesUrlRoom, navigate]);

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

		const hasVoteNow = !!selfParticipant.hasVoted;

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

		flushSync(() => {
			if (
				batchThatJustFinished.length === 1
				&& batchThatJustFinished[0].direction === VoteCardFlightDirection.TO_HAND
			) {
				setCurrentVote('');
			}

			setActiveFlights([]);
			setSuppressSelfTableForVoteFlight(false);
		});

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

					flushSync(() => {
						setSuppressSelfTableForVoteFlight(true);
						setCurrentVote(newVoteValue);
					});

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

				flushSync(() => {
					setSuppressSelfTableForVoteFlight(true);
					setCurrentVote(newVoteValue);
				});

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
				setSuppressSelfTableForVoteFlight(false);
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

	if (!roomPersistHydrated) {
		return (
			<div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-8">
				<p className="text-center text-sm text-muted-foreground">Loading…</p>
			</div>
		);
	}

	if (!sessionMatchesUrlRoom) {
		return null;
	}

	if (!room) {
		return (
			<div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-8">
				<p className="text-center text-sm text-muted-foreground">Loading room…</p>
			</div>
		);
	}

	return (
		<div className="relative flex min-h-0 flex-col">
			<div
				className={
					session.isPlayer
						? 'px-4 pb-80 pt-8'
						: 'px-4 pb-8 pt-8'
				}
			>
				<div className='flex flex-col gap-4'>
					<ParticipantList
						participants={room.participants}
						isRevealed={room.isRevealed}
					/>

					<VotingTable
						selfDisplayName={session.displayName || ''}
						participants={_.filter(room.participants, 'isPlayer')}
						isRevealed={room.isRevealed}
						selfVoteDisplay={selfVoteDisplay}
						hideSelfTableCard={activeFlightUi.hideSelfTableCard || suppressSelfTableForVoteFlight}
						hideSelfTableParticipantLabel={activeFlightUi.hideSelfTableParticipantLabel}
						selfSlotRef={tableSelfSlotWrapperRef}
						selfCardRef={tableSelfCardContainerRef}
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
						reducedMotion={!!prefersReducedMotionFromSystem}
						onFlightComplete={handleVoteFlightOverlayAnimationComplete}
					/>
				))
			}
		</div>
	);
};
