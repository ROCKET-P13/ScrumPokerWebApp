import { useMutation } from '@tanstack/react-query';

import { roomAPI } from '@/API/RoomAPI';

export const useCreateRoom = () => {
	return useMutation({
		mutationFn: ({ displayName, isPlayer }: { displayName: string, isPlayer: boolean }) => roomAPI.create({ displayName, isPlayer }),
	});
};