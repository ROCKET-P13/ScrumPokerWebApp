import { memo } from 'react';

import { GatherDeckPhase } from '@/Common/GatherDeckPhase';

import { FlippableFaceDownVoteCard } from './FlippableFaceDownVoteCard';
import { VotingCard } from './VotingCard';

export type PeerVoteCardProps =
	| {
		mode: 'table-flip';
		isRevealed: boolean;
		revealedValue: string;
		isExiting: boolean;
		prefersReducedMotion: boolean | null;
		gatherDeckPhase?: GatherDeckPhase | null;
	}
	| {
		mode: 'table-revealed-static';
		revealedValue: string;
	};

export const PeerVoteCard = memo((props: PeerVoteCardProps) => {
	if (props.mode === 'table-revealed-static') {
		return (
			<div className="w-full animate-table-card-in">
				<VotingCard
					value={props.revealedValue}
					disabled
					tabIndex={-1}
					className="w-full shadow-md"
				/>
			</div>
		);
	}

	return (
		<FlippableFaceDownVoteCard
			isRevealed={props.isRevealed}
			revealedValue={props.revealedValue}
			isExiting={props.isExiting}
			prefersReducedMotion={props.prefersReducedMotion}
			frontFaceSelected={false}
			showFrontFaceWhileConcealed={false}
			tableSlotSuppressedForFlight={false}
			gatherDeckPhase={props.gatherDeckPhase ?? null}
		/>
	);
});

PeerVoteCard.displayName = 'PeerVoteCard';
