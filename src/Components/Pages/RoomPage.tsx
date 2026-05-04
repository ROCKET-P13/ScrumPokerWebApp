import { PlayerList } from '@/Components/PlayerList';
import { VotingBoard } from '@/Components/VotingBoard';
import { roomStore } from '@/stores/roomStore';

export const RoomPage = () => {
	const room = roomStore((s) => s.room);

	console.log({ room });

	return (
		<div style={{ padding: 24 }}>
			<h1>Room: {room.roomCode}</h1>

			<PlayerList
				participants={room.participants}
				isRevealed={room.isRevealed}
			/>

			<VotingBoard />
		</div>
	);
};