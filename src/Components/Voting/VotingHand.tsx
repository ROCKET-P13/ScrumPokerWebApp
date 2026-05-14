import { memo, useState } from 'react';

import { DefaultVoteOptions } from '@/Common/DefaultVoteOptions';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

import { SelfVoteCard } from './SelfVoteCard';

interface VotingHandProps {
	currentVote: string;
	disabled: boolean;
	onSelect: (value: string) => void;
	registerCardRef?: (value: string, element: HTMLButtonElement | null) => void;
	suppressHandCardValue?: string | null;
	/** Keeps these values visually lifted (same as selected) while their flight overlay runs */
	liftDuringFlightForValues?: readonly string[];
	/** While true: no hover lift (stable layout for flight) and hand ignores input */
	interactionLocked?: boolean;
	/** While true: lift transform uses transition-none during overlay flights; input still gated by interactionLocked */
	suppressHandLiftTransition?: boolean;
	className?: string;
};

export const VotingHand = memo((
	{
		currentVote,
		disabled,
		onSelect,
		registerCardRef,
		suppressHandCardValue = null,
		liftDuringFlightForValues = [],
		interactionLocked = false,
		suppressHandLiftTransition = false,
		className = '',
	}: VotingHandProps
) => {
	const [hoverSuppressedIndex, setHoverSuppressedIndex] = useState<number | null>(null);

	return (
		<div
			className={
				mergeTailwindClasses(
					`pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center
					bg-linear-to-t from-background from-50% to-transparent
					pb-[calc(1.25rem+env(safe-area-inset-bottom,0))] pt-12`,
					className
				)
			}
		>
			<div
				className='pointer-events-auto mx-auto w-full max-w-5xl overflow-x-auto px-2 pb-2 scrollbar-hidden sm:px-4'
				role="group"
				aria-label="Planning poker values"
			>
				<div
					className={
						mergeTailwindClasses(
							'flex min-h-48 items-end justify-center sm:min-h-56',
							interactionLocked ? 'pointer-events-none' : ''
						)
					}
				>
					{
						DefaultVoteOptions.map((value, index) => {
							const isSelected = currentVote === value;
							const hideForFlight = suppressHandCardValue === value;
							const liftForFlightOverlay = liftDuringFlightForValues.includes(value);

							let liftOrHoverClass = '';
							if (isSelected || liftForFlightOverlay) {
								liftOrHoverClass = `-translate-y-16 sm:-translate-y-18 brightness-[1.03] dark:brightness-110`;
							}

							if (
								!interactionLocked
								&& !isSelected
								&& !liftForFlightOverlay
								&& !disabled
								&& hoverSuppressedIndex !== index
							) {
								liftOrHoverClass = `hover:-translate-y-16 sm:hover:-translate-y-18 hover:brightness-[1.03] dark:hover:brightness-110`;
							}

							return (
								<div
									key={value}
									onMouseLeave={() => {
										setHoverSuppressedIndex((prev) => (prev === index ? null : prev));
									}}
									className={
										mergeTailwindClasses(
											'relative shrink-0 ease-out motion-reduce:transition-none',
											suppressHandLiftTransition
												? 'transition-none'
												: 'transition-transform duration-300',
											liftOrHoverClass,
											index !== 0 ? 'max-sm:-ml-6 -ml-8 sm:-ml-8' : ''
										)
									}
								>
									<div
										className={
											mergeTailwindClasses(
												'transition-none',
												hideForFlight ? 'opacity-0' : ''
											)
										}
									>
										<SelfVoteCard
											ref={(cardButtonElement) => {
												registerCardRef?.(value, cardButtonElement);
											}}
											mode="hand"
											value={value}
											isSelected={isSelected}
											variant={isSelected ? 'ghost' : 'default'}
											disabled={disabled}
											onClick={() => {
												if (isSelected) {
													setHoverSuppressedIndex(index);
												}

												onSelect(value);
											}}
											className="w-20 sm:w-26"
										/>
									</div>
								</div>
							);
						})
					}
				</div>
			</div>
		</div>
	);
});

VotingHand.displayName = 'VotingHand';
