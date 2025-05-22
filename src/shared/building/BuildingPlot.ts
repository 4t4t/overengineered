import { HttpService } from "@rbxts/services";
import { ArgsSignal } from "engine/shared/event/Signal";
import { BB } from "engine/shared/fixes/BB";
import { JSON } from "engine/shared/fixes/Json";
import { Objects } from "engine/shared/fixes/Objects";
import { Operation } from "engine/shared/Operation";
import { BlockManager } from "shared/building/BlockManager";
import { ReadonlyPlot } from "shared/building/ReadonlyPlot";
import { SharedBuilding } from "shared/building/SharedBuilding";
import { VectorUtils } from "shared/utils/VectorUtils";

const err = (message: string): ErrorResponse => ({ success: false, message });
const success: SuccessResponse = { success: true };

/** Building on a plot. */
@injectable
export class BuildingPlot extends ReadonlyPlot {
	readonly placeOperation = new Operation(this.place.bind(this));
	readonly deleteOperation = new Operation(this.delete.bind(this));
	readonly editOperation = new Operation(this.edit.bind(this));

	private readonly _blockPlaced = new ArgsSignal<[block: BlockModel]>();
	readonly blockPlaced = this._blockPlaced.asReadonly();

	private readonly _blockDestroyed = new ArgsSignal<[block: BlockModel]>();
	readonly blockDestroyed = this._blockDestroyed.asReadonly();

	private readonly _blockEdited = new ArgsSignal<[req: EditBlockRequest]>();
	readonly blockEdited = this._blockEdited.asReadonly();

	constructor(
		instance: Folder,
		origin: CFrame,
		boundingBox: BB,
		@inject private readonly blockList: BlockList,
	) {
		super(instance, origin, boundingBox);
	}

	initializeDelay(placeDelay: number, deleteDelay: number, editDelay: number) {
		const addDelay = (signal: ReadonlyArgsSignal<[]>, chance: number) => {
			signal.Connect(() => {
				if (math.random(chance) === 1) {
					task.wait();
				}
			});
		};

		addDelay(this.blockPlaced, placeDelay);
		addDelay(this.blockDestroyed, deleteDelay);
		addDelay(this.blockEdited, editDelay);
	}

	cloneBlocks(): Instance {
		return this.instance.Clone();
	}
	isInside(block: BlockModel): boolean {
		return this.boundingBox.isBBInside(BB.fromModel(block));
	}

	unparent(): void {
		this.instance.Parent = undefined;
	}
	destroy(): void {
		this.instance.Destroy();
	}

