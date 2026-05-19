import { Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Routes } from '@/Common/Routes';
import { Icon } from '@/ui/Icon';
import { Tooltip, TOOLTIP_EXIT_DURATION_MS } from '@/ui/Tooltip';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

/** How long the "Copied!" tooltip stays visible before it is forced closed. */
const COPIED_TOOLTIP_MS = 300;
/** Reset label after close animation completes (see `TOOLTIP_EXIT_DURATION_MS`). */
const COPIED_RESET_AFTER_HIDE_MS = TOOLTIP_EXIT_DURATION_MS;

export const CopyRoomLinkButton = ({ roomCode }: { roomCode: string }) => {
	const [copied, setCopied] = useState(false);
	const [tooltipCloseSignal, setTooltipCloseSignal] = useState(0);
	const copiedTimersRef = useRef<{
		hide: ReturnType<typeof setTimeout> | null;
		resetLabel: ReturnType<typeof setTimeout> | null;
	}>({ hide: null, resetLabel: null });

	useEffect(() => () => {
		const { hide, resetLabel } = copiedTimersRef.current;
		if (hide) {
			clearTimeout(hide);
		}

		if (resetLabel) {
			clearTimeout(resetLabel);
		}
	}, []);

	const handleClick = () => {
		const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
		const url = `${window.location.origin}${basePath}${Routes.ROOM}/${encodeURIComponent(roomCode)}`;

		void navigator.clipboard
			.writeText(url)
			.then(() => {
				const timers = copiedTimersRef.current;
				if (timers.hide) {
					clearTimeout(timers.hide);
				}

				if (timers.resetLabel) {
					clearTimeout(timers.resetLabel);
				}

				setCopied(true);
				timers.hide = setTimeout(() => {
					setTooltipCloseSignal((previous) => previous + 1);
					timers.hide = null;
				}, COPIED_TOOLTIP_MS);
				timers.resetLabel = setTimeout(() => {
					setCopied(false);
					timers.resetLabel = null;
				}, COPIED_TOOLTIP_MS + COPIED_RESET_AFTER_HIDE_MS);
			})
			.catch((error: unknown) => {
				console.error('Failed to copy room link', error);
			});
	};

	return (
		<Tooltip
			closeSignal={tooltipCloseSignal}
			content={copied ? 'Copied!' : 'Copy Room Link'}
			position="bottom"
			tone={copied ? 'primary' : 'default'}
		>
			<button
				type="button"
				onClick={handleClick}
				aria-label="Copy room invite link"
				className={
					mergeTailwindClasses(
						'rounded-md p-1 text-muted-foreground transition-colors',
						'hover:bg-muted hover:text-foreground hover:cursor-pointer',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
					)
				}
			>
				<Icon as={Copy} size={12} aria-hidden />
			</button>
		</Tooltip>
	);
};
