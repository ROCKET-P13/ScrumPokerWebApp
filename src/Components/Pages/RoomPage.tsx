import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { ParticipantList } from '@/Components/Participants/ParticipantList';
import { VotingCard } from '@/Components/Voting/VotingCard';
import { VotingHand } from '@/Components/Voting/VotingHand';
import { VotingTable } from '@/Components/Voting/VotingTable';
import { useSendVote } from '@/hooks/useSendVote';
import { roomStore } from '@/stores/roomStore';
import { runVoteCardFlight } from '@/utils/runVoteCardFlight';

type ActiveFlight = {
	value: string;
	from: DOMRect;
	to: DOMRect;
	direction: 'to-table' | 'to-hand';
};

export const RoomPage = () => {
	const session = roomStore((s) => s.session);
	const room = roomStore((s) => s.room);
	const { mutateAsync: sendVote } = useSendVote();
	const [currentVote, setCurrentVote] = useState('');
	const [activeFlight, setActiveFlight] = useState<ActiveFlight | null>(null);
	const [voteInteractionLocked, setVoteInteractionLocked] = useState(false);

	const voteInteractionLockedRef = useRef(false);
	const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
	const selfSlotRef = useRef<HTMLDivElement>(null);
	const selfCardRef = useRef<HTMLDivElement>(null);
	const flightLayerRef = useRef<HTMLDivElement>(null);
	const flightCompleteRef = useRef<(() => void) | null>(null);

	const registerCardRef = useCallback((value: string, element: HTMLButtonElement | null) => {
		if (element) {
			cardRefs.current.set(value, element);
		} else {
			cardRefs.current.delete(value);
		}
	}, []);

	const selfVoteDisplay = useMemo(() => {
		if (!room) {
			return currentVote;
		}

		if (room.isRevealed) {
			const me = room.participants.find((p) => p.displayName === session.displayName);

			return me?.vote ?? currentVote;
		}

		return currentVote;
	}, [room, session.displayName, currentVote]);

	const hideSelfTableCard
		= Boolean(
			activeFlight
			&& selfVoteDisplay !== ''
			&& activeFlight.value === selfVoteDisplay
			&& (
				activeFlight.direction === 'to-hand'
				|| activeFlight.direction === 'to-table'
			)
		);

	useLayoutEffect(() => {
		if (!activeFlight) {
			return;
		}

		const el = flightLayerRef.current;

		if (!el) {
			flightCompleteRef.current?.();
			flightCompleteRef.current = null;
			setActiveFlight(null);

			return;
		}

		let cancelled = false;

		void runVoteCardFlight(el, activeFlight.from, activeFlight.to).then(() => {
			if (cancelled) {
				return;
			}

			flushSync(() => {
				if (activeFlight.direction === 'to-hand') {
					setCurrentVote('');
				}

				setActiveFlight(null);
			});

			flightCompleteRef.current?.();
			flightCompleteRef.current = null;
		});

		return () => {
			cancelled = true;
		};
	}, [activeFlight]);

	const beginFlight = useCallback((payload: ActiveFlight) => {
		return new Promise<void>((resolve) => {
			flightCompleteRef.current = resolve;
			setActiveFlight(payload);
		});
	}, []);

	const measureFlightToTable = useCallback((value: string) => {
		const fromEl = cardRefs.current.get(value);
		const toEl = selfSlotRef.current;

		if (!fromEl || !toEl) {
			return null;
		}

		return {
			from: fromEl.getBoundingClientRect(),
			to: toEl.getBoundingClientRect(),
		};
	}, []);

	const measureFlightToHand = useCallback((value: string) => {
		const fromEl = selfCardRef.current;
		const toEl = cardRefs.current.get(value);

		if (!fromEl || !toEl) {
			return null;
		}

		return {
			from: fromEl.getBoundingClientRect(),
			to: toEl.getBoundingClientRect(),
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
				const runToHandFlightIfPossible = async (value: string): Promise<boolean> => {
					const measured = measureFlightToHand(value);

					if (!measured) {
						return false;
					}

					await beginFlight({
						value,
						from: measured.from,
						to: measured.to,
						direction: 'to-hand',
					});

					return true;
				};

				if (newVoteValue === currentVote) {
					const flew = await runToHandFlightIfPossible(currentVote);

					if (!flew) {
						setCurrentVote('');
					}

					await sendVote({ vote: '' });

					return '';
				}

				if (currentVote !== '') {
					const flewAway = await runToHandFlightIfPossible(currentVote);

					if (!flewAway) {
						flushSync(() => {
							setCurrentVote('');
						});
					}
				}

				flushSync(() => {
					setCurrentVote(newVoteValue);
				});

				const measuredToTable = measureFlightToTable(newVoteValue);

				if (!measuredToTable) {
					await sendVote({ vote: newVoteValue });

					return newVoteValue;
				}

				await beginFlight({
					value: newVoteValue,
					from: measuredToTable.from,
					to: measuredToTable.to,
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
			measureFlightToTable,
			measureFlightToHand,
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
					selfSlotRef={selfSlotRef}
					selfCardRef={selfCardRef}
					className="mb-8"
				/>

			</div>
			<VotingHand
				currentVote={currentVote}
				disabled={room.isRevealed}
				interactionLocked={voteInteractionLocked}
				onSelect={selectVote}
				registerCardRef={registerCardRef}
			/>

			{
				activeFlight && (
					<div
						ref={flightLayerRef}
						className="pointer-events-none fixed z-200"
						style={{
							left: activeFlight.from.left,
							top: activeFlight.from.top,
							width: activeFlight.from.width,
							height: activeFlight.from.height,
						}}
					>
						<VotingCard
							value={activeFlight.value}
							isSelected={false}
							spectrumFlight={
								activeFlight.direction === 'to-table' ? 'to-selected' : 'to-default'
							}
							disabled
							tabIndex={-1}
							className="h-full w-full shadow-lg"
						/>
					</div>
				)
			}
		</div>
	);
};
