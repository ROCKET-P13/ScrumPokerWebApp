import { useNavigate } from '@tanstack/react-router';
import { Button } from '@ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/Card';

import { Routes } from '@/Common/Routes';

export const LandingPage = () => {
	const navigate = useNavigate();

	return (
		<div className='mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-4'>
			<Card>
				<CardHeader className='mb-3 px-6'>
					<CardTitle className='text-center text-2xl'>Scrum Poker</CardTitle>
					<CardDescription className='text-center text-sm'>
						Join an existing session or start a new room for your team.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex flex-col gap-3'>
						<Button
							className='w-full'
							onClick={() => {
								navigate({ to: Routes.JOIN_ROOM });
							}}
						>
							Join a room
						</Button>
						<Button
							className='w-full'
							variant='secondary'
							onClick={() => {
								navigate({ to: Routes.START_ROOM });
							}}
						>
							Start a room
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
