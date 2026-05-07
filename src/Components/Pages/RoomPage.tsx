import { useCallback, useState } from 'react';

import { ParticipantList } from '@/Components/Participants/ParticipantList';
import { VotingHand } from '@/Components/Voting/VotingHand';
import { useSendVote } from '@/hooks/useSendVote';
import { roomStore } from '@/stores/roomStore';

export const RoomPage = () => {
	const session = roomStore((s) => s.session);
	const room = roomStore((s) => s.room);
	const { mutateAsync: sendVote } = useSendVote();
	const [currentVote, setCurrentVote] = useState('');

	const selectVote = useCallback(
		async (newVoteValue: string) => {
			if (room?.isRevealed) {
				return '';
			}

			if (newVoteValue == currentVote) {
				setCurrentVote('');
				return await sendVote({ vote: '' });
			}
			setCurrentVote(newVoteValue);
			await sendVote({ vote: newVoteValue });
		},
		[room.isRevealed, currentVote, sendVote]
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

			</div>
			<VotingHand
				currentVote={currentVote}
				disabled={room.isRevealed}
				onSelect={selectVote}
			/>
		</div>
	);
};
