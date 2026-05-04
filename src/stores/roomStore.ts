import { create } from 'zustand';

import { Participant } from '@/types/Participant';

interface Room {
	roomCode: string;
	isRevealed: boolean;
	participants: Participant[]
}

interface RoomStoreState {
	room: Room;
	selfVote: string;
	setRoom: (data: Room) => void;
}

export const roomStore = create<RoomStoreState>((set, get) => ({
	room: {
		roomCode: '',
		isRevealed: false,
		participants: [],
	},
	selfVote: '',
	setRoom: (data: Room) => {
		set((state) => ({
			...state,
			room: data,
		}));
	},
}));