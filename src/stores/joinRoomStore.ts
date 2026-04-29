import { create } from 'zustand';

interface JoinRoomParams {
	roomId: string;
	name: string;
}

interface JoinRoomState extends JoinRoomParams {
	updateJoinData: (data: Partial<JoinRoomParams>) => void;
}

export const joinRoomStore = create<JoinRoomState>((set, get) => ({
	roomId: '',
	name: '',
	updateJoinData: (data) => {
		set((state) => ({
			...state,
			...data,
		}));
	},
}));