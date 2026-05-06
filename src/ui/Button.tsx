import { forwardRef } from 'react';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

const baseStyles : string = `
  inline-flex
  items-center
  justify-center
  text-sm
  font-medium
  h-10
  px-4
  py-2
  rounded-[var(--radius)]
  transition-colors
  duration-200
  ease-in-out
  focus:outline-none
  font-bold
  cursor-pointer
`;

const Variants = {
	default: `
		bg-primary
		text-primary-foreground
		hover:bg-primary/90
  	`,
	secondary: `
		bg-secondary
		text-secondary-foreground
		hover:bg-secondary/80
  	`,
	outline: `
		border border-border
		bg-transparent
		hover:bg-accent
  	`,
	ghost: `
		hover:bg-accent
  	`,
	destructive: `
		bg-destructive
		text-destructive-foreground
		hover:bg-destructive/90
  	`,
} as const;

const Sizes = {
	sm: 'h-8 px-3 text-xs',
	md: 'h-10 px-4 py-2',
	lg: 'h-12 px-6 text-base',
	icon: 'h-10 w-10',
} as const;

type Variant = keyof typeof Variants
type Size = keyof typeof Sizes

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant,
	size?: Size,
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className = '',
			variant = 'default',
			size = 'md',
			disabled = false,
			children,
			onClick,
			...props
		},
		ref
	) => {
		return (
			<button
				ref={ref}
				className={
					mergeTailwindClasses(
						baseStyles,
						Variants[variant],
						Sizes[size],
						disabled
							? 'bg-muted text-muted-foreground opacity-100 cursor-not-allowed pointer-events-none'
							: '',
						className
					)
				}
				onClick={(e) => {
					if (disabled) {
						return;
					}

					onClick?.(e);
				}}
				{...props}
			>
				{children}
			</button>
		);
	}
);

Button.displayName = 'Button';