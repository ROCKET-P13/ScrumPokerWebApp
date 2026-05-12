import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { voteArrivalStore } from '@/stores/voteArrivalStore';
import { Room } from '@/types/Room';

type RoomStoreSession = {
	roomCode: string | null;
	displayName: string | null;
	isRoomAdmin: boolean;
	vote: string;
	isPlayer: boolean;
}

export interface RoomStoreState {
	session: RoomStoreSession;
	room: Room;
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
				vote: '',
				isPlayer: false,
			},

			room: {
				roomCode: '',
				isRevealed: false,
				participants: [],
			},

			setSession: (data: RoomStoreSession) => {
				set({
					session: {
						roomCode: data.roomCode,
						displayName: data.displayName,
						isRoomAdmin: data.isRoomAdmin,
						vote: data.vote,
						isPlayer: data.isPlayer,
					},
				});
			},

			setRoomState: (room: Room) => {
				set({
					room: room,
				});
			},

			clearSession: () => {
				voteArrivalStore.getState().resetAll();

				set({
					session: {
						roomCode: null,
						displayName: null,
						isRoomAdmin: false,
						vote: '',
						isPlayer: false,
					},

					room: {
						roomCode: '',
						isRevealed: false,
						participants: [],
					},
				});
			},

		}),
		{
			name: 'scrum-poker-session',
			storage: createJSONStorage(() => sessionStorage),
			partialize: (state) => ({
				session: state.session,
			}),
			merge: (persistedState, currentState) => ({
				...currentState,
				...(persistedState ?? {}),
				room: currentState.room,
			}),
		}
	)
);