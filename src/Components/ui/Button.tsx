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
  focus:outline-none
  focus:ring-2
  focus:ring-ring
  focus:ring-offset-2
  font-bold
  cursor-pointer
`;

const Variants = {
	default: `
		bg-primary
		text-primary-foreground
		hover:opacity-90
  	`,
	secondary: `
		bg-secondary
		text-secondary-foreground
		hover:opacity-80
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
		hover:opacity-90
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
							? 'opacity-50 cursor-not-allowed hover:opacity-50 hover:bg-none'
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