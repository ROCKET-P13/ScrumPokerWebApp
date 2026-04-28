import { create } from "zustand";

export interface Player {
	connectionId: string;
	name: string;
	vote?: string | null;
}

export interface Room {
	id: string;
	players: Player[];
	isRevealed: boolean;
}

interface RoomState {
	room: Room | null;

	setRoom: (room: Room) => void;
	clearRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
	room: null,

	setRoom: (room) => set({ room }),
	clearRoom: () => set({ room: null }),
}));