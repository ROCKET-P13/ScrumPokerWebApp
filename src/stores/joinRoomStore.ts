import { create } from 'zustand';

interface JoinRoomParams {
	roomCode: string;
	name: string;
}

interface JoinRoomState extends JoinRoomParams {
	updateJoinData: (data: Partial<JoinRoomParams>) => void;
}

export const joinRoomStore = create<JoinRoomState>((set, get) => ({
	roomCode: '',
	name: '',
	updateJoinData: (data) => {
		set((state) => ({
			...state,
			...data,
		}));
	},
}));