type Handler = (data: object) => void;

export class WebSocketClient {
	private socket: WebSocket | null = null;
	private handlers: Handler[] = [];
	private queue: string[] = [];
	#WS_URL = import.meta.env.VITE_WS_URL;

	private pending = new Map<string, (data: { success: boolean, payload: object, error: object }) => void>();

	connect () {
		if (this.socket) {
			return;
		}

		this.socket = new WebSocket(this.#WS_URL);

		this.socket.onopen = () => {
			console.log('connected');

			this.queue.forEach((msg) => this.socket?.send(msg));
			this.queue = [];
		};

		this.socket.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'response' && data.requestId) {
				const resolver = this.pending.get(data.requestId);

				if (resolver) {
					resolver(data);
					this.pending.delete(data.requestId);
					return;
				}
			}

			this.handlers.forEach((h) => h(data));
		};

		this.socket.onclose = () => {
			console.log('disconnected');
			this.socket = null;
		};
	}

	private sendRaw (payload: object) {
		const msg = JSON.stringify(payload);

		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
			this.queue.push(msg);
			return;
		}

		this.socket.send(msg);
	}

	send (action: string, payload?: object): Promise<object> {
		const requestId = crypto.randomUUID();

		return new Promise((resolve, reject) => {
			this.pending.set(requestId, (response) => {
				if (response.success) {
					resolve(response.payload);
				} else {
					reject(response.error);
				}
			});

			this.sendRaw({
				action,
				requestId,
				type: 'command',
				payload,
			});
		});
	}

	subscribe (handler: Handler) {
		this.handlers.push(handler);

		return () => {
			this.handlers = this.handlers.filter((h) => h !== handler);
		};
	}
}
