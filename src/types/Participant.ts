export type Participant = {
	displayName: string;
	hasVoted: boolean;
	isRoomAdmin: boolean;
	vote?: string;
}