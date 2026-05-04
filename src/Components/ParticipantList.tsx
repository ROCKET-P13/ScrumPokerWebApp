import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/Card';

import { Participant } from '@/types/Participant';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

type ParticipantListProps = {
	participants: Participant[];
	isRevealed: boolean;
	currentDisplayName?: string | null;
};

function voteLabel (p: Participant, isRevealed: boolean): string {
	if (isRevealed) {
		return p.vote ?? '—';
	}
	if (p.hasVoted) {
		return '✓';
	}
	return '…';
}

function voteRowTitle (isRevealed: boolean, hasVoted: boolean): string | undefined {
	if (isRevealed) {
		return undefined;
	}
	if (hasVoted) {
		return 'Voted';
	}
	return 'Not voted';
}

function participantListDescription (isRevealed: boolean): string {
	if (isRevealed) {
		return 'Votes are visible to everyone.';
	}
	return 'Votes stay hidden until revealed.';
}

function rowBackgroundClass (isSelf: boolean): string {
	if (isSelf) {
		return mergeTailwindClasses(
			'flex items-center justify-between gap-3 px-4 py-3 text-sm',
			'bg-accent/40'
		);
	}
	return 'flex items-center justify-between gap-3 px-4 py-3 text-sm';
}

function voteColumnTextClass (isRevealed: boolean): string {
	if (isRevealed) {
		return 'text-foreground';
	}
	return 'text-muted-foreground';
}

export const ParticipantList = ({
	participants,
	isRevealed,
	currentDisplayName,
}: ParticipantListProps) => {
	return (
		<Card className="h-full">
			<CardHeader className="px-6">
				<CardTitle className="text-base">Participants</CardTitle>
				<CardDescription>
					{participantListDescription(isRevealed)}
				</CardDescription>
			</CardHeader>
			<CardContent className="px-6">
				<ul className="divide-y divide-border rounded-lg border border-border bg-background/50">
					{participants.map((p, index) => {
						const isSelf = currentDisplayName != null && p.displayName === currentDisplayName;
						const label = voteLabel(p, isRevealed);

						return (
							<li
								key={`${p.displayName}-${index}`}
								className={rowBackgroundClass(isSelf)}
							>
								<div className="flex min-w-0 flex-1 items-center gap-2">
									<span className="truncate font-medium text-foreground">{p.displayName}</span>
									{p.isRoomAdmin && (
										<span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
											Host
										</span>
									)}
								</div>
								<span
									className={
										mergeTailwindClasses(
											'shrink-0 tabular-nums font-semibold',
											voteColumnTextClass(isRevealed)
										)
									}
									title={voteRowTitle(isRevealed, p.hasVoted)}
								>
									{label}
								</span>
							</li>
						);
					})}
				</ul>
			</CardContent>
		</Card>
	);
};
