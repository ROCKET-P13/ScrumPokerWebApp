import { Participant } from '@/types/Participant';

export function sortParticipantsByVoteArrival (
	participants: Participant[],
	voteArrivalOrderByDisplayName: ReadonlyMap<string, number>
): Participant[] {
	return [...participants].sort((leftParticipant, rightParticipant) => {
		const leftOrderIndex = voteArrivalOrderByDisplayName.get(leftParticipant.displayName) ?? 9_999;
		const rightOrderIndex = voteArrivalOrderByDisplayName.get(rightParticipant.displayName) ?? 9_999;

		if (leftOrderIndex !== rightOrderIndex) {
			return leftOrderIndex - rightOrderIndex;
		}

		return leftParticipant.displayName.localeCompare(rightParticipant.displayName);
	});
}
