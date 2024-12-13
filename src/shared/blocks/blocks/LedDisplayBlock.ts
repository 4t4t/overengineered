import { AutoC2SRemoteEvent } from "engine/shared/event/C2SRemoteEvent";
import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["posx", "posy", "color", "update", "reset"],
	input: {
		posx: {
			displayName: "Position X",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 7,
						step: 1,
					},
				},
			},
			configHidden: true,
		},
		posy: {
			displayName: "Position Y",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 7,
						step: 1,
					},
				},
			},
			configHidden: true,
		},
		color: {
			displayName: "Color",
			types: {
				vector3: {
					config: new Vector3(0, 0, 0),
				},
				color: {
					config: new Color3(0, 0, 0),
				},
			},
			configHidden: true,
		},
		update: {
			displayName: "Update",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
		reset: {
			displayName: "Reset",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as LedDisplayBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	static readonly events = {
		prepare: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly baseColor: Color3;
		}>("leddisplay_prepare"), // TODO: fix this shit crap
		update: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly color: Color3;
			readonly frame: Frame;
		}>("leddisplay_update"),
		fill: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly color: Color3;
			readonly frames: Frame[][];
		}>("leddisplay_fill"),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const baseColor = this.definition.input.color.types.color.config;

		Logic.events.prepare.send({ block: block.instance, baseColor: baseColor });
		const gui = block.instance.WaitForChild("Screen").WaitForChild("SurfaceGui");

		const display: Frame[][] = new Array(8);
		for (let x = 0; x < 8; x++) {
			display[x] = new Array(8);
			for (let y = 0; y < 8; y++) {
				display[x][y] = gui.WaitForChild(`x${x}y${y}`) as Frame;
			}
		}

		this.on(({ posx, posy, color, update }) => {
			if (!update) return;

			if (typeIs(color, "Vector3")) {
				color = Color3.fromRGB(color.X, color.Y, color.Z);
			}

			Logic.events.update.send({
				block: block.instance,
				color,
				frame: display[posx][posy],
			});
		});

		this.on(({ reset }) => {
			if (!reset) return;

			Logic.events.fill.send({
				block: block.instance,
				color: baseColor,
				frames: display,
			});
		});
	}
}

export const LedDisplayBlock = {
	...BlockCreation.defaults,
	id: "leddisplay",
	displayName: "Display",
	description: "Simple 8x8 pixel display. Wonder what can you do with it..",
	limit: 32,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
