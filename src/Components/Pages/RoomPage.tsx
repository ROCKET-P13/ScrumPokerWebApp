import { Button } from '@ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/Card';
import _ from 'lodash';
import { useMemo, useState } from 'react';

import { DefaultVoteOptions } from '@/Common/DefaultVoteOptions';
import { ParticipantList } from '@/Components/Participants/ParticipantList';
import { useResetRound } from '@/hooks/useResetRound';
import { useRevealVotes } from '@/hooks/useRevealVotes';
import { useSendVote } from '@/hooks/useSendVote';
import { roomStore } from '@/stores/roomStore';

export const RoomPage = () => {
	const session = roomStore((s) => s.session);
	const room = roomStore((s) => s.room);
	const { mutateAsync: sendVote } = useSendVote();
	const { mutateAsync: revealVotes } = useRevealVotes();
	const { mutateAsync: resetRound } = useResetRound();
	const [currentVote, setCurrentVote] = useState('');

	const revealVotesButtonIsDisabled = useMemo(
		() => {
			return room.isRevealed || !_.every(room.participants, 'hasVoted');
		},
		[room.isRevealed, room.participants]
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

	const selectVote = async (newVoteValue: string) => {
		if (room.isRevealed) {
			return '';
		}

		if (newVoteValue == currentVote) {
			setCurrentVote('');
			return await sendVote({ vote: '' });
		}
		setCurrentVote(newVoteValue);
		await sendVote({ vote: newVoteValue });
	};

	return (
		<div className="mx-auto min-h-svh max-w-5xl px-4 py-8">
			<div className="mb-8 text-center flex flex-col items-center justify-center">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">Scrum Poker</h1>
				<div className="mt-1 text-sm text-muted-foreground flex flex-row gap-1">
					<p>Room</p>
					<p className="font-mono font-medium text-foreground">{session.roomCode}</p>
				</div>
			</div>

			<div className="gap-6 flex flex-col">
				<ParticipantList
					participants={room.participants}
					isRevealed={room.isRevealed}
				/>

				<Card className="h-full">
					<CardHeader className="px-6 flex flex-row justify-between items-center">
						<div>
							<CardTitle className="text-base">Your vote</CardTitle>
							<CardDescription>Pick a card to submit your estimate for this round.</CardDescription>
						</div>
						{
							session.isRoomAdmin && (
								<div className='space-x-4'>
									<Button
										disabled={!room.isRevealed}
										onClick={() => resetRound()}
									>
										Reset Round
									</Button>
									<Button
										disabled={revealVotesButtonIsDisabled}
										onClick={() => revealVotes()}
									>
										Reveal Votes
									</Button>
								</div>
							)
						}

					</CardHeader>
					<CardContent className="px-6">
						<div
							className="grid grid-cols-4 gap-2 sm:grid-cols-6"
							role="group"
							aria-label="Planning poker values"
						>
							{
								DefaultVoteOptions.map((value) => (
									<Button
										key={value}
										disabled={room.isRevealed}
										variant={(currentVote === value) ? 'default' : 'outline'}
										size="lg"
										className='aspect-square h-auto min-h-14 w-full p-0 text-lg font-semibold'
										onClick={() => selectVote(value)}
									>
										{value}
									</Button>
								))
							}
						</div>
					</CardContent>
				</Card>

			</div>
		</div>
	);
};
