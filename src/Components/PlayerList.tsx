/* eslint-disable no-nested-ternary */

import { Participant } from '@/types/Participant';

type Props = {
  participants: Participant[];
  isRevealed: boolean;
};

export const PlayerList = ({ participants, isRevealed }: Props) => {
	return (
		<div style={{ marginTop: 20 }}>
			<h2>Players</h2>

			{participants.map((p, index) => {
				const hasVoted = !!p.vote;

				return (
					<div
						key={index}
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							padding: 8,
							borderBottom: '1px solid #eee',
						}}
					>
						<span>{p.displayName}</span>

						<span>
							{isRevealed
								? p.vote ?? '-'
								: hasVoted
									? '✔'
									: '…'}
						</span>
					</div>
				);
			})}
		</div>
	);
};