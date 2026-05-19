import { Icon } from '@ui/Icon';
import { Moon, Sun } from 'lucide-react';

import { themeStore } from '@/stores/themeStore';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

export const ThemeToggle = () => {
	const theme = themeStore((state) => state.theme);
	const toggleTheme = themeStore((state) => state.toggleTheme);

	const isChecked = (theme === 'dark');

	return (
		<button
			onClick={toggleTheme}
			role="switch"
			aria-checked={isChecked}
			className={
				mergeTailwindClasses(
					'relative inline-flex shrink-0 h-5 w-10 border-2 border-transparent rounded-full cursor-pointer transition-colors focus:outline-none',
					isChecked ? 'bg-primary' : 'bg-primary'
				)
			}
		>
			<span
				className={
					mergeTailwindClasses(
						'flex justify-center items-center h-4 w-4 rounded-full bg-background transform ring-0 transition-transform',
						isChecked ? 'translate-x-5' : 'translate-x-0'
					)
				}>
				{
					isChecked
						? <Icon as={Moon} size={14} />
						: <Icon as={Sun} size={14} />
				}
			</span>

		</button>
	);
};