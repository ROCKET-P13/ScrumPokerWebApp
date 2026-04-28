type MessageHandler = (data: unknown) => void;

class SocketManager {
	private socket: WebSocket | null = null;
	private handlers: MessageHandler[] = [];

	connect(url: string) {
		if (this.socket) return;

		this.socket = new WebSocket(url);

		this.socket.onopen = () => {
			console.log("WebSocket connected");
		};

		this.socket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			this.handlers.forEach((h) => h(data));
		};

		this.socket.onclose = () => {
			console.log("WebSocket disconnected");
			this.socket = null;
		};
	}

	send(data: unknown) {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

		this.socket.send(JSON.stringify(data));
	}

	subscribe(handler: MessageHandler) {
		this.handlers.push(handler);

		return () => {
			this.handlers = this.handlers.filter((h) => h !== handler);
		};
	}
}

export const socketManager = new SocketManager();