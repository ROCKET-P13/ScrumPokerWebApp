import { Copy } from 'lucide-react';
import { useState } from 'react';

import { Routes } from '@/Common/Routes';
import { Icon } from '@/ui/Icon';
import { Tooltip } from '@/ui/Tooltip';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

export const CopyRoomLinkButton = ({ roomCode }: { roomCode: string }) => {
	const [tooltipDismissSignal, setTooltipDismissSignal] = useState(0);

	const handleClick = () => {
		const url = `${window.location.origin}${Routes.ROOM}/${encodeURIComponent(roomCode)}`;

		void navigator.clipboard
			.writeText(url)
			.then(() => {
				setTooltipDismissSignal((previous) => previous + 1);
			})
			.catch((error: unknown) => {
				console.error('Failed to copy room link', error);
			});
	};

	return (
		<Tooltip
			content="Copy Room Link"
			position="bottom"
			dismissSignal={tooltipDismissSignal}
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
