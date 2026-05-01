import { WebSocketClient } from '@/API/WebSocketClient';

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

	async create ({ displayName }: CreateRoomParams) {
		this.#webSocketClient.subscribe((message) => {
			console.log('create room message', message);
		});

		const res = await this.#webSocketClient.send('CREATE_ROOM', { displayName });

		return res;
	}

	async join ({ roomCode, displayName }: JoinRoomParams) {
		this.#webSocketClient.subscribe((message) => {
			console.log('join room message', message);
		});

		const res = await this.#webSocketClient.send('JOIN_ROOM', { roomCode, displayName });
		return res;
	}
}

export const roomAPI = new RoomAPI();