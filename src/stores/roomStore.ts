import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Room } from '@/types/Room';

type RoomStoreSession = {
	roomCode: string | null;
	displayName: string | null;
	isRoomAdmin: boolean;
}

export interface RoomStoreState {
	session: RoomStoreSession;
	room: Room | null;
	setSession: (data: RoomStoreSession) => void;
	setRoomState: (room: Room) => void;
	clearSession: () => void;
}

export const roomStore = create<RoomStoreState>()(
	persist(
		(set) => ({
			session: {
				roomCode: null,
				displayName: null,
				isRoomAdmin: false,
			},

			room: null,

			setSession: (data: RoomStoreSession) => {
				set({
					session: {
						roomCode: data.roomCode,
						displayName: data.displayName,
						isRoomAdmin: data.isRoomAdmin,
					},
				});
			},

			setRoomState: (room: Room) => {
				set({
					room: room,
				});
			},

			clearSession: () => {
				set({
					session: {
						roomCode: null,
						displayName: null,
						isRoomAdmin: false,
					},
					room: null,
				});
			},

		}),
		{
			name: 'scrum-poker-session',
			partialize: (state) => ({
				session: state.session,
				room: state.room,
			}),
		}
	)
);