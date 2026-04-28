import { socketManager } from "./socket";

export const joinRoom = (roomId: string, name: string) => {
	socketManager.send({
		type: "JOIN_ROOM",
		roomId,
		name,
	});
};

export const sendVote = (roomId: string, vote: string) => {
	socketManager.send({
		type: "SEND_VOTE",
		roomId,
		vote,
	});
};

export const revealVotes = (roomId: string) => {
	socketManager.send({
		type: "REVEAL_VOTES",
		roomId,
	});
};

export const resetRound = (roomId: string) => {
	socketManager.send({
		type: "RESET_ROUND",
		roomId,
	});
};