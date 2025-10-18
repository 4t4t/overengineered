import { RunService } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuildersWithoutIdAndDefaults } from "shared/blocks/Block";

type SliderBlockModel = BlockModel & {
	TrackBase: BasePart & {
		PrismaticConstraint: PrismaticConstraint;
	};

	// plate one has it named differently
	TrackSlider: BasePart | undefined;
	TrackTop: BasePart | undefined;
};

// the true width of the sliders
// DO NOT CHANGE
const sliderWidth = 6;

const sliderDefinition = {
	// change order if ya want
	inputOrder: ["powered", "targetPos", "speed", "stiffness", "cframe", "max_force"],
	input: {
		powered: {
			displayName: "Powered",
			tooltip: "If the slider actively asserts force.",
			types: {
				bool: {
					config: true,
				},
			},
		},
		speed: {
			displayName: "Speed",
			tooltip: "Specifies the speed of the slider.",
			unit: "studs/second",
			types: {
				number: {
					config: 15,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 500,
						step: 0.01,
					},
				},
			},
		},
		targetPos: {
			displayName: "Target Position (%)",
			unit: "Percent", // I dident want to deal with changing max values with scaling
			tooltip: "Use `(studs/(total_length/2))*100` to get the offset-to-percent",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: false,
						min: -100,
						max: 100,
					},
					control: {
						config: {
							enabled: true,
							startValue: 0,
							mode: {
								type: "instant",
								instant: {
									mode: "onRelease",
								},
								smooth: {
									mode: "stopOnRelease",
									speed: 20,
								},
							},
							keys: [
								{ key: "R", value: 100 },
								{ key: "F", value: -100 },
							],
						},
					},
				},
			},
		},
		stiffness: {
			displayName: "Responsiveness",
			tooltip: "Specifies the sharpness of the servo motor in reaching the Target Angle.",
			types: {
				number: {
					config: 45,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 100,
						step: 0.01,
					},
				},
			},
			connectorHidden: true,
		},
		max_force: {
			displayName: "Max Force",
			tooltip: "Specifies the maximum force of the slider.",
			types: {
				number: {
					config: 200,
					clamp: {
						showAsSlider: true,
						max: 1500,
						min: 0,
						step: 0.1,
					},
				},
			},
		},
		cframe: {
			displayName: "Infinite Torque",
			types: {
				bool: {
					config: false,
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

const sd_tpos = sliderDefinition.input.targetPos;
const sliderDefinition_edge = {
	...sliderDefinition,
	input: {
		...sliderDefinition.input,
		targetPos: {
			...sd_tpos,
			types: {
				number: {
					...sd_tpos.types.number,
					clamp: {
						...sd_tpos.types.number.clamp,
						min: 0, // override -100 to 0
					},
					control: {
						config: {
							...sd_tpos.types.number.control!.config,
							keys: [
								{ key: "R", value: 100 },
								{ key: "F", value: 0 }, // override -100 to 0
							],
						},
					},
				},
			},
		},
	},
} satisfies BlockLogicFullBothDefinitions;

// get studs extended for a given percent
function getPercent2Studs(percent: number, totalLength: number) {
	return (percent / 100) * totalLength;
}

// fake like reality
class FakePrismatic {
	private weld: Weld;
	private originFrame: CFrame;
	private currentOffset: number;
	private targetOffset: number;
	private speed: number;
	private responsiveness: number;
	private powered: number; // number to not deal with boolean datatype
	private maxLimit: number;
	private minLimit: number;

	constructor(
		weld: Weld,
		originFrame: CFrame,
		speed = 5,
		responsiveness = 0.1,
		minLimit = -1,
		maxLimit = 1,
		powered = 1,
	) {
		this.weld = weld;
		this.originFrame = originFrame;
		this.currentOffset = 0;
		this.targetOffset = 0;
		this.speed = speed;
		this.responsiveness = responsiveness / 100;
		this.powered = powered;
		this.maxLimit = maxLimit;
		this.minLimit = minLimit;
	}

	// set details
	setDetails(name: "speed" | "responsiveness" | "targetOffset" | "powered", offset: number) {
		this[name] = offset;
	}

	tick(deltaFps: number) {
		// powering off just stops it from updating
		if (this.powered === 0) return;

		const delta = this.targetOffset - this.currentOffset;
		const step = delta * this.responsiveness;

		// clamp step
		const maxStep = math.clamp(this.speed * deltaFps, -math.abs(delta), math.abs(delta));
		const clampedStep = math.clamp(step, -maxStep, maxStep);

		// clamp to limits
		this.currentOffset = math.clamp(this.currentOffset + clampedStep, this.minLimit, this.maxLimit);

		// update weld
		this.weld.C1 = new CFrame(0, 0, this.currentOffset).mul(this.originFrame);
	}
}

// base slider class (NO DEFINITION)
abstract class SliderBlockLogic_Base extends InstanceBlockLogic<typeof sliderDefinition, SliderBlockModel> {
	constructor(
		def: typeof sliderDefinition,
		block: InstanceBlockLogicArgs,
		default_length: number = sliderWidth / 2,
		isCentered: boolean = true,
	) {
		super(def, block);

		const trackBase = this.instance.TrackBase;
		const slider = trackBase.PrismaticConstraint;
		const sliderPart =
			(this.instance.FindFirstChild("TrackSlider") as BasePart) ||
			(this.instance.FindFirstChild("TrackTop") as BasePart);
		let cframeWeld: Weld | undefined;
		let fakePrismatic: FakePrismatic | undefined;

		const blockScale = BlockManager.manager.scale.get(this.instance) ?? Vector3.one;
		const scale = blockScale.X * blockScale.Y * blockScale.Z;

		this.onk(["powered"], ({ powered }) => {
			if (fakePrismatic !== undefined) {
				fakePrismatic.setDetails("powered", powered ? 1 : 0);
			} else {
				slider.ActuatorType = powered ? Enum.ActuatorType.Servo : Enum.ActuatorType.None;
			}
		});

		// non cframe stuff
		this.onk(["targetPos"], ({ targetPos }) => {
			// calculate the position based on percent
			let pos = getPercent2Studs(targetPos, default_length * blockScale.Z);
			if (!isCentered) {
				pos = math.max(pos, 0);
			}

			if (fakePrismatic !== undefined) {
				fakePrismatic.setDetails("targetOffset", pos);
			} else {
				slider.TargetPosition = pos;
			}
		});

		// responsiveness but different name
		this.onk(["stiffness"], ({ stiffness }) => {
			if (fakePrismatic !== undefined) {
				fakePrismatic.setDetails("responsiveness", stiffness);
			} else {
				slider.LinearResponsiveness = stiffness;
			}
		});

		this.onk(["speed"], ({ speed }) => {
			if (fakePrismatic !== undefined) {
				fakePrismatic.setDetails("speed", speed);
			} else {
				slider.Speed = speed;
			}
		});

		this.onFirstInputs(({ cframe, speed, stiffness }) => {
			const limit = default_length * blockScale.Z;
			const lowerLimit = isCentered ? -limit : 0;
			const upperLimit = isCentered ? limit : limit * 2;

			slider.LowerLimit = lowerLimit;
			slider.UpperLimit = upperLimit;

			if (cframe) {
				slider.Enabled = false;

				// makea da weld
				cframeWeld = new Instance("Weld");

				const originFrame = sliderPart.CFrame.ToObjectSpace(trackBase.CFrame);
				cframeWeld.C0 = new CFrame();
				cframeWeld.C1 = originFrame;

				fakePrismatic = new FakePrismatic(cframeWeld, originFrame, speed, stiffness, lowerLimit, upperLimit);

				cframeWeld.Part0 = trackBase;
				cframeWeld.Part1 = sliderPart;
				cframeWeld.Parent = trackBase;

				// needed as slider moves between inputs
				RunService.PreSimulation.Connect((delta) => {
					fakePrismatic?.tick(delta);
				});
			} else {
				// cframe doesnt have force
				this.onk(["max_force"], ({ max_force }) => {
					slider.ServoMaxForce = max_force * 1_000 * math.max(0.95, scale);
				});
			}
		});
	}
}

// base class with definition
class SliderBlockLogic extends SliderBlockLogic_Base {
	constructor(block: InstanceBlockLogicArgs) {
		super(sliderDefinition, block);
	}
}

// limit range to account for carriage
class Limit_SliderBlockLogic extends SliderBlockLogic_Base {
	constructor(block: InstanceBlockLogicArgs) {
		super(sliderDefinition, block, sliderWidth / 2 - 0.5);
	}
}

// make on edge
class Edge_Limit_SliderBlockLogic extends SliderBlockLogic_Base {
	constructor(block: InstanceBlockLogicArgs) {
		// use custom definition for edge
		// _, _, default_length, isCentered
		super(sliderDefinition_edge, block, sliderWidth - 1, false);
	}
}

// the WIDE ones
// limit range to account for carriage
class Limit_SliderBlockLogic_Wide extends SliderBlockLogic_Base {
	constructor(block: InstanceBlockLogicArgs) {
		super(sliderDefinition, block, sliderWidth / 2 - 1.5);
	}
}

// make on edge
class Edge_Limit_SliderBlockLogic_Wide extends SliderBlockLogic_Base {
	constructor(block: InstanceBlockLogicArgs) {
		// use custom definition for edge
		// _, _, default_length, isCentered
		super(sliderDefinition_edge, block, sliderWidth - 3, false);
	}
}

const search = {
	aliases: ["rail", "track"],
};
const list: BlockBuildersWithoutIdAndDefaults = {
	// the id VVV
	// TSliderDualPlate
	tsliderdualplate: {
		displayName: "Linear Rail Slider",
		description: "It slides along, waiting to be destroyed like my sanity.", // gotta make sure it fits with the theme of depres.. warm happiness!
		search,
		logic: { definition: sliderDefinition, ctor: SliderBlockLogic },
	},
	// TSliderFull
	// above but with a guide
	tsliderfull: {
		displayName: "Linear Guide-Rail Slider",
		description: "A 'Linear Rail Slider' but a different model.",
		search,
		logic: { definition: sliderDefinition, ctor: SliderBlockLogic },
	},

	// TSliderCenter
	// above but with a smaller carriage (and centered)
	tslidercenter: {
		displayName: "Linear Carriage Slider (Centered)",
		description: "Slides linearly with a carriage in the center.",
		search,
		logic: { definition: sliderDefinition, ctor: Limit_SliderBlockLogic },
	},
	// TSliderEdge
	// above but the carriage is at the end
	tslideredge: {
		displayName: "Linear Carriage Slider (Edge)",
		description: "Slides linearly with a carriage at the edge.",
		search,
		logic: { definition: sliderDefinition_edge, ctor: Edge_Limit_SliderBlockLogic },
	},

	// TSliderCenterWide
	// TSliderCenter but with a wide carriage
	tslidercenterwide: {
		displayName: "Linear Wide Carriage Slider (Centered)",
		description: "Slides linearly with a carriage in the center. But its a wide carriage.",
		search,
		logic: { definition: sliderDefinition, ctor: Limit_SliderBlockLogic_Wide },
	},
	// TSliderEdgeWide
	// TSliderEdge but with a wide carriage
	tslideredgewide: {
		displayName: "Linear Wide Carriage Slider (Edge)",
		description: "Slides linearly with a carriage at the edge. But its a wide carriage.",
		search,
		logic: { definition: sliderDefinition_edge, ctor: Edge_Limit_SliderBlockLogic_Wide },
	},
};
export const LinearSliderBlocks = BlockCreation.arrayFromObject(list);
