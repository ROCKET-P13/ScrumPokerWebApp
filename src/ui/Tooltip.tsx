import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';
type TooltipProps = {
	content: string;
	children: ReactNode;
	position?: 'top' | 'bottom' | 'left' | 'right';
	delay?: number;
	disabled?: boolean;
	className?: string;
	/** When this number increases, the tooltip is dismissed (e.g. after an action) even if the trigger stays hovered. */
	dismissSignal?: number;
};

const ArrowPositions = Object.freeze({
	top: 'bottom-[-4px] left-1/2 -translate-x-1/2 rotate-45 border-t-0 border-l-0',
	bottom: 'top-[-4px] left-1/2 -translate-x-1/2 rotate-45 border-b-0 border-r-0',
	left: 'right-[-4px] top-1/2 -translate-y-1/2 rotate-45 border-b-0 border-l-0',
	right: 'left-[-4px] top-1/2 -translate-y-1/2 rotate-45 border-t-0 border-r-0',
});

const TransformClasses = Object.freeze({
	top: '-translate-x-1/2 -translate-y-full',
	bottom: '-translate-x-1/2 translate-y-0',
	left: '-translate-x-full -translate-y-1/2',
	right: 'translate-x-0 -translate-y-1/2',
});

export const Tooltip = (
	{
		content,
		children,
		position = 'top',
		delay = 150,
		disabled = false,
		className = '',
		dismissSignal = 0,
	}: TooltipProps
) => {
	const [visible, setVisible] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
	const triggerRef = useRef<HTMLDivElement | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const hide = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		setVisible(false);
		setTimeout(() => setMounted(false), delay);
	}, [delay]);

	const show = () => {
		if (disabled || !triggerRef.current) {
			return;
		}

		const rect = triggerRef.current.getBoundingClientRect();
		const spacing = 8;
		const positions = {
			top: {
				top: rect.top - spacing,
				left: rect.left + rect.width / 2,
			},
			bottom: {
				top: rect.bottom + spacing,
				left: rect.left + rect.width / 2,
			},
			left: {
				top: rect.top + rect.height / 2,
				left: rect.left - spacing,
			},
			right: {
				top: rect.top + rect.height / 2,
				left: rect.right + spacing,
			},
		};

		setCoords(positions[position]);
		setMounted(true);
		timeoutRef.current = setTimeout(() => setVisible(true), delay);
	};

	useEffect(() => {
		if (dismissSignal === 0) {
			return;
		}

		queueMicrotask(() => {
			hide();
		});
	}, [dismissSignal, hide]);

	useEffect(() => () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
	}, []);

	return (
		<>
			<div
				ref={triggerRef}
				className="inline-flex"
				onMouseEnter={show}
				onMouseLeave={hide}
				onFocus={show}
				onBlur={hide}
			>
				{children}
			</div>

			{mounted && coords
				&& createPortal(
					<div
						role="tooltip"
						className={
							mergeTailwindClasses(
								'z-50 absolute rounded-md border px-2 py-1 text-xs shadow-sm backdrop-blur-sm bg-popover/95 text-popover-foreground border-border',
								TransformClasses[position],
								visible
									? 'opacity-100 scale-100 transition duration-150 ease-out'
									: 'opacity-0 scale-95 pointer-events-none transition duration-150 ease-in',
								className
							)
						}
						style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
					>
						<div
							className={
								mergeTailwindClasses(
									'absolute h-2 w-2 bg-popover border border-border z-40',
									ArrowPositions[position]
								)
							}
						/>
						<p className='font-xs'>
							{content}
						</p>
					</div>,
					document.getElementById('root') as HTMLElement
				)}
		</>
	);
};