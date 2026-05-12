import { useMutation } from '@tanstack/react-query';

import { roomAPI } from '@/API/RoomAPI';

interface JoinRoomMutationParams {
	roomCode: string;
	displayName: string;
	isRoomAdmin: boolean;
	isPlayer: boolean;
}

export const useJoinRoom = () => {
	return useMutation({
		mutationFn: (params: JoinRoomMutationParams) => roomAPI.join(params),
	});
};