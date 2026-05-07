import { useState } from 'react';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

import { VotingCard } from './VotingCard';

interface VotingHandProps {
	values: readonly string[];
	currentVote: string;
	disabled: boolean;
	onSelect: (value: string) => void;
	className?: string;
};

const OVERLAP_SM = 'max-sm:-ml-6';
const OVERLAP_DEFAULT = '-ml-8 sm:-ml-8';

export const VotingHand = (
	{
		values,
		currentVote,
		disabled,
		onSelect,
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
					pb-[calc(1.25rem+env(safe-area-inset-bottom,0))] pt-24`,
					className
				)
			}
		>
			<div
				className={
					mergeTailwindClasses(
						`pointer-events-auto mx-auto w-full max-w-5xl overflow-x-auto px-2 pb-2 scrollbar-hidden sm:px-4`
					)
				}
				role="group"
				aria-label="Planning poker values"
			>
				<div
					className={
						mergeTailwindClasses(
							'flex min-h-48 items-end justify-center sm:min-h-56'
						)
					}
				>
					{
						values.map((value, index) => {
							const isSelected = currentVote === value;

							let liftOrHoverClass = '';
							if (isSelected) {
								liftOrHoverClass = `-translate-y-16 sm:-translate-y-18 brightness-[1.03] dark:brightness-110`;
							}

							if (!isSelected && !disabled && hoverSuppressedIndex !== index) {
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
											'relative shrink-0 transition-all duration-300 ease-out',
											liftOrHoverClass,
											index === 0 ? '' : mergeTailwindClasses(OVERLAP_SM, OVERLAP_DEFAULT)
										)
									}
								>
									<VotingCard
										value={value}
										isSelected={isSelected}
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
							);
						})
					}
				</div>
			</div>
		</div>
	);
};
