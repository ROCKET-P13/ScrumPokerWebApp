import { memo, useRef } from 'react';

import { VoteCardFlightDirection } from '@/Common/VoteCardFlightDirection';
import { VotingCardSpectrumFlight } from '@/Common/VotingCardSpectrumFlight';
import { SelfVoteCard } from '@/Components/Voting/SelfVoteCard';
import { useVoteCardFlightTranslate } from '@/hooks/animations';
import {
	getVoteCardFlightFixedLayerStyle,
	getVoteCardFlightTranslationPixels
} from '@/utils/voteFlightGeometry';

export const VoteCardFlightOverlay = memo(({
	voteOptionValue,
	sourceBoundingRect,
	destinationBoundingRect,
	direction,
	reducedMotion,
	onFlightComplete,
}: {
	voteOptionValue: string;
	sourceBoundingRect: DOMRect;
	destinationBoundingRect: DOMRect;
	direction: VoteCardFlightDirection;
	reducedMotion: boolean;
	onFlightComplete: () => void;
}) => {
	const layerRef = useRef<HTMLDivElement>(null);

	const { translationXPixels, translationYPixels } = getVoteCardFlightTranslationPixels(
		sourceBoundingRect,
		destinationBoundingRect
	);

	useVoteCardFlightTranslate(layerRef, {
		x: translationXPixels,
		y: translationYPixels,
		reducedMotion,
		onComplete: onFlightComplete,
	});

	return (
		<div
			ref={layerRef}
			className="pointer-events-none z-200"
			style={getVoteCardFlightFixedLayerStyle(sourceBoundingRect, destinationBoundingRect)}
		>
			<SelfVoteCard
				mode="flight-overlay"
				value={voteOptionValue}
				spectrumFlight={
					direction === VoteCardFlightDirection.TO_TABLE
						? VotingCardSpectrumFlight.TO_SELECTED
						: VotingCardSpectrumFlight.TO_DEFAULT
				}
			/>
		</div>
	);
});

VoteCardFlightOverlay.displayName = 'VoteCardFlightOverlay';
