import { useMutation } from '@tanstack/react-query';

import { JoinRoomParams, roomAPI } from '@/API/RoomAPI';

export const useJoinRoom = () => {
	return useMutation({
		mutationFn: async (params: JoinRoomParams) => await roomAPI.join(params),
	});
};