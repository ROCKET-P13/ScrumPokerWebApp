import { Button } from '@ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/Card';
import { useState } from 'react';

import { useSendVote } from '@/hooks/useSendVote';
import { mergeTailwindClasses } from '@/utils/mergeTailwindClasses';

const DefaultVoteOptions = [
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
];

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

export const VotingCards = () => {
	const { mutateAsync: sendVote } = useSendVote();
	const [vote, setVote] = useState('');

	const handleSelectVote = async (value: string) => {
		setVote(value);
		await sendVote({ vote: value });
	};
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
					{
						DefaultVoteOptions.map((value) => {
							const isSelected = vote === value;
							return (
								<Button
									key={value}
									type="button"
									variant={isSelected ? 'default' : 'outline'}
									size="lg"
									className={voteCardClasses(isSelected)}
									onClick={async () => {
										await handleSelectVote(value);
									}}
									aria-pressed={isSelected}
								>
									{value}
								</Button>
							);
						})
					}
				</div>
			</CardContent>
		</Card>
	);
};
