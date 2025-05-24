import { Component } from "engine/shared/component/Component";
import { BlockManager } from "shared/building/BlockManager";
import { BuildingManager } from "shared/building/BuildingManager";
import type { PlayerId } from "server/PlayerId";
import type { BuildingPlot } from "shared/building/BuildingPlot";
import type { SharedPlot } from "shared/building/SharedPlot";
import type { SharedPlots } from "shared/building/SharedPlots";
import type { PlayerDataStorageRemotesBuilding } from "shared/remotes/PlayerDataRemotes";

const err = (message: string): ErrorResponse => ({ success: false, message });
const errBuildingNotPermitted = err("Building is not permitted");

const isBlockOnPlot = (block: BlockModel, plot: PlotModel): boolean => block.IsDescendantOf(plot);
const areAllBlocksOnPlot = (blocks: readonly BlockModel[], plot: PlotModel): boolean => {
	for (const block of blocks) {
		if (!isBlockOnPlot(block, plot)) {
			return false;
		}
	}

	return true;
};

@injectable
export class ServerBuildingRequestController extends Component {
	constructor(
		@inject buildingRemotes: PlayerDataStorageRemotesBuilding,
		@inject private readonly playerId: PlayerId,
		@inject private readonly plot: SharedPlot,
		@inject private readonly blocks: BuildingPlot,

		@inject private readonly plots: SharedPlots,
		@inject private readonly blockList: BlockList,
	) {
		super();

		const b = buildingRemotes;
		b.placeBlocks.subscribe((p, arg) => this.placeBlocks(arg));
		b.deleteBlocks.subscribe((p, arg) => this.deleteBlocks(arg));
		b.editBlocks.subscribe((p, arg) => this.editBlocks(arg));
		b.logicConnect.subscribe((p, arg) => this.logicConnect(arg));
		b.logicDisconnect.subscribe((p, arg) => this.logicDisconnect(arg));
		b.paintBlocks.subscribe((p, arg) => this.paintBlocks(arg));
		b.updateConfig.subscribe((p, arg) => this.updateConfig(arg));
		b.updateCustomData.subscribe((p, arg) => this.updateCustomData(arg));
		b.resetConfig.subscribe((p, arg) => this.resetConfig(arg));
	}

	private placeBlocks(request: PlaceBlocksRequest): MultiBuildResponse {
		if (!this.plots.isBuildingAllowed(request.plot, this.playerId)) {
			return errBuildingNotPermitted;
		}

		return this._placeBlocks(this.plot, this.blocks, request.blocks);
	}
	private _placeBlocks(
		plot: SharedPlot,
		bplot: BuildingPlot,
		blocks: readonly PlaceBlockRequest[],
	): MultiBuildResponse {
		for (const block of blocks) {
			const b = this.blockList.blocks[block.id];
			if (!b) return err("Unknown block id");

			if (
				!BuildingManager.serverBlockCanBePlacedAt(
					plot,
					b,
					block.location,
					block.scale ?? Vector3.one,
					this.playerId,
				)
			) {
				return err("Can't be placed here");
			}

			// if block with the same uuid already exists
			if (block.uuid !== undefined && bplot.tryGetBlock(block.uuid)) {
				return err("Invalid block placement data");
			}
		}

		const countBy = <T, K>(arr: readonly T[], keyfunc: (value: T) => K): Map<K, number> => {
			const result = new Map<K, number>();
			for (const value of arr) {
				const key = keyfunc(value);
				result.set(key, (result.get(key) ?? 0) + 1);
			}

			return result;
		};

		const counts = countBy(blocks, (b) => b.id);
		for (const [id, count] of counts) {
			const regblock = this.blockList.blocks[id];
			if (!regblock) {
				return err("Unknown block id");
			}

			const placed = bplot.getBlocks().count((placed_block) => BlockManager.manager.id.get(placed_block) === id);

			if (placed + count > regblock.limit && game.PrivateServerOwnerId === 0 && regblock.limit !== 1) {
				return err(
					`Type limit exceeded for ${regblock.id}. ${regblock.limit !== 1 ? "Maybe you should play on a private server?" : "Even a private server can't help you."}`,
				);
			}
		}

		const placed: BlockModel[] = [];
		for (const block of blocks) {
			const placedBlock = bplot.placeOperation.execute(block);
			if (!placedBlock.success) {
				return placedBlock;
			}

			if (placedBlock.model) {
				placed.push(placedBlock.model);
			}
		}

		return { success: true, models: placed };
	}

