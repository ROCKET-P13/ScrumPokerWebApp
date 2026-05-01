import { useMutation } from '@tanstack/react-query';

import { roomAPI } from '@/API/RoomAPI';

export const useCreateRoom = () => {
	return useMutation({
		mutationFn: async (displayName: string) => await roomAPI.create({ displayName }),
	});
};