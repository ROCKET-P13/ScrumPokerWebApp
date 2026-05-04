import { Participant } from '@/types/Participant';

export interface Room {
	roomCode: string;
	isRevealed: boolean;
	participants: Participant[];
}