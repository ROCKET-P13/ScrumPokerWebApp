import { roomStore } from '@/stores/roomStore';

const values = ['1', '2', '3', '5', '8', '13'];

export const VotingBoard = () => {
	const room = roomStore((s) => s.room);
	const selfVote = roomStore((s) => s.selfVote);

	if (!room || room.isRevealed) return null;

	return (
		<div style={{ marginTop: 20 }}>
			<h2>Vote</h2>

			<div style={{ display: 'flex', gap: 10 }}>
				{values.map((v) => (
					<button
						key={v}
						onClick={() => console.log({ room, v })}
						style={{
							width: 60,
							height: 80,
							borderRadius: 8,
							border:
                selfVote === v
                	? '2px solid blue'
                	: '1px solid gray',
							background:
                selfVote === v ? '#eef' : '#fff',
							cursor: 'pointer',
							fontSize: 18,
						}}
					>
						{v}
					</button>
				))}
			</div>
		</div>
	);
};