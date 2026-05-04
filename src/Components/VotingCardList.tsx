import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/Card';
import { useState } from 'react';

import { VotingCard } from '@/Components/VotingCard';
import { useSendVote } from '@/hooks/useSendVote';

const DefaultVoteOptions = [
	'0',
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

export const VotingCardList = () => {
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
						DefaultVoteOptions.map((value) => (
							<VotingCard
								key={value}
								value={value}
								isSelected={vote === value}
								onClick={async () => await handleSelectVote(value)}
							/>
						))
					}
				</div>
			</CardContent>
		</Card>
	);
};
