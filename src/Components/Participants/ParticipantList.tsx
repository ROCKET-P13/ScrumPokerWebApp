import { Button } from '@ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/Card';
import _ from 'lodash';
import { useCallback, useMemo } from 'react';

import { useResetRound } from '@/hooks/useResetRound';
import { useRevealVotes } from '@/hooks/useRevealVotes';
import { roomStore } from '@/stores/roomStore';
import { Participant } from '@/types/Participant';

interface ParticipantListProps {
	participants: Participant[];
	isRevealed: boolean;
};

export const ParticipantList = (
	{
		participants,
		isRevealed,
	}: ParticipantListProps
) => {
	const { mutateAsync: revealVotes } = useRevealVotes();
	const { mutateAsync: resetRound } = useResetRound();
	const session = roomStore((s) => s.session);

	const room = roomStore((s) => s.room);

	const revealVotesButtonIsDisabled = useMemo(
		() => {
			return room.isRevealed || !_.every(room.participants, 'hasVoted');
		},
		[room.isRevealed, room.participants]
	);

	const handleResetRound = useCallback(async () => {
		await resetRound();
	}, [resetRound]);

	return (
		<Card className="h-full">
			<CardHeader className="px-6">
				<div className='flex flex-row justify-between'>
					<CardTitle className="text-base">Participants</CardTitle>
					{
						session.isRoomAdmin && (
							<div className="space-x-4">
								<Button
									disabled={!room.isRevealed}
									onClick={handleResetRound}
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
				</div>

				<CardDescription>
					{
						isRevealed
							? 'Votes are visible to everyone.'
							: 'Votes stay hidden until revealed.'
					}
				</CardDescription>
			</CardHeader>
			<CardContent className="px-6">
				<ul className="divide-y divide-border rounded-lg border border-border bg-background/50">
					{
						_.map(participants, (participant, index) => {
							return (
								<li
									key={`${participant.displayName}-${index}`}
									className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
								>
									<div className="flex min-w-0 flex-1 items-center gap-2">
										<p className="truncate font-medium text-foreground">{participant.displayName}</p>
										{
											participant.isRoomAdmin && (
												<span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
													Host
												</span>
											)
										}
									</div>
									<span
										className="shrink-0 tabular-nums font-semibold text-muted-foreground"
									>
										{
											participant.hasVoted ? '✓' : '…'
										}
									</span>
								</li>
							);
						})
					}
				</ul>
			</CardContent>
		</Card>
	);
};
