import { useMutation } from '@tanstack/react-query';

import { roomAPI } from '@/API/RoomAPI';

export const useJoinRoom = () => {
	return useMutation({
		mutationFn: (params: { roomCode: string; displayName: string, isRoomAdmin: boolean }) => roomAPI.join(params),
	});
};