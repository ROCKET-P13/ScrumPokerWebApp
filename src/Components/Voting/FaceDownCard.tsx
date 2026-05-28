import { memo } from 'react';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

export const FaceDownCard = memo(({ className = '' }: { className?: string }) => {
	return (
		<div
			className={
				mergeTailwindClasses(
					`relative flex aspect-5/7 w-24 shrink-0 flex-col overflow-hidden rounded-(--radius)
					border border-border bg-card
					sm:w-28`,
					className
				)
			}
		>
			<div
				className="pointer-events-none absolute inset-2 rounded-md border border-border/40 bg-background/20"
				aria-hidden
			/>
			<div className="pointer-events-none relative z-10 flex flex-1 items-center justify-center p-2">
				<div
					className="h-10 w-10 rounded-full border-2 border-primary/50 bg-primary/20"
				/>
			</div>
		</div>
	);
});

FaceDownCard.displayName = 'FaceDownCard';
