import { useMutation } from '@tanstack/react-query';

import { roomAPI } from '@/API/RoomAPI';

export const useRevealVotes = () => {
	return useMutation({
		mutationFn: () => roomAPI.revealVotes(),
	});
};