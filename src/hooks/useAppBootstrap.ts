import { useEffect } from 'react';

import { roomAPI } from '@/API/RoomAPI';
import { Routes } from '@/Common/Routes';
import { useJoinRoom } from '@/hooks/useJoinRoom';
import { roomStore } from '@/stores/roomStore';

export const useAppBootstrap = () => {
	const session = roomStore((s) => s.session);
	const setRoomState = roomStore((s) => s.setRoomState);
	const clearSession = roomStore((s) => s.clearSession);

	const { mutateAsync: join } = useJoinRoom();

	const roomCode = session.roomCode;
	const displayName = session.displayName;
	const isRoomAdmin = session.isRoomAdmin;

	useEffect(() => {
		return roomAPI.subscribe((room) => {
			const activeCode = roomStore.getState().session.roomCode;
			if (activeCode == null || activeCode !== room.roomCode) {
				return;
			}

			setRoomState(room);
		});
	}, [setRoomState]);

	useEffect(() => {
		if (!roomCode || !displayName) {
			return;
		}

		if (window.location.pathname !== `${Routes.ROOM}/${roomCode}`) {
			return;
		}

		let cancelled = false;

		void (async () => {
			try {
				const room = await join({
					roomCode,
					displayName,
					isRoomAdmin,
				});
				if (cancelled) {
					return;
				}

				setRoomState(room);
			} catch (err) {
				console.error('Failed to rejoin room after restore', err);
				if (!cancelled) {
					clearSession();
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [roomCode, displayName, isRoomAdmin, join, setRoomState, clearSession]);
};
