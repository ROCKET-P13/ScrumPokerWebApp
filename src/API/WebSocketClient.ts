import { WebSocketRequestTypes } from '@/Common/WebSocketRequestTypes';

export interface WebSocketClientConstructorParams {
	onMessage?: (data: unknown) => void;
	onOpen?: () => void;
	onClose?: (event: CloseEvent) => void;
}

export interface WebSocketClientError {
	status: number;
	message: string;
}

export interface WebSocketConnectParams {
	path?: string;
}
type WebSocketRequestMessage = {
	type: WebSocketRequestTypes;
} & Record<string, unknown>;

export class WebSocketClient {
	#WS_BASE_URL = import.meta.env.VITE_WS_URL;
	#onMessage?: (data: unknown) => void;
	#onOpen?: () => void;
	#onClose?: (event: CloseEvent) => void;
	#webSocket: WebSocket | null = null;

	constructor (params: WebSocketClientConstructorParams = {}) {
		this.#onMessage = params.onMessage;
		this.#onOpen = params.onOpen;
		this.#onClose = params.onClose;
	}

	#buildUrl (path: string): string {
		const base = this.#WS_BASE_URL;
		const normalizedPath = path.startsWith('/') ? path : `/${path}`;
		return `${base}${normalizedPath}`;
	}

	#parseMessage (raw: string): unknown {
		try {
			return JSON.parse(raw) as unknown;
		} catch {
			return raw;
		}
	}

	connect (params: WebSocketConnectParams = {}): Promise<void> {
		const path = params.path ?? '';

		this.disconnect();

		return new Promise<void>((resolve, reject) => {
			const webSocket = new WebSocket(this.#buildUrl(path));
			let settled = false;

			const fail = (message: string, status: number) => {
				if (settled) {
					return;
				}

				settled = true;
				reject({ status, message });
			};

			webSocket.onopen = () => {
				if (settled) {
					return;
				}
				settled = true;
				this.#webSocket = webSocket;
				this.#onOpen?.();
				resolve();
			};

			webSocket.onerror = () => {
				fail('WebSocket connection error', 0);
			};

			webSocket.onclose = (event) => {
				if (!settled) {
					fail(event.reason || 'WebSocket closed before open', event.code || 0);
				} else if (this.#webSocket === webSocket) {
					this.#webSocket = null;
					this.#onClose?.(event);
				}
			};

			webSocket.onmessage = (event) => {
				const payload = this.#parseMessage(event.data as string);
				this.#onMessage?.(payload);
			};
		});
	}

	get isConnected (): boolean {
		return this.#webSocket !== null && this.#webSocket.readyState === WebSocket.OPEN;
	}

	send (body: WebSocketRequestMessage): void {
		if (!this.isConnected || !this.#webSocket) {
			const err: WebSocketClientError = {
				status: 0,
				message: 'WebSocket is not connected',
			};
			throw err;
		}
		this.#webSocket.send(JSON.stringify(body));
	}

	disconnect (code?: number, reason?: string): void {
		if (!this.#webSocket) {
			return;
		}
		this.#webSocket.close(code, reason);
	}
}
