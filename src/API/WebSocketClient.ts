import { RoomStateMessage } from '@/types/RoomStateMessage';

type Handler = (data: RoomStateMessage) => void;

type PendingResolver = {
  resolve: (data: {
    success: boolean;
    payload: unknown;
    error?: unknown;
  }) => void;
  reject: (err: unknown) => void;
  timeout: number;
};

export class WebSocketClient {
	private socket: WebSocket | null = null;
	private handlers: Handler[] = [];
	private queue: string[] = [];
	private pending = new Map<string, PendingResolver>();

	private reconnectTimeout: number | null = null;

	#WS_URL: string | undefined = import.meta.env.VITE_WS_URL;

	connect () {
		const wsUrl = this.#WS_URL;

		if (wsUrl == null || wsUrl === '') {
			console.error(
				'VITE_WS_URL is missing. It must be set at build time (e.g. GitHub Actions variable/secret VITE_WS_URL).'
			);
			return;
		}

		if (
			this.socket
      && (this.socket.readyState === WebSocket.OPEN
        || this.socket.readyState === WebSocket.CONNECTING)
		) {
			return;
		}

		this.socket = new WebSocket(wsUrl);

		this.socket.onopen = () => {
			console.log('connected');

			// flush queued messages
			this.queue.forEach((msg) => this.socket?.send(msg));
			this.queue = [];
		};

		this.socket.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'response' && data.requestId) {
				const pending = this.pending.get(data.requestId);

				if (pending) {
					pending.resolve(data);
					this.pending.delete(data.requestId);
					return;
				}
			}

			this.handlers.forEach((h) => h(data));
		};

		this.socket.onclose = () => {
			console.log('disconnected');
			this.socket = null;

			this.scheduleReconnect();
		};

		this.socket.onerror = () => {
			console.log('socket error');
			this.socket?.close();
		};
	}

	private scheduleReconnect () {
		if (this.reconnectTimeout) return;

		this.reconnectTimeout = window.setTimeout(() => {
			console.log('reconnecting...');
			this.reconnectTimeout = null;
			this.connect();
		}, 1000);
	}

	private sendRaw (payload: object) {
		const msg = JSON.stringify(payload);

		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
			this.queue.push(msg);
			return;
		}

		this.socket.send(msg);
	}

	send<T = unknown> (action: string, payload?: object): Promise<T> {
		const requestId = crypto.randomUUID();

		return new Promise<T>((resolve, reject) => {
			const timeout = window.setTimeout(() => {
				this.pending.delete(requestId);
				reject(new Error('Request timeout'));
			}, 10000);

			this.pending.set(requestId, {
				resolve: (response) => {
					clearTimeout(timeout);

					if (response.success) {
						resolve(response.payload as T);
					} else {
						reject(response.error ?? new Error('Request failed'));
					}
				},
				reject,
				timeout,
			});

			this.sendRaw({
				type: 'command',
				action,
				requestId,
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

	disconnect () {
		this.socket?.close();
		this.socket = null;

		this.pending.forEach((p) => {
			clearTimeout(p.timeout);
			p.reject(new Error('Socket disconnected'));
		});

		this.pending.clear();
	}
}