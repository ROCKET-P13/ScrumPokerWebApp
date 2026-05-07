import type { ReactNode, RefObject } from 'react';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

import { VotingCard } from './VotingCard';

export function SelfVoteStack ({
	selfVoteDisplay,
	hideSelfTableCard,
	selfCardRef,
	isRevealed,
}: {
	selfVoteDisplay: string;
	hideSelfTableCard: boolean;
	selfCardRef: RefObject<HTMLDivElement | null>;
	isRevealed: boolean;
}): ReactNode {
	if (isRevealed) {
		const revealedFace = selfVoteDisplay === '' ? '—' : selfVoteDisplay;

		return (
			<div ref={selfCardRef} className="w-full">
				<VotingCard
					value={revealedFace}
					disabled
					tabIndex={-1}
					className="w-full shadow-md"
				/>
			</div>
		);
	}

	if (selfVoteDisplay) {
		return (
			<div ref={selfCardRef} className="w-full">
				<VotingCard
					value={selfVoteDisplay}
					isSelected
					disabled
					tabIndex={-1}
					aria-hidden={hideSelfTableCard}
					className={
						mergeTailwindClasses(
							// Instant opacity when swapping flight overlay ↔ table card (avoid transition-all fade)
							'w-full shadow-md transition-none',
							hideSelfTableCard ? 'pointer-events-none opacity-0' : ''
						)
					}
				/>
			</div>
		);
	}

	return null;
}
