import { useState } from 'react';

import { ParticipantList } from '@/Components/ParticipantList';
import { VotingCards } from '@/Components/VotingCards';
import { useSendVote } from '@/hooks/useSendVote';
import { roomStore } from '@/stores/roomStore';
import { Participant } from '@/types/Participant';
import { Room } from '@/types/Room';

function resolveSelectedVote (
	room: Room,
	participants: Participant[],
	displayName: string | null,
	lastPick: string | null,
	isVotePending: boolean
): string | null {
	const self = participants.find((p) => p.displayName === displayName);
	if (self == null) {
		return null;
	}

	if (self.hasVoted) {
		if (room.isRevealed && self.vote != null) {
			return self.vote;
		}
		return lastPick;
	}

	if (isVotePending && lastPick != null) {
		return lastPick;
	}

	return null;
}

export const RoomPage = () => {
	const session = roomStore((s) => s.session);
	const room = roomStore((s) => s.room);
	// console.log({ session, room });
	const setRoomState = roomStore((s) => s.setRoomState);

	const { mutateAsync: sendVote, isPending: isVotePending } = useSendVote();

	const [lastPick, setLastPick] = useState<string | null>(null);

	const participants = room?.participants ?? [];

	let selectedValue: string | null = null;
	if (room != null) {
		selectedValue = resolveSelectedVote(
			room,
			participants,
			session.displayName,
			lastPick,
			isVotePending
		);
	}

	const handleVote = async (value: string) => {
		const previous = lastPick;
		setLastPick(value);
		try {
			const next = await sendVote({ vote: value });
			setRoomState(next);
		} catch (err) {
			console.error('Failed to send vote', err);
			setLastPick(previous);
		}
	};

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
		<div className="mx-auto min-h-svh max-w-5xl px-4 py-8">
			<header className="mb-8 text-center">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">Scrum Poker</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Room <span className="font-mono font-medium text-foreground">{session.roomCode}</span>
				</p>
			</header>

			<div className="grid gap-6 lg:grid-cols-2 lg:items-start">
				<ParticipantList
					participants={participants}
					isRevealed={room.isRevealed}
					currentDisplayName={session.displayName}
				/>
				<VotingCards
					selectedValue={selectedValue}
					onSelect={handleVote}
					isSubmitting={isVotePending}
				/>
			</div>
		</div>
	);
};
