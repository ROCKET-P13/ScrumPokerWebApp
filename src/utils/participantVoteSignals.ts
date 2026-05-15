import { Participant } from '@/types/Participant';

/** Whether the participant currently contributes a vote signal on the table (vote cast or stored value). */
export const participantShowsVoteSignal = (participant: Participant): boolean => {
	return participant.hasVoted || !!(participant.vote && participant.vote !== '');
};

export const participantsSomeHaveVoteSignal = (participants: Participant[]): boolean => {
	return participants.some((participant) => participantShowsVoteSignal(participant));
};

export const participantsEveryVoteSignalCleared = (participants: Participant[]): boolean => {
	return participants.every((participant) => !participantShowsVoteSignal(participant));
};

export const participantsHasVotedFlagMap = (participants: Participant[]): Map<string, boolean> => {
	return new Map(
		participants.map((participant) => [participant.displayName, participant.hasVoted] as const)
	);
};
