import { Room } from '@/types/Room';

export interface RoomStateMessage {
	event?: string;
	type?: string;
	payload: Room;
}