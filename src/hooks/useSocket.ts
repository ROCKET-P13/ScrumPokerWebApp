import { useEffect } from "react";
import { socketManager } from "../lib/socket";
import { useRoomStore, type Room } from "../store/roomStore";

interface Message {
	type: string;
	room: Room;
}

export const useSocket = () => {
	const setRoom = useRoomStore((s) => s.setRoom);

	useEffect(() => {
		socketManager.connect("ws://localhost:5046/ws");

		const unsubscribe = socketManager.subscribe((message: Message) => {
			switch (message.type) {
				case "ROOM_STATE":
					setRoom(message.room);
					break;
			}
		});

		return () => {
			unsubscribe();
		};
	}, [setRoom]);
};