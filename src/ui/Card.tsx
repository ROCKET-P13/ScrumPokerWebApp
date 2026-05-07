import { forwardRef, HTMLAttributes } from 'react';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	(
		{
			className = '',
			...props
		},
		ref
	) => {
		return (
			<div
				ref={ref}
				data-slot="card"
				className={
					mergeTailwindClasses(
					`w-full
					rounded-xl
					border
					border-border
					bg-card
					text-card-foreground
					`,
					className
					)
				}
				{...props}
			/>
		);
	}
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	(
		{
			className = '',
			...props
		},
		ref
	) => {
		return (
			<div
				ref={ref}
				data-slot="card-header"
				className={mergeTailwindClasses('flex flex-col space-y-2 py-4', className)}
				{...props}
			/>
		);
	}
);

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
	(
		{
			className = '',
			...props
		},
		ref
	) => {
		return (
			<h3
				ref={ref}
				data-slot="card-title"
				className={
					mergeTailwindClasses(
						'text-lg font-semibold leading-none tracking-tight',
						className
					)
				}
				{...props}
			/>
		);
	}
);

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
	(
		{
			className = '',
			...props
		},
		ref
	) => {
		return (
			<p
				ref={ref}
				data-slot="card-description"
				className={mergeTailwindClasses('text-sm text-muted-foreground', className)}
				{...props}
			/>
		);
	}
);

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	(
		{
			className = '',
			...props
		},
		ref
	) => {
		return (
			<div
				ref={ref}
				data-slot="card-content"
				className={mergeTailwindClasses('p-6 pt-0', className)}
				{...props}
			/>
		);
	}
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
	(
		{
			className = '',
			...props
		},
		ref
	) => {
		return (
			<div
				ref={ref}
				data-slot="card-footer"
				className={mergeTailwindClasses('flex items-center border-border gap-4 p-6 pt-4', className)}
				{...props}
			/>
		);
	}
);

CardFooter.displayName = 'CardFooter';

export {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter
};
