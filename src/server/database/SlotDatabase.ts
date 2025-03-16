import { Players } from "@rbxts/services";
import { Db } from "engine/server/Database";
import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { SlotsMeta } from "shared/SlotsMeta";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { LatestSerializedBlocks } from "shared/building/BlocksSerializer";

@injectable
export class SlotDatabase {
	private readonly onlinePlayers = new Set<number>();
	private readonly blocksdb;

	constructor(
		private readonly datastore: DatabaseBackend<
			BlocksSerializer.JsonSerializedBlocks,
			[ownerId: number, slotId: number]
		>,
		@inject private readonly players: PlayerDatabase,
	) {
		this.blocksdb = new Db<
			LatestSerializedBlocks,
			BlocksSerializer.JsonSerializedBlocks,
			[ownerId: number, slotId: number]
		>(
			this.datastore,
			() => ({ version: BlocksSerializer.latestVersion, blocks: [] }),
			(slot) => BlocksSerializer.jsonToObject(slot),
			(slot) => BlocksSerializer.objectToJson(slot),
		);

		Players.PlayerAdded.Connect((plr) => this.onlinePlayers.add(plr.UserId));
		Players.PlayerRemoving.Connect((plr) => {
			this.onlinePlayers.delete(plr.UserId);

			// Roblox Stuido Local Server
			if (plr.UserId <= 0) return;

			const id = tostring(plr.UserId);

			for (const [key, { keys }] of this.blocksdb.loadedUnsavedEntries()) {
				if (key.find(id + "_")[0] === undefined) {
					continue;
				}

				$log("Saving " + key);
				this.blocksdb.save(keys, key);
				this.blocksdb.free(keys, key);
			}
		});
	}

	private ensureValidSlotIndex(userId: number, index: number) {
		if (SlotsMeta.getSpecial(index)) return;

		const pdata = this.players.get(userId);
		const player = Players.GetPlayerByUserId(userId);
		if (!player) return;

		const maxSlots = GameDefinitions.getMaxSlots(player, pdata.purchasedSlots ?? 0);

		if (index >= 0 && index < maxSlots) {
			return;
		}

		if (SlotsMeta.isTestSlot(index)) {
			return;
		}

		throw "Invalid slot index " + index;
	}

	private getMeta(userId: number) {
		return this.players.get(userId).slots ?? [];
	}
	private setMeta(userId: number, slots: readonly SlotMeta[]) {
		this.players.set(userId, {
			...this.players.get(userId),
			slots,
		});

		if (!this.onlinePlayers.has(userId)) {
			for (const slot of slots) {
				this.blocksdb.save([userId, slot.index]);
				this.blocksdb.free([userId, slot.index]);
			}

			$log(`Saving data of the OFFLINE player ${userId}`);
		}
	}

	getBlocks(userId: number, index: number): LatestSerializedBlocks {
		this.ensureValidSlotIndex(userId, index);
		return this.blocksdb.get([userId, index]);
	}
	setBlocks(userId: number, index: number, blocks: LatestSerializedBlocks | undefined) {
		this.ensureValidSlotIndex(userId, index);

		blocks ??= { version: BlocksSerializer.latestVersion, blocks: [] };
		this.blocksdb.set([userId, index], blocks);

		const meta = [...this.getMeta(userId)];
		SlotsMeta.set(meta, {
			...SlotsMeta.get(meta, index),
			blocks: blocks.blocks.size(),
			saveTime: DateTime.now().UnixTimestampMillis,
			index,
		});
		this.setMeta(userId, meta);
	}
	setBlocksFromAnotherSlot(userId: number, index: number, indexfrom: number) {
		this.ensureValidSlotIndex(userId, index);
		this.ensureValidSlotIndex(userId, indexfrom);
		this.blocksdb.set([userId, index], this.getBlocks(userId, indexfrom));

		const meta = [...this.getMeta(userId)];
		SlotsMeta.set(meta, { ...SlotsMeta.get(meta, indexfrom), index });
		this.setMeta(userId, meta);
	}

	updateMeta(userId: number, index: number, metaUpdate: (meta: readonly SlotMeta[]) => readonly SlotMeta[]): void {
		this.ensureValidSlotIndex(userId, index);

		const meta = metaUpdate(this.getMeta(userId));
		this.setMeta(userId, meta);
	}
	delete(userId: number, index: number): void {
		this.ensureValidSlotIndex(userId, index);

		this.blocksdb.delete([userId, index]);
		this.updateMeta(userId, index, (meta) => SlotsMeta.withRemovedSlot(meta, index));
	}
}
