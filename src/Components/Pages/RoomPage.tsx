import { ParticipantList } from '@/Components/ParticipantList';
import { VotingCardList } from '@/Components/VotingCardList';
import { roomStore } from '@/stores/roomStore';

export const RoomPage = () => {
	const session = roomStore((s) => s.session);
	const room = roomStore((s) => s.room);

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
				/>
				<VotingCardList />
			</div>
		</div>
	);
};
