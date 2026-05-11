import { memo, useRef } from 'react';

import { VoteCardFlightDirection } from '@/Common/VoteCardFlightDirection';
import { VotingCardSpectrumFlight } from '@/Common/VotingCardSpectrumFlight';
import { VotingCard } from '@/Components/Voting/VotingCard';
import { useVoteCardFlightTranslate } from '@/hooks/animations';
import {
	getVoteCardFlightFixedLayerStyle,
	getVoteCardFlightTranslationPixels
} from '@/utils/voteFlightGeometry';

export const VoteCardFlightOverlay = memo(function VoteCardFlightOverlay ({
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
}) {
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
			<VotingCard
				value={voteOptionValue}
				isSelected={false}
				spectrumFlight={
					direction === VoteCardFlightDirection.TO_TABLE
						? VotingCardSpectrumFlight.TO_SELECTED
						: VotingCardSpectrumFlight.TO_DEFAULT
				}
				disabled
				tabIndex={-1}
				className="h-full w-full shadow-lg"
			/>
		</div>
	);
});
