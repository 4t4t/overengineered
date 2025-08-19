import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockBuildersWithoutIdAndDefaults } from "shared/blocks/Block";

const blocks: BlockBuildersWithoutIdAndDefaults = {
	anchorblock: {
		displayName: "Anchor",
		description: "An immovable block",

		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},

	ballinsocket: {
		displayName: "Ball in Socket",
		description: "Ball socket for your mechanical ingenuities",
	},
	ballinsocketangled: {
		displayName: "Ball in Socket (Angled)",
		description: "Angled ball socket for your mechanical ingenuities",
	},

	shaft: {
		displayName: "Shaft",
		description: "A long thin pipe",
	},
	driveshaft: {
		displayName: "Driveshaft",
		description: "Kinda like a ball socket but with transmitting rotational force",
		search: {
			partialAliases: ["universal", "joint"],
		},
	},

	smallgear: {
		displayName: "Small Gear (Legacy)",
		description: "A cog for your machinery. Better use Spur Gear.",
	},

	spurgear: {
		displayName: "Spur Gear",
		description: "Just a regular gear",
	},
	bevelgear: {
		displayName: "Beveled Gear",
		description: "Tilted Spur Gear",
	},
	helicalgear: {
		displayName: "Helical Gear",
		description: "Tilted Beveled Gear",
	},
	gearrack: {
		displayName: "Rack (Gear)",
		description: "It's like a flat gear.. I mean gears are already flat but this one is a different way",
	},
	sprocketgear: {
		displayName: "Sprocket",
		description: "Use it to hold your tank tracks",
		search: {
			partialAliases: ["gear", "sprocket", "track"],
		},
	},

	wingrounding: {
		displayName: "Wing Rounding",
		description: "A wing rounding. Literally rounds your wing",
	},
	wingsharpening: {
		displayName: "Wing Sharper",
		description: "An evil brother of the wing rounding",
	},
};

//

export const MechanicalBlocks = BlockCreation.arrayFromObject(blocks);
