import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { ParticipantList } from '@/Components/Participants/ParticipantList';
import { VotingCard } from '@/Components/Voting/VotingCard';
import { VotingHand } from '@/Components/Voting/VotingHand';
import { VotingTable } from '@/Components/Voting/VotingTable';
import { useSendVote } from '@/hooks/useSendVote';
import { roomStore } from '@/stores/roomStore';
import { runVoteCardFlight } from '@/utils/runVoteCardFlight';

type VoteFlightBoundingRects = {
	sourceBoundingRect: DOMRect;
	destinationBoundingRect: DOMRect;
};

type FlightPayload = {
	voteOptionValue: string;
	sourceBoundingRect: DOMRect;
	destinationBoundingRect: DOMRect;
	direction: 'to-table' | 'to-hand';
};

type ActiveFlight = FlightPayload & { flightOverlayInstanceId: number };

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
	const flightOverlayLayerElementsByInstanceIdRef = useRef<Map<number, HTMLDivElement>>(new Map());
	const flightOverlaySequenceCounterRef = useRef(0);
	const flightCompletionPromiseResolveRef = useRef<(() => void) | null>(null);

	const registerCardRef = useCallback((voteOptionValue: string, cardButtonElement: HTMLButtonElement | null) => {
		if (cardButtonElement) {
			handCardButtonElementsByVoteValueRef.current.set(voteOptionValue, cardButtonElement);
		} else {
			handCardButtonElementsByVoteValueRef.current.delete(voteOptionValue);
		}
	}, []);

	const selfVoteDisplay = useMemo(() => {
		if (!room) {
			return currentVote;
		}

		if (room.isRevealed) {
			const sessionParticipant = room.participants.find(
				(participant) => participant.displayName === session.displayName
			);

			return sessionParticipant?.vote ?? currentVote;
		}

		return currentVote;
	}, [room, session.displayName, currentVote]);

	const hideSelfTableCard = Boolean(
		activeFlights.length > 0
		&& selfVoteDisplay !== ''
		&& activeFlights.some(
			(activeFlightRecord) =>
				activeFlightRecord.voteOptionValue === selfVoteDisplay
				&& (
					activeFlightRecord.direction === 'to-hand'
					|| activeFlightRecord.direction === 'to-table'
				)
		)
	);

	const hideSelfTableParticipantLabel = activeFlights.some(
		(activeFlightRecord) => activeFlightRecord.direction === 'to-hand'
	);

	useLayoutEffect(() => {
		if (activeFlights.length === 0) {
			return;
		}

		const activeFlightBatch = activeFlights;

		const flightOverlayLayerElements = activeFlightBatch.map((activeFlightRecord) =>
			flightOverlayLayerElementsByInstanceIdRef.current.get(activeFlightRecord.flightOverlayInstanceId)
		);

		if (flightOverlayLayerElements.some((flightOverlayLayerElement) => flightOverlayLayerElement == null)) {
			flightCompletionPromiseResolveRef.current?.();
			flightCompletionPromiseResolveRef.current = null;
			setActiveFlights([]);

			return;
		}

		let flightAnimationCancelled = false;

		void Promise.all(
			activeFlightBatch.map((activeFlightRecord, flightIndex) =>
				runVoteCardFlight(
					flightOverlayLayerElements[flightIndex]!,
					activeFlightRecord.sourceBoundingRect,
					activeFlightRecord.destinationBoundingRect
				)
			)
		).then(() => {
			if (flightAnimationCancelled) {
				return;
			}

			flushSync(() => {
				if (activeFlightBatch.length === 1 && activeFlightBatch[0].direction === 'to-hand') {
					setCurrentVote('');
				}

				setActiveFlights([]);
			});

			flightCompletionPromiseResolveRef.current?.();
			flightCompletionPromiseResolveRef.current = null;
		});

		return () => {
			flightAnimationCancelled = true;
		};
	}, [activeFlights]);

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
			flushSync(() => {
				setVoteInteractionLocked(true);
			});

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
						direction: 'to-hand',
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
						setCurrentVote(newVoteValue);
					});

					const placeOnTableFlightBoundingRects = measureFlightBoundingRectsToTable(newVoteValue);

					if (returnToHandFlightBoundingRects && placeOnTableFlightBoundingRects) {
						await beginFlights([
							{
								voteOptionValue: previousVoteValue,
								sourceBoundingRect: returnToHandFlightBoundingRects.sourceBoundingRect,
								destinationBoundingRect: returnToHandFlightBoundingRects.destinationBoundingRect,
								direction: 'to-hand',
							},
							{
								voteOptionValue: newVoteValue,
								sourceBoundingRect: placeOnTableFlightBoundingRects.sourceBoundingRect,
								destinationBoundingRect: placeOnTableFlightBoundingRects.destinationBoundingRect,
								direction: 'to-table',
							},
						]);
					} else if (placeOnTableFlightBoundingRects) {
						await beginFlight({
							voteOptionValue: newVoteValue,
							sourceBoundingRect: placeOnTableFlightBoundingRects.sourceBoundingRect,
							destinationBoundingRect: placeOnTableFlightBoundingRects.destinationBoundingRect,
							direction: 'to-table',
						});
					}

					await sendVote({ vote: newVoteValue });

					return newVoteValue;
				}

				flushSync(() => {
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
					direction: 'to-table',
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

				<ParticipantList
					setCurrentVote={setCurrentVote}
					participants={room.participants}
					isRevealed={room.isRevealed}
				/>

				<VotingTable
					selfDisplayName={session.displayName}
					participants={room.participants}
					isRevealed={room.isRevealed}
					selfVoteDisplay={selfVoteDisplay}
					hideSelfTableCard={hideSelfTableCard}
					hideSelfTableParticipantLabel={hideSelfTableParticipantLabel}
					selfSlotRef={tableSelfSlotWrapperRef}
					selfCardRef={tableSelfCardContainerRef}
					className="mb-8"
				/>

			</div>
			<VotingHand
				currentVote={currentVote}
				disabled={room.isRevealed}
				interactionLocked={voteInteractionLocked}
				liftDuringFlightForValues={activeFlights.map((activeFlightRecord) => activeFlightRecord.voteOptionValue)}
				onSelect={selectVote}
				registerCardRef={registerCardRef}
			/>

			{
				activeFlights.map((activeFlightRecord) => (
					<div
						key={activeFlightRecord.flightOverlayInstanceId}
						ref={(flightOverlayLayerElement) => {
							if (flightOverlayLayerElement) {
								flightOverlayLayerElementsByInstanceIdRef.current.set(
									activeFlightRecord.flightOverlayInstanceId,
									flightOverlayLayerElement
								);
							} else {
								flightOverlayLayerElementsByInstanceIdRef.current.delete(
									activeFlightRecord.flightOverlayInstanceId
								);
							}
						}}
						className="pointer-events-none fixed z-200"
						style={{
							left:
								activeFlightRecord.sourceBoundingRect.left
								+ (
									activeFlightRecord.sourceBoundingRect.width
									- activeFlightRecord.destinationBoundingRect.width
								)
								/ 2,
							top:
								activeFlightRecord.sourceBoundingRect.top
								+ (
									activeFlightRecord.sourceBoundingRect.height
									- activeFlightRecord.destinationBoundingRect.height
								)
								/ 2,
							width: activeFlightRecord.destinationBoundingRect.width,
							height: activeFlightRecord.destinationBoundingRect.height,
						}}
					>
						<VotingCard
							value={activeFlightRecord.voteOptionValue}
							isSelected={false}
							spectrumFlight={
								activeFlightRecord.direction === 'to-table' ? 'to-selected' : 'to-default'
							}
							disabled
							tabIndex={-1}
							className="h-full w-full shadow-lg"
						/>
					</div>
				))
			}
		</div>
	);
};
