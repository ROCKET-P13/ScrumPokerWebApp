import { useNavigate } from '@tanstack/react-router';
import { Button } from '@ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/Card';
import { Input } from '@ui/Input';

import { Routes } from '@/Common/Routes';
import { useJoinRoom } from '@/hooks/useJoinRoom';
import { joinRoomStore } from '@/stores/joinRoomStore';

export const JoinRoomPage = () => {
	const navigate = useNavigate();
	const roomCode = joinRoomStore((state) => state.roomCode);
	const name = joinRoomStore((state) => state.name);
	const updateJoinData = joinRoomStore((state) => state.updateJoinData);

	const { mutate: joinRoom } = useJoinRoom();

	const handleSubmit = async () => {
		const res = joinRoom({
			roomCode,
			displayName: name,
		});
		console.log(res);
	};

	return (
		<div className='mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-4'>
			<Card>
				<CardHeader className='mb-3 px-6'>
					<CardTitle className='text-center text-2xl'>Scrum Poker</CardTitle>
					<CardDescription className='text-center text-sm'>Join a room to estimate with your team.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-4">
						<Input
							label='Room ID'
							placeholder='e.g. sprint-42'
							value={roomCode}
							onChange={(e) => updateJoinData({ roomCode: e.target.value })}
						/>
						<Input
							label='Name'
							placeholder='Display Name'
							value={name}
							onChange={(e) => updateJoinData({ name: e.target.value })}
						/>

					</div>
				</CardContent>
				<CardFooter className='justify-between'>
					<Button
						variant='outline'
						onClick={() => {
							navigate({ to: Routes.HOME });
						}}
					>
							Back
					</Button>
					<Button
						onClick={handleSubmit}
					>Join Room</Button>
				</CardFooter>
			</Card>
		</div>
	);
};