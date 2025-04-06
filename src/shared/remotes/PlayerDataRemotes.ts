import { C2S2CRemoteFunction } from "engine/shared/event/PERemoteEvent";
import { C2SRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { PlayerRemotes } from "engine/shared/PlayerRemotes";

export type PlayerDataStorageRemotesBuilding = {
	readonly placeBlocks: C2S2CRemoteFunction<PlaceBlocksRequest, MultiBuildResponse>;
	readonly deleteBlocks: C2S2CRemoteFunction<DeleteBlocksRequest>;
	readonly editBlocks: C2S2CRemoteFunction<EditBlocksRequest>;
	readonly logicConnect: C2S2CRemoteFunction<LogicConnectRequest>;
	readonly logicDisconnect: C2S2CRemoteFunction<LogicDisconnectRequest>;
	readonly paintBlocks: C2S2CRemoteFunction<PaintBlocksRequest>;
	readonly updateConfig: C2S2CRemoteFunction<ConfigUpdateRequest>;
	readonly updateCustomData: C2S2CRemoteFunction<CustomDataUpdateRequest>;
	readonly resetConfig: C2S2CRemoteFunction<ConfigResetRequest>;
};
export type PlayerDataStorageRemotesSlots = {
	readonly load: C2S2CRemoteFunction<PlayerLoadSlotRequest, LoadSlotResponse>;
	readonly save: C2S2CRemoteFunction<PlayerSaveSlotRequest, SaveSlotResponse>;
	readonly delete: C2S2CRemoteFunction<PlayerDeleteSlotRequest, Response>;
};
export type PlayerDataStorageRemotesPlayer = {
	readonly updateSettings: C2SRemoteEvent<PlayerUpdateSettingsRequest>;
	readonly updateData: C2SRemoteEvent<PlayerUpdateDataRequest>;
	readonly fetchData: C2S2CRemoteFunction<undefined, Response<PlayerDataResponse>>;
};
export type PlayerDataStorageRemotes = {
	readonly building: PlayerDataStorageRemotesBuilding;
	readonly slots: PlayerDataStorageRemotesSlots;
	readonly player: PlayerDataStorageRemotesPlayer;
};

export namespace PlayerDataRemotes {
	export function createSlots(folder: Instance): PlayerDataStorageRemotesSlots {
		return PlayerRemotes.fromFolder(folder, (get) => ({
			load: new C2S2CRemoteFunction(get("slots_load", "RemoteFunction")),
			save: new C2S2CRemoteFunction(get("slots_save", "RemoteFunction")),
			delete: new C2S2CRemoteFunction(get("slots_delete", "RemoteFunction")),
		}));
	}
	export function createPlayer(folder: Instance): PlayerDataStorageRemotesPlayer {
		return PlayerRemotes.fromFolder(folder, (get) => ({
			updateSettings: new C2SRemoteEvent(get("player_updsettings", "RemoteEvent")),
			updateData: new C2SRemoteEvent(get("player_upddata", "RemoteEvent")),
			fetchData: new C2S2CRemoteFunction(get("player_fetchdata", "RemoteFunction")),
		}));
	}
	export function createBuilding(folder: Instance): PlayerDataStorageRemotesBuilding {
		return PlayerRemotes.fromFolder(folder, (get) => ({
			placeBlocks: new C2S2CRemoteFunction<PlaceBlocksRequest, MultiBuildResponse>(
				get("building_place", "RemoteFunction"),
			),
			deleteBlocks: new C2S2CRemoteFunction(get("building_delete", "RemoteFunction")),
			editBlocks: new C2S2CRemoteFunction(get("building_edit", "RemoteFunction")),
			logicConnect: new C2S2CRemoteFunction(get("building_lconnect", "RemoteFunction")),
			logicDisconnect: new C2S2CRemoteFunction(get("building_ldisconnect", "RemoteFunction")),
			paintBlocks: new C2S2CRemoteFunction(get("building_paint", "RemoteFunction")),
			updateConfig: new C2S2CRemoteFunction(get("building_updatecfg", "RemoteFunction")),
			updateCustomData: new C2S2CRemoteFunction(get("building_updatecdt", "RemoteFunction")),
			resetConfig: new C2S2CRemoteFunction(get("building_resetcfg", "RemoteFunction")),
		}));
	}

	/** @deprecated */
	export function fromFolder(folder: Instance): PlayerDataStorageRemotes {
		return {
			building: createBuilding(folder),
			slots: createSlots(folder),
			player: createPlayer(folder),
		};
	}
}
