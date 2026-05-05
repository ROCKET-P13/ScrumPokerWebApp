import { Button } from '@ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/Card';
import { useState } from 'react';

import { ParticipantList } from '@/Components/ParticipantList';
import { VotingCard } from '@/Components/VotingCard';
import { useRevealVotes } from '@/hooks/useRevealVotes';
import { useSendVote } from '@/hooks/useSendVote';
import { roomStore } from '@/stores/roomStore';

const DefaultVoteOptions = [
	'0',
	'1',
	'2',
	'3',
	'5',
	'8',
	'13',
	'21',
	'?',
	'☕',
];

export const RoomPage = () => {
	const session = roomStore((s) => s.session);
	const room = roomStore((s) => s.room);
	const { mutateAsync: sendVote } = useSendVote();
	const [vote, setVote] = useState('');
	const { mutateAsync: revealVotes } = useRevealVotes();

	const participants = room?.participants ?? [];
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

	const handleSelectVote = async (value: string) => {
		setVote(value);
		await sendVote({ vote: value });
	};

	console.log({ room });

	return (
		<div className="mx-auto min-h-svh max-w-5xl px-4 py-8">
			<header className="mb-8 text-center">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">Scrum Poker</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Room <span className="font-mono font-medium text-foreground">{session.roomCode}</span>
				</p>
			</header>

			<div className="gap-6 flex flex-col">
				<ParticipantList
					participants={participants}
					isRevealed={room.isRevealed}
				/>

				<Card className="h-full">
					<CardHeader className="px-6 flex flex-row justify-between items-center">
						<div>
							<CardTitle className="text-base">Your vote</CardTitle>
							<CardDescription>Pick a card to submit your estimate for this round.</CardDescription>
						</div>
						<Button
							disabled={room.isRevealed}
							onClick={async () => await revealVotes()}
						>
							Reveal Votes
						</Button>
					</CardHeader>
					<CardContent className="px-6">
						<div
							className="grid grid-cols-4 gap-2 sm:grid-cols-6"
							role="group"
							aria-label="Planning poker values"
						>
							{
								DefaultVoteOptions.map((value) => (
									<VotingCard
										key={value}
										value={value}
										isSelected={vote === value}
										onClick={async () => await handleSelectVote(value)}
									/>
								))
							}
						</div>
					</CardContent>
				</Card>

			</div>
		</div>
	);
};
