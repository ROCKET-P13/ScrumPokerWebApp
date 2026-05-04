import { Button } from '@ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/Card';

import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

export const DEFAULT_VOTE_VALUES = [
	'0',
	'½',
	'1',
	'2',
	'3',
	'5',
	'8',
	'13',
	'21',
	'?',
	'☕',
] as const;

type VotingCardsProps = {
	values?: readonly string[];
	selectedValue: string | null;
	onSelect: (value: string) => void;
	disabled?: boolean;
	isSubmitting?: boolean;
};

function voteCardClasses (isSelected: boolean): string {
	let ring = '';
	if (isSelected) {
		ring = 'ring-2 ring-ring ring-offset-2 ring-offset-background';
	}
	return mergeTailwindClasses(
		'aspect-square h-auto min-h-14 w-full p-0 text-lg font-semibold',
		ring
	);
}

function voteCardVariant (isSelected: boolean): 'default' | 'outline' {
	if (isSelected) {
		return 'default';
	}
	return 'outline';
}

export const VotingCards = ({
	values = DEFAULT_VOTE_VALUES,
	selectedValue,
	onSelect,
	disabled = false,
	isSubmitting = false,
}: VotingCardsProps) => {
	const busy = disabled || isSubmitting;

	return (
		<Card className="h-full">
			<CardHeader className="px-6">
				<CardTitle className="text-base">Your vote</CardTitle>
				<CardDescription>Pick a card to submit your estimate for this round.</CardDescription>
			</CardHeader>
			<CardContent className="px-6">
				<div
					className="grid grid-cols-4 gap-2 sm:grid-cols-6"
					role="group"
					aria-label="Planning poker values"
				>
					{values.map((value) => {
						const isSelected = selectedValue === value;

						return (
							<Button
								key={value}
								type="button"
								variant={voteCardVariant(isSelected)}
								size="lg"
								disabled={busy}
								className={voteCardClasses(isSelected)}
								onClick={() => onSelect(value)}
								aria-pressed={isSelected}
							>
								{value}
							</Button>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
};
