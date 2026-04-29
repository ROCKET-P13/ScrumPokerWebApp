import { Button } from '@ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/Card';
import { Input } from '@ui/Input';

import { joinRoomStore } from '@/stores/joinRoomStore';

export const JoinRoomPage = () => {
	const roomId = joinRoomStore((state) => state.roomId);
	const name = joinRoomStore((state) => state.name);
	const updateJoinData = joinRoomStore((state) => state.updateJoinData);

	return (
		<div className='mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-4'>
			<Card>
				<CardHeader className='mb-3'>
					<CardTitle className='text-center text-2xl'>Scrum Poker</CardTitle>
					<CardDescription className='text-center text-sm'>Join a room to estimate with your team.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4">
						<Input
							label='Room ID'
							placeholder='e.g. sprint-42'
							value={roomId}
							onChange={(e) => updateJoinData({ roomId: e.target.value })}
						/>
						<Input
							label='Name'
							placeholder='Display Name'
							value={name}
							onChange={(e) => updateJoinData({ name: e.target.value })}
						/>
						<Button
							onClick={() => {
								console.log({ name, roomId });
							}}
						>Join Room</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};