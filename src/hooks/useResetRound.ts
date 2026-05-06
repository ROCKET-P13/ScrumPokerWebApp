import { useMutation } from '@tanstack/react-query';

import { roomAPI } from '@/API/RoomAPI';

export const useResetRound = () => {
	return useMutation({
		mutationFn: () => roomAPI.resetRound(),
	});
};