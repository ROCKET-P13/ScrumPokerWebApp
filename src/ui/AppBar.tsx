import { HTMLAttributes } from 'react';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

const AppBar = (
	{
		className = '',
		children,
		...props
	} : HTMLAttributes<HTMLElement>) => {
	return (
		<header
			className={
				mergeTailwindClasses(
					'top-0 z-40 w-full',
					'border-b border-border',
					'bg-background/80',
					'backdrop-blur supports-backdrop-filter:bg-background/60',
					className
				)
			}
			{...props}
		>
			<div className="flex h-14 items-center px-4 md:px-6">
				{children}
			</div>
		</header>

	);
};

const AppBarLeft = (
	{
		className = '',
		...props
	} : HTMLAttributes<HTMLDivElement>
) => {
	return (
		<div
			className={mergeTailwindClasses('flex justify-start gap-2', className)}
			{...props}
		/>
	);
};

const AppBarCenter = (
	{
		className = '',
		...props
	} : HTMLAttributes<HTMLDivElement>
) => {
	return (
		<div
			className={mergeTailwindClasses(
				'flex flex-1 items-center justify-end',
				className
			)}
			{...props}
		/>
	);
};

const AppBarRight = (
	{
		className = '',
		...props
	} : HTMLAttributes<HTMLDivElement>
) => {
	return (
		<div
			className={mergeTailwindClasses(
				'flex flex-1 items-center justify-end gap-2',
				className
			)}
			{...props}
		/>
	);
};

const AppBarTitle = (
	{
		className = '',
		...props
	} : HTMLAttributes<HTMLHeadingElement>
) => {
	return (
		<h1
			className={mergeTailwindClasses(
				'text-sm font-semibold tracking-tight',
				className
			)}
			{...props}
		/>
	);
};
export {
	AppBar,
	AppBarLeft,
	AppBarCenter,
	AppBarRight,
	AppBarTitle
};