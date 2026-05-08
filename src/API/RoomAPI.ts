import { WebSocketClient } from '@/API/WebSocketClient';
import { RoomBroadcastEvent } from '@/Common/RoomBroadcastEvent';
import { WebSocketRequestActions } from '@/Common/WebSocketRequestActions';
import { Room } from '@/types/Room';
import { RoomStateMessage } from '@/types/RoomStateMessage';

interface RoomAPIConstructorParams {
	webSocketClient?: WebSocketClient
}

interface CreateRoomParams {
	displayName: string;
}

export interface JoinRoomParams {
	roomCode: string;
	displayName: string;
	isRoomAdmin: boolean
}

class RoomAPI {
	#webSocketClient: WebSocketClient;

	constructor (params: RoomAPIConstructorParams = {}) {
		this.#webSocketClient = params.webSocketClient ?? new WebSocketClient();
		this.#webSocketClient.connect();
	}

	async create ({ displayName }: CreateRoomParams): Promise<Room> {
		return await this.#webSocketClient.send(WebSocketRequestActions.CREATE_ROOM, { displayName });
	}

	async join ({ roomCode, displayName, isRoomAdmin }: JoinRoomParams): Promise<Room> {
		return await this.#webSocketClient.send(WebSocketRequestActions.JOIN_ROOM, { roomCode, displayName, isRoomAdmin });
	}

	async sendVote ({ vote }: { vote: string }): Promise<Room> {
		return await this.#webSocketClient.send(WebSocketRequestActions.SEND_VOTE, { value: vote });
	}

	async revealVotes (): Promise<Room> {
		return await this.#webSocketClient.send(WebSocketRequestActions.REVEAL_VOTES);
	}

	async resetRound (): Promise<Room> {
		return await this.#webSocketClient.send(WebSocketRequestActions.RESET_ROUND);
	}

	subscribe (listener: (room: Room) => void): () => void {
		return this.#webSocketClient.subscribe((data: RoomStateMessage) => {
			if (data.event !== RoomBroadcastEvent.ROOM_STATE) {
				return;
			}
			listener(data.payload);
		});
	}
}

export const roomAPI = new RoomAPI();