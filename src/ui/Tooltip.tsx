import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

/** Must match `duration-[…ms]` on the bubble — portal stays mounted until this elapses after `hide()`. */
export const TOOLTIP_EXIT_DURATION_MS = 240;

type TooltipTone = 'default' | 'primary';

type TooltipProps = {
	content: string;
	children: ReactNode;
	position?: 'top' | 'bottom' | 'left' | 'right';
	delay?: number;
	disabled?: boolean;
	className?: string;
	tone?: TooltipTone;
	/** When this value increases, the tooltip hides immediately (e.g. after an action). */
	closeSignal?: number;
};

const ToneSurfaceClasses : Record<TooltipTone, string> = {
	default: 'bg-popover text-popover-foreground border-border',
	primary: 'bg-primary text-primary-foreground border-primary',
};

const ToneArrowClasses : Record<TooltipTone, string> = {
	default: 'bg-popover border-border',
	primary: 'bg-primary border-primary',
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
		tone = 'default',
		closeSignal = 0,
	}: TooltipProps
) => {
	const [visible, setVisible] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
	const triggerRef = useRef<HTMLDivElement | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const unmountAfterHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const hide = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		if (unmountAfterHideTimeoutRef.current) {
			clearTimeout(unmountAfterHideTimeoutRef.current);
			unmountAfterHideTimeoutRef.current = null;
		}

		setVisible(false);
		unmountAfterHideTimeoutRef.current = setTimeout(() => {
			setMounted(false);
			unmountAfterHideTimeoutRef.current = null;
		}, TOOLTIP_EXIT_DURATION_MS);
	}, []);

	const show = useCallback(() => {
		if (disabled || !triggerRef.current) {
			return;
		}

		if (unmountAfterHideTimeoutRef.current) {
			clearTimeout(unmountAfterHideTimeoutRef.current);
			unmountAfterHideTimeoutRef.current = null;
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
	}, [disabled, triggerRef, delay, position]);

	useEffect(() => {
		if (closeSignal === 0) {
			return;
		}

		queueMicrotask(() => {
			hide();
		});
	}, [closeSignal, hide]);

	useEffect(() => () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		if (unmountAfterHideTimeoutRef.current) {
			clearTimeout(unmountAfterHideTimeoutRef.current);
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
								'z-50 absolute rounded-md border px-2 py-1 text-xs shadow-sm',
								'translate-z-0 transition-[opacity,transform]',
								ToneSurfaceClasses[tone],
								TransformClasses[position],
								visible
									? 'opacity-100 scale-100 ease-out'
									: 'pointer-events-none opacity-0 scale-[0.97] ease-in-out',
								className
							)
						}
						style={{
							top: `${coords.top}px`,
							left: `${coords.left}px`,
							transitionDuration: `${TOOLTIP_EXIT_DURATION_MS}ms`,
						}}
					>
						<div
							className={
								mergeTailwindClasses(
									'absolute h-2 w-2 border z-40',
									ToneArrowClasses[tone],
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