	/** @deprecated Used only for a specific case, do not use & do not remove */
	justPlaceExisting(block: BlockModel): void {
		block.Parent = this.instance;
	}
	private place(data: PlaceBlockRequest): BuildResponse {
		const block = this.blockList.blocks[data.id];
		if (!block) {
			return { success: false, message: `Unknown block id ${data.id}` };
		}

		const roundedpos = VectorUtils.roundVector3To(data.location.Position, 0.3);
		for (const block of this.getBlocks()) {
			const pos = VectorUtils.roundVector3To(block.GetPivot().Position, 0.3);
			if (pos === roundedpos) {
				return err(`Can't place blocks in blocks`);
			}
		}

		const placed = this.getBlocks().count((placed_block) => BlockManager.manager.id.get(placed_block) === data.id);
		if (placed > block.limit) {
			return err(`Type limit exceeded for ${data.id}`);
		}

		const uuid = data.uuid ?? (HttpService.GenerateGUID(false) as BlockUuid);
		if (this.tryGetBlock(uuid)) {
			throw `Block with uuid ${uuid} already exists`;
		}

		// Create a new instance of the building model
		const model = block.model.Clone();
		BlockManager.manager.id.set(model, data.id);

		model.PivotTo(data.location);

		if (data.config && Objects.size(data.config) !== 0) {
			BlockManager.manager.config.set(model, data.config);
		}
		BlockManager.manager.customData.set(model, data.customData);

		BlockManager.manager.scale.set(model, data.scale);
		BlockManager.manager.uuid.set(model, uuid);
		model.Name = uuid;

		SharedBuilding.paint([model], data.color, data.material, true);
		model.Parent = this.instance;

		// scaling has to be updated after parenting so the weld offset is updated
		if (data.scale) {
			SharedBuilding.scale(model, block.model, data.scale);
		}

		this._blockPlaced.Fire(model);
		return { success: true, model: model };
	}
	private delete(blocks: readonly BlockModel[] | "all"): Response {
		if (blocks !== "all" && blocks.size() === 0) {
			return success;
		}

		if (blocks === "all") {
			blocks = this.getBlocks();
			for (const block of blocks) {
				block.Destroy();
				this._blockDestroyed.Fire(block);
			}
		} else {
			const connections = SharedBuilding.getBlocksConnectedByLogicToMulti(
				this.getBlockDatas(),
				blocks.mapToSet(BlockManager.manager.uuid.get),
			);
			for (const [, c] of connections) {
				for (const [otherblock, connectionName] of c) {
					this.logicDisconnect({
						inputBlock: otherblock.instance,
						inputConnection: connectionName,
					});
				}
			}

			for (const block of blocks) {
				block.Destroy();
				this._blockDestroyed.Fire(block);
			}
		}

		return success;
	}
	private edit(blocks: EditBlocksRequest["blocks"]): Response {
		if (blocks.size() === 0) {
			return success;
		}

		for (const { instance, position, scale } of blocks) {
			const origInstance = this.blockList.blocks[BlockManager.manager.id.get(instance)]!.model;

			const bb = BB.fromModel(origInstance)
				.withCenter(position ?? instance.GetPivot())
				.withSize((s) => s.mul(scale ?? BlockManager.manager.scale.get(instance) ?? Vector3.zero));

			if (!this.boundingBox.isBBInside(bb)) {
				return err("Invalid edit");
			}
		}

		for (const req of blocks) {
			const { instance, position, scale } = req;
			if (position) instance.PivotTo(position);
			if (scale) {
				SharedBuilding.scale(
					instance,
					this.blockList.blocks[BlockManager.manager.id.get(instance)]!.model,
					scale,
				);
				BlockManager.manager.scale.set(instance, scale);
			}

			this._blockEdited.Fire(req);
		}

		return success;
	}

	logicConnect(request: Omit<LogicConnectRequest, "plot">): Response {
		const config = BlockManager.manager.config.get(request.inputBlock) ?? {};
		const outputInfo = BlockManager.manager.uuid.get(request.outputBlock);

		const newConfig: typeof config = {
			...config,
			[request.inputConnection]: {
				type: "wire",
				config: {
					prevConfig: config[request.inputConnection],
					blockUuid: outputInfo,
					connectionName: request.outputConnection,
				},
			},
		};

		BlockManager.manager.config.set(request.inputBlock, newConfig);
		return success;
	}
	logicDisconnect({ inputBlock, inputConnection }: Omit<LogicDisconnectRequest, "plot">): Response {
		const config = { ...BlockManager.manager.config.get(inputBlock) };
		const cfg = config[inputConnection];
		if (cfg.type === "wire") {
			// either set it to the previous config, or delete the key by setting it to nil
			if (!cfg.config.prevConfig || cfg.config.prevConfig.type === "wire") {
				delete config[inputConnection];
			} else {
				config[inputConnection] = cfg.config.prevConfig;
			}
		}

		BlockManager.manager.config.set(inputBlock, config);
		return success;
	}
	paintBlocks({ blocks, color, material }: Omit<PaintBlocksRequest, "plot">): Response {
		if (blocks !== "all" && blocks.size() === 0) {
			return success;
		}

		blocks = blocks === "all" ? this.getBlocks() : blocks;
		SharedBuilding.paint(blocks, color, material, false);
		return success;
	}
	updateConfig(configs: ConfigUpdateRequest["configs"]): Response {
		for (const config of configs) {
			BlockManager.manager.config.set(config.block, JSON.deserialize(config.scfg));
		}

		return success;
	}
	updateCustomData(datas: CustomDataUpdateRequest["datas"]): Response {
		for (const data of datas) {
			BlockManager.manager.customData.set(data.block, JSON.deserialize(data.sdata));
		}

		return success;
	}
	resetConfig(blocks: readonly BlockModel[]): Response {
		for (const block of blocks) {
			BlockManager.manager.config.set(block, undefined);
		}

		return success;
	}
}