	private deleteBlocks(request: DeleteBlocksRequest): Response {
		if (!this.plots.isBuildingAllowed(request.plot, this.playerId)) {
			return errBuildingNotPermitted;
		}
		if (request.blocks !== "all" && !areAllBlocksOnPlot(request.blocks, request.plot)) {
			return errBuildingNotPermitted;
		}

		return this.blocks.deleteOperation.execute(request.blocks);
	}
	private editBlocks(request: EditBlocksRequest): Response {
		if (!this.plots.isBuildingAllowed(request.plot, this.playerId)) {
			return errBuildingNotPermitted;
		}
		for (const { instance } of request.blocks) {
			if (!isBlockOnPlot(instance, request.plot)) {
				return errBuildingNotPermitted;
			}
		}

		return this.blocks.editOperation.execute(request.blocks);
	}

	private logicConnect(request: LogicConnectRequest): Response {
		if (!this.plots.isBuildingAllowed(request.plot, this.playerId)) {
			return errBuildingNotPermitted;
		}
		if (!isBlockOnPlot(request.inputBlock, request.plot)) {
			return errBuildingNotPermitted;
		}
		if (!isBlockOnPlot(request.outputBlock, request.plot)) {
			return errBuildingNotPermitted;
		}

		return this.blocks.logicConnect(request);
	}
	private logicDisconnect(request: LogicDisconnectRequest): Response {
		if (!this.plots.isBuildingAllowed(request.plot, this.playerId)) {
			return errBuildingNotPermitted;
		}
		if (!isBlockOnPlot(request.inputBlock, request.plot)) {
			return errBuildingNotPermitted;
		}

		return this.blocks.logicDisconnect(request);
	}
	private paintBlocks(request: PaintBlocksRequest): Response {
		if (!this.plots.isBuildingAllowed(request.plot, this.playerId)) {
			return errBuildingNotPermitted;
		}
		if (request.blocks !== "all" && !areAllBlocksOnPlot(request.blocks, request.plot)) {
			return errBuildingNotPermitted;
		}

		return this.blocks.paintBlocks(request);
	}
	private updateConfig(request: ConfigUpdateRequest): Response {
		if (!this.plots.isBuildingAllowed(request.plot, this.playerId)) {
			return errBuildingNotPermitted;
		}
		for (const config of request.configs) {
			if (!isBlockOnPlot(config.block, request.plot)) {
				return errBuildingNotPermitted;
			}
		}

		return this.blocks.updateConfig(request.configs);
	}
	private updateCustomData(request: CustomDataUpdateRequest): Response {
		if (!this.plots.isBuildingAllowed(request.plot, this.playerId)) {
			return errBuildingNotPermitted;
		}
		for (const config of request.datas) {
			if (!isBlockOnPlot(config.block, request.plot)) {
				return errBuildingNotPermitted;
			}
		}

		return this.blocks.updateCustomData(request.datas);
	}
	private resetConfig(request: ConfigResetRequest): Response {
		if (!this.plots.isBuildingAllowed(request.plot, this.playerId)) {
			return errBuildingNotPermitted;
		}
		if (!areAllBlocksOnPlot(request.blocks, request.plot)) {
			return errBuildingNotPermitted;
		}

		return this.blocks.resetConfig(request.blocks);
	}
}
