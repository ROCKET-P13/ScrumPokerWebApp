import { forwardRef, useMemo } from 'react';

import { VotingCardSpectrumFlight } from '@/Common/VotingCardSpectrumFlight';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

type StandardVisualState = 'ghost' | 'selected' | 'default';

const SpectrumToneClasses: Record<VotingCardSpectrumFlight, string> = {
	[VotingCardSpectrumFlight.TO_SELECTED]: 'border-border bg-card text-card-foreground animate-voting-card-spectrum-to-selected',
	[VotingCardSpectrumFlight.TO_DEFAULT]: 'border-primary bg-primary text-primary-foreground animate-voting-card-spectrum-to-default',
};

const StandardToneClasses: Record<StandardVisualState, string> = {
	ghost: 'scale-[0.97] border-dashed border-muted-foreground/40 bg-muted/35 text-muted-foreground',
	selected: 'border-primary bg-primary text-primary-foreground',
	default: 'border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground',
};

const SpectrumCornerToneClass = 'text-inherit opacity-90';

const StandardCornerToneClasses: Record<StandardVisualState, string> = {
	ghost: 'text-muted-foreground/90',
	selected: 'text-primary-foreground/90',
	default: 'text-muted-foreground group-hover:text-accent-foreground',
};

const CenterValueToneByContext = {
	spectrum: 'text-inherit',
	ghost: 'text-muted-foreground',
	plain: '',
} as const;
export interface VotingCardProps extends Omit<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	'children'
> {
	value: string;
	isSelected?: boolean;
	/** Faded style when the physical card is represented on the table */
	variant?: 'default' | 'ghost';
	/**
	 * Hand→table: animate from default fill to primary. Table→hand: animate from primary to default.
	 * Used on flight overlay only; keep isSelected false when set.
	 */
	spectrumFlight?: VotingCardSpectrumFlight;
}

export const VotingCard = forwardRef<HTMLButtonElement, VotingCardProps>(
	(
		{
			className = '',
			value,
			isSelected = false,
			disabled = false,
			variant = 'default',
			spectrumFlight,
			onClick,
			...props
		},
		ref
	) => {
		const isInteractive = !disabled;
		const isGhost = variant === 'ghost';
		const spectrumMode = spectrumFlight != null;
		const standardVisualState = useMemo(() => {
			if (isGhost) {
				return 'ghost';
			}
			if (isSelected) {
				return 'selected';
			}
			return 'default';
		}, [isGhost, isSelected]);

		const toneClass = spectrumFlight != null
			? SpectrumToneClasses[spectrumFlight]
			: StandardToneClasses[standardVisualState];

		const cornerColorClass = spectrumMode
			? SpectrumCornerToneClass
			: StandardCornerToneClasses[standardVisualState];

		const toneContext = useMemo(() => {
			if (spectrumMode) {
				return 'spectrum';
			}
			if (isGhost) {
				return 'ghost';
			}
			return 'plain';
		}, [spectrumMode, isGhost]);

		const centerToneClass
			= CenterValueToneByContext[toneContext];

		return (
			<button
				ref={ref}
				type="button"
				aria-pressed={isSelected}
				disabled={disabled}
				className={
					mergeTailwindClasses(
						`group relative flex aspect-5/7 w-full min-h-0 flex-col overflow-hidden
						rounded-lg border text-center
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
						focus-visible:ring-offset-2 focus-visible:ring-offset-background`,
						spectrumMode ? 'transition-none' : 'transition-all duration-200',
						toneClass,
						disabled
							? 'cursor-not-allowed'
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
							cornerColorClass
						)
					}
					aria-hidden
				>
					{value}
				</span>
				<span
					className={
						mergeTailwindClasses(
							'flex flex-1 items-center justify-center px-2 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl',
							centerToneClass
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
							cornerColorClass
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
