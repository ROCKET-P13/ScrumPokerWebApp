import { forwardRef } from 'react';

import { VotingCardSpectrumFlight } from '@/Common/VotingCardSpectrumFlight';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

import { FlippableFaceDownVoteCard } from './FlippableFaceDownVoteCard';
import { VotingCard } from './VotingCard';

export type SelfVoteCardProps =
	| {
		mode: 'hand';
		value: string;
		isSelected: boolean;
		variant: 'default' | 'ghost';
		disabled: boolean;
		onClick: () => void;
		className?: string;
	}
	| {
		mode: 'table-flip';
		isRevealed: boolean;
		revealedValue: string;
		isExiting: boolean;
		prefersReducedMotion: boolean | null;
		selfVoteDisplay: string;
		hideSelfTableCard: boolean;
		slotRef: React.RefObject<HTMLDivElement | null>;
		cardRef: React.RefObject<HTMLDivElement | null>;
		wrapperClassName: string;
	}
	| {
		mode: 'table-revealed-static';
		revealedValue: string;
		slotRef: React.RefObject<HTMLDivElement | null>;
		cardRef: React.RefObject<HTMLDivElement | null>;
		wrapperClassName: string;
	}
	| {
		mode: 'flight-overlay';
		value: string;
		spectrumFlight: VotingCardSpectrumFlight;
		className?: string;
	};

export const SelfVoteCard = forwardRef<HTMLButtonElement, SelfVoteCardProps>(
	(props, ref) => {
		if (props.mode === 'hand') {
			return (
				<VotingCard
					ref={ref}
					value={props.value}
					isSelected={props.isSelected}
					variant={props.variant}
					disabled={props.disabled}
					onClick={props.onClick}
					className={props.className}
				/>
			);
		}

		if (props.mode === 'flight-overlay') {
			return (
				<VotingCard
					ref={ref}
					value={props.value}
					isSelected={false}
					spectrumFlight={props.spectrumFlight}
					disabled
					tabIndex={-1}
					className={mergeTailwindClasses('h-full w-full shadow-lg', props.className || '')}
				/>
			);
		}

		if (props.mode === 'table-revealed-static') {
			return (
				<div ref={props.slotRef} className="w-full">
					<div ref={props.cardRef} className={props.wrapperClassName}>
						<div className="w-full animate-table-card-in">
							<VotingCard
								value={props.revealedValue}
								disabled
								tabIndex={-1}
								className="w-full shadow-md"
							/>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div ref={props.slotRef} className="w-full">
				<div ref={props.cardRef} className={props.wrapperClassName}>
					<FlippableFaceDownVoteCard
						isRevealed={props.isRevealed}
						revealedValue={props.revealedValue}
						isExiting={props.isExiting}
						prefersReducedMotion={props.prefersReducedMotion}
						frontFaceSelected={Boolean(props.selfVoteDisplay)}
						showFrontFaceWhileConcealed={Boolean(props.selfVoteDisplay)}
						tableSlotSuppressedForFlight={props.hideSelfTableCard}
					/>
				</div>
			</div>
		);
	}
);

SelfVoteCard.displayName = 'SelfVoteCard';
