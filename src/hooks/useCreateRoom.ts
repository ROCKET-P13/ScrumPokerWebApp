import { useMutation } from '@tanstack/react-query';

import { roomAPI } from '@/API/RoomAPI';

export const useCreateRoom = () => {
	return useMutation({
		mutationFn: ({ displayName }: { displayName: string }) => roomAPI.create({ displayName }),
	});
};