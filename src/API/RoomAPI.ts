import { WebSocketClient } from '@/API/WebSocketClient';
import { Room } from '@/types/Room';

interface RoomAPIConstructorParams {
	webSocketClient?: WebSocketClient
}

interface CreateRoomParams {
	displayName: string;
}

export interface JoinRoomParams {
	roomCode: string;
	displayName: string;
}

class RoomAPI {
	#webSocketClient: WebSocketClient;

	constructor (params: RoomAPIConstructorParams = {}) {
		this.#webSocketClient = params.webSocketClient ?? new WebSocketClient();
		this.#webSocketClient.connect();
	}

	async create ({ displayName }: CreateRoomParams): Promise<Room> {
		return await this.#webSocketClient.send('CREATE_ROOM', { displayName });
	}

	async join ({ roomCode, displayName }: JoinRoomParams) {
		return await this.#webSocketClient.send('JOIN_ROOM', { roomCode, displayName });
	}
}

export const roomAPI = new RoomAPI();