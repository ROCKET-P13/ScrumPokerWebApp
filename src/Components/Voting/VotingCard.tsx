import { forwardRef } from 'react';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

export interface VotingCardProps extends Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	'children'
> {
	value: string;
	isSelected?: boolean;
}

export const VotingCard = forwardRef<HTMLButtonElement, VotingCardProps>(
	(
		{
			className = '',
			value,
			isSelected = false,
			disabled = false,
			onClick,
			...props
		},
		ref
	) => {
		const isInteractive = !disabled;

		return (
			<button
				ref={ref}
				type="button"
				aria-pressed={isSelected}
				disabled={disabled}
				className={
					mergeTailwindClasses(
						`group relative flex aspect-5/7 w-full min-h-0 flex-col overflow-hidden
						rounded-(--radius) border text-center transition-all duration-200
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
						focus-visible:ring-offset-2 focus-visible:ring-offset-background`,
						isSelected
							? `border-primary bg-primary text-primary-foreground`
							: `border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground`,
						disabled
							? 'cursor-not-allowed opacity-60'
							: 'cursor-pointer',
						className
					)
				}
				onClick={(e) => {
					if (!isInteractive) {
						return;
					}

					onClick?.(e);
				}}
				{...props}
			>
				<span
					className={
						mergeTailwindClasses(
							'pointer-events-none absolute left-2 top-2 select-none font-semibold leading-none',
							isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground group-hover:text-accent-foreground'
						)
					}
					aria-hidden
				>
					{value}
				</span>
				<span
					className={
						mergeTailwindClasses(
							'flex flex-1 items-center justify-center px-2 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl'
						)
					}
				>
					{value}
				</span>
				<span
					className={
						mergeTailwindClasses(
							`pointer-events-none absolute bottom-2 right-2 rotate-180 select-none font-semibold
							leading-none`,
							isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground group-hover:text-accent-foreground'
						)
					}
					aria-hidden
				>
					{value}
				</span>
			</button>
		);
	}
);

VotingCard.displayName = 'VotingCard';
