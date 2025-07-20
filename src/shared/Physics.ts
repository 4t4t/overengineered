import { GameDefinitions } from "shared/data/GameDefinitions";
import { GameEnvironment } from "shared/data/GameEnvironment";

export type LocalHeight = number & { /** @hidden @deprecated */ ___nominal: "LocalHeight" };

export namespace Physics {
	export namespace LocalHeight {
		/** Returns a {@link LocalHeight} from a global Y value */
		export function fromGlobal(value: number): LocalHeight {
			return (value - GameDefinitions.HEIGHT_OFFSET) as LocalHeight;
		}

		/** Returns a {@link LocalHeight} from a "global-height-offset"-relative Y value */
		export function fromLocal(value: number): LocalHeight {
			return value as LocalHeight;
		}
	}

	const gravDiffModifier = GameEnvironment.EarthGravity / GameEnvironment.ZeroGravityHeight;
	export function GetGravityModifierOnHeight(value: LocalHeight): number {
		return math.max(GameEnvironment.EarthGravity - value * gravDiffModifier, 0);
	}

	export function GetGravityOnHeight(value: LocalHeight): number {
		return math.max(GameEnvironment.EarthGravity - value * gravDiffModifier, 0);
	}

	const airDensDiffModifier = GameEnvironment.EarthAirDensity / GameEnvironment.ZeroAirHeight;
	export function GetAirDensityOnHeight(value: LocalHeight) {
		return math.max(GameEnvironment.EarthAirDensity - value * airDensDiffModifier, 0);
	}
}
