import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/Card';

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
	return (
		<Card className="h-full">
			<CardHeader className="px-6">
				<CardTitle className="text-base">Participants</CardTitle>
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
						participants.map((participant, index) => {
							return (
								<li
									key={`${participant.displayName}-${index}`}
									className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
								>
									<div className="flex min-w-0 flex-1 items-center gap-2">
										<span className="truncate font-medium text-foreground">{participant.displayName}</span>
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
