import { Button } from '@ui/Button';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

export const VotingCard = ({ value, isSelected, onClick }) => {
	return (
		<Button
			variant={isSelected ? 'default' : 'outline'}
			size="lg"
			className={
				mergeTailwindClasses(
					'aspect-square h-auto min-h-14 w-full p-0 text-lg font-semibold',
					isSelected ? 'ring-2 ring-ring ring-offset-2 ring-offset-background' : ''
				)
			}
			onClick={onClick}
		>
			{value}
		</Button>
	);
};