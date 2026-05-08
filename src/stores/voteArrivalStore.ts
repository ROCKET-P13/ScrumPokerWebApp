import _ from 'lodash';
import { create } from 'zustand';

import { Participant } from '@/types/Participant';

export type VoteArrivalOrderRecord = Record<string, number>;

export type VoteArrivalTableSyncInput = {
	participantsList: Participant[];
	selfDisplayName: string;
	selfVoteDisplay: string;
	isRevealed: boolean;
	hideSelfTableCard: boolean;
	gatherDeckIsNull: boolean;
	exitingForLayout: ReadonlySet<string>;
	hasAnyOtherParticipantVoted: boolean;
};

export type VoteArrivalStore = {
	orderByDisplayName: VoteArrivalOrderRecord;
	nextSeq: number;
	backupOrderByDisplayName: VoteArrivalOrderRecord;
	gatherSnapshotParticipants: Participant[] | null;
	gatherFrozenVoteOrderByDisplayName: VoteArrivalOrderRecord | null;

	syncTableTick: (input: VoteArrivalTableSyncInput) => void;
	removeVoteArrival: (displayName: string) => void;
	beginGatherDeck: (snapshotParticipants: Participant[]) => void;
	endGatherDeck: () => void;
	resetAll: () => void;
};

export const useVoteArrivalStore = create<VoteArrivalStore>((set, get) => ({
	orderByDisplayName: {},
	nextSeq: 0,
	backupOrderByDisplayName: {},
	gatherSnapshotParticipants: null,
	gatherFrozenVoteOrderByDisplayName: null,
	syncTableTick: (input) => {
		const {
			participantsList,
			selfDisplayName,
			selfVoteDisplay,
			isRevealed,
			hideSelfTableCard,
			gatherDeckIsNull,
			exitingForLayout,
			hasAnyOtherParticipantVoted,
		} = input;

		const previous = get();
		const backupOrderByDisplayName = { ...previous.orderByDisplayName };
		let orderByDisplayName = { ...previous.orderByDisplayName };
		let nextSeq = previous.nextSeq;

		const selfHasVisibleTableActivity = Boolean(selfVoteDisplay !== '' || hideSelfTableCard);
		const noCardsOnTable
			= !hasAnyOtherParticipantVoted && exitingForLayout.size === 0 && !selfHasVisibleTableActivity;

		if (noCardsOnTable && Object.keys(orderByDisplayName).length > 0 && gatherDeckIsNull) {
			orderByDisplayName = {};
			nextSeq = 0;
		}

		if (!selfHasVisibleTableActivity) {
			const next = { ...orderByDisplayName };

			delete next[selfDisplayName];
			orderByDisplayName = next;
		}

		for (const participant of participantsList) {
			if (participant.hasVoted && !(participant.displayName in orderByDisplayName)) {
				orderByDisplayName = {
					...orderByDisplayName,
					[participant.displayName]: nextSeq,
				};
				nextSeq += 1;
			}
		}

		if (!isRevealed && selfVoteDisplay !== '' && !(selfDisplayName in orderByDisplayName)) {
			orderByDisplayName = {
				...orderByDisplayName,
				[selfDisplayName]: nextSeq,
			};
			nextSeq += 1;
		}

		const orderChanged = !_.isEqual(orderByDisplayName, previous.orderByDisplayName);
		const seqChanged = nextSeq !== previous.nextSeq;
		const backupChanged = !_.isEqual(backupOrderByDisplayName, previous.backupOrderByDisplayName);

		if (!orderChanged && !seqChanged && !backupChanged) {
			return;
		}

		set({
			orderByDisplayName,
			nextSeq,
			backupOrderByDisplayName,
		});
	},

	removeVoteArrival: (displayName) => {
		const { orderByDisplayName } = get();

		if (!(displayName in orderByDisplayName)) {
			return;
		}

		const next = { ...orderByDisplayName };

		delete next[displayName];
		set({ orderByDisplayName: next });
	},

	beginGatherDeck: (snapshotParticipants) => {
		const { backupOrderByDisplayName } = get();

		set({
			gatherSnapshotParticipants: snapshotParticipants,
			gatherFrozenVoteOrderByDisplayName: { ...backupOrderByDisplayName },
		});
	},

	endGatherDeck: () => {
		set({
			gatherSnapshotParticipants: null,
			gatherFrozenVoteOrderByDisplayName: null,
		});
	},

	resetAll: () => {
		set({
			orderByDisplayName: {},
			nextSeq: 0,
			backupOrderByDisplayName: {},
			gatherSnapshotParticipants: null,
			gatherFrozenVoteOrderByDisplayName: null,
		});
	},
}));

/** Alias for imperative reads outside React (`getState` / `setState`). */
export const voteArrivalStore = useVoteArrivalStore;
