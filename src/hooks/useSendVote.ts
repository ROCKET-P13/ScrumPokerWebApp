import { useMutation } from '@tanstack/react-query';

import { roomAPI } from '@/API/RoomAPI';

export const useSendVote = () => {
	return useMutation({
		mutationFn: (params: { vote: string }) => roomAPI.sendVote(params),
	});
};
