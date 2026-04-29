import { useNavigate } from '@tanstack/react-router';
import { Button } from '@ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/Card';
import { Input } from '@ui/Input';
import { useState } from 'react';

import { Routes } from '@/Common/Routes';

export const StartRoomPage = () => {
	const navigate = useNavigate();
	const [name, setName] = useState('');

	return (
		<div className='mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-4'>
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
							label='Room Name'
							placeholder='Display name'
							value={name}
							onChange={(e) => {
								setName(e.target.value);
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
						onClick={() => {
							console.log({ name });
						}}
					>
							Create room
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};
