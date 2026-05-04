import { create } from 'zustand';

interface JoinRoomState  {
	roomCode: string;
	displayName: string;
	updateJoinData: (data: { roomCode?: string; displayName?: string; }) => void;
}

export const joinRoomStore = create<JoinRoomState>((set) => ({
	roomCode: '',
	displayName: '',
	updateJoinData: (data) => {
		set((state) => ({
			...state,
			...data,
		}));
	},
}));