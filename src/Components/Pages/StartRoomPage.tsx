import { useNavigate } from '@tanstack/react-router';
import { Button } from '@ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/Card';
import { Icon } from '@ui/Icon';
import { Input } from '@ui/Input';
import { Switch } from '@ui/Switch';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Routes } from '@/Common/Routes';
import { useCreateRoom } from '@/hooks/useCreateRoom';
import { roomStore } from '@/stores/roomStore';

export const StartRoomPage = () => {
	const navigate = useNavigate();
	const [name, setName] = useState('');
	const [isPlayer, setIsPlayer] = useState(false);

	const setSession = roomStore((state) => state.setSession);
	const setRoomState = roomStore((state) => state.setRoomState);

	const { mutateAsync: createRoom, isPending: isCreatingRoom } = useCreateRoom();

	const handleSubmit = async () => {
		const res = await createRoom({
			displayName: name,
			isPlayer,
		});
		setSession({
			roomCode: res.roomCode,
			displayName: name,
			isRoomAdmin: true,
			isPlayer,
			vote: '',
		});
		setRoomState(res);
		navigate({
			to: `${Routes.ROOM}/$roomCode`,
			params: { roomCode: res.roomCode },
		});
	};

	return (
		<div className='mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-4'>
			<Card>
				<CardHeader className='mb-3 px-6'>
					<CardTitle className='text-center text-2xl'>Start a room</CardTitle>
					<CardDescription className='text-center text-sm'>
						Create a session and share the room details with your team.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex flex-col gap-4'>
						<Input
							label='Display Name'
							placeholder='Display name'
							value={name}
							onChange={(e) => {
								setName(e.target.value);
							}}
						/>
						<Switch
							checked={isPlayer}
							label='Participate in voting'
							onChange={(isPlayer) => {
								setIsPlayer(isPlayer);
							}}
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
						aria-busy={isCreatingRoom}
						disabled={isCreatingRoom}
						onClick={handleSubmit}
					>
						{
							isCreatingRoom
								? (
									<>
										<Icon as={Loader2} aria-hidden className='mr-2 animate-spin' />
										Creating…
									</>
								)
								: 'Create room'
						}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};
