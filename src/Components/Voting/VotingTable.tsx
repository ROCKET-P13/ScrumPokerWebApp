import _ from 'lodash';
import { memo, type ReactNode } from 'react';

import { Participant } from '@/types/Participant';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

import { VotingCard } from './VotingCard';

export interface VotingTableProps {
	selfDisplayName: string;
	participants: Participant[];
	isRevealed: boolean;
	/** Face value shown on the table for this client (local vote while hidden; server vote when revealed) */
	selfVoteDisplay: string;
	hideSelfTableCard: boolean;
	selfSlotRef: React.RefObject<HTMLDivElement | null>;
	selfCardRef: React.RefObject<HTMLDivElement | null>;
	className?: string;
}

const FaceDownCard = memo(function FaceDownCard ({ className = '' }: { className?: string }) {
	return (
		<div
			className={
				mergeTailwindClasses(
					`relative flex aspect-5/7 w-24 shrink-0 flex-col overflow-hidden rounded-(--radius)
					border border-border bg-linear-to-br from-secondary via-card to-secondary shadow-md
					sm:w-28`,
					className
				)
			}
		>
			<div
				className="pointer-events-none absolute inset-2 rounded-md border border-border/40 bg-background/20"
				aria-hidden
			/>
			<div className="pointer-events-none flex flex-1 items-center justify-center p-2">
				<div
					className="h-10 w-10 rounded-full border-2 border-primary/35 bg-primary/10"
					aria-hidden
				/>
			</div>
		</div>
	);
});

function renderSelfStack (
	selfVoteDisplay: string,
	hideSelfTableCard: boolean,
	selfCardRef: React.RefObject<HTMLDivElement | null>
): ReactNode {
	if (selfVoteDisplay && !hideSelfTableCard) {
		return (
			<div ref={selfCardRef} className="w-full">
				<VotingCard
					value={selfVoteDisplay}
					isSelected
					disabled
					tabIndex={-1}
					className="w-full shadow-md"
				/>
			</div>
		);
	}

	return (
		<div
			className="flex aspect-5/7 w-full items-center justify-center rounded-(--radius) border border-dashed
			border-border/50 bg-background/30 text-xs text-muted-foreground"
			aria-hidden
		>
			You
		</div>
	);
}

export const VotingTable = memo(function VotingTable (
	{
		selfDisplayName,
		participants,
		isRevealed,
		selfVoteDisplay,
		hideSelfTableCard,
		selfSlotRef,
		selfCardRef,
		className = '',
	}: VotingTableProps
) {
	const others = _.filter(participants, (p) => p.displayName !== selfDisplayName);

	return (
		<div
			className={
				mergeTailwindClasses(
					`rounded-xl border border-border/80 bg-muted/20 px-4 py-6 backdrop-blur-xs`,
					className
				)
			}
		>
			<p className="mb-4 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
				Table
			</p>
			<div className="flex min-h-44 flex-wrap items-end justify-center gap-4 sm:min-h-48 sm:gap-5">
				<div className="flex flex-col items-center gap-2">
					<div className="flex min-h-42 w-24 items-end justify-center sm:min-h-46 sm:w-28">
						<div ref={selfSlotRef} className="w-full">
							{renderSelfStack(selfVoteDisplay, hideSelfTableCard, selfCardRef)}
						</div>
					</div>
					<span className="max-w-28 truncate text-center text-xs text-muted-foreground">
						{selfDisplayName}
					</span>
				</div>

				{
					others
						.filter((participant) => {
							if (!isRevealed) {
								return participant.hasVoted;
							}

							return true;
						})
						.map((participant, index) => {
							const key = `${participant.displayName}-${index}`;
							const showFaceDown = participant.hasVoted && !isRevealed;
							const showFaceUp = isRevealed;
							const revealedValue = participant.vote && participant.vote !== ''
								? participant.vote
								: '—';

							let cardContent: ReactNode = null;

							if (showFaceUp) {
								cardContent = (
									<div className="w-full animate-table-card-in">
										<VotingCard
											value={revealedValue}
											disabled
											tabIndex={-1}
											className="w-full shadow-md"
										/>
									</div>
								);
							} else if (showFaceDown) {
								cardContent = (
									<FaceDownCard className="animate-table-card-in" />
								);
							}

							return (
								<div key={key} className="flex flex-col items-center gap-2">
									<div className="flex min-h-42 w-24 items-end justify-center sm:min-h-46 sm:w-28">
										{cardContent}
									</div>
									<span className="max-w-28 truncate text-center text-xs text-muted-foreground">
										{participant.displayName}
									</span>
								</div>
							);
						})
				}
			</div>
		</div>
	);
});
