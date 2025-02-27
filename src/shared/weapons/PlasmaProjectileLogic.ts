import { Workspace } from "@rbxts/services";
import { Easing } from "engine/shared/component/Easing";
import { A2SRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { WeaponProjectile } from "shared/weapons/BaseProjectileLogic";
import type { modifierValue, projectileModifier } from "shared/weapons/BaseProjectileLogic";

export class PlasmaProjectile extends WeaponProjectile {
	private startSize = this.projectilePart.Size;
	private readonly vectorForce: VectorForce;
	static readonly spawn = new A2SRemoteEvent<{
		readonly startPosition: Vector3;
		readonly baseVelocity: Vector3;
		readonly baseDamage: number;
		readonly modifier: projectileModifier;
	}>("plasma_spawn", "RemoteEvent");

	constructor(startPosition: Vector3, baseVelocity: Vector3, baseDamage: number, modifier: projectileModifier) {
		super(startPosition, "ENERGY", WeaponProjectile.PLASMA_PROJECTILE, baseVelocity, baseDamage, modifier, 5);
		this.vectorForce = this.projectilePart.WaitForChild("VectorForce") as VectorForce;
		this.updateLifetimeModifier(1);
	}

	/**
	 * The projectile gets weaker with time!
	 */
	private updateLifetimeModifier(percentage: number) {
		const nv: modifierValue = { value: percentage, isRelative: true };
		this.rawModifiers[0] = {
			speedModifier: nv,
			heatDamage: nv,
			impactDamage: nv,
			explosiveDamage: nv,
		};
	}

	onHit(part: BasePart, point: Vector3): void {
		const startedWithSize = this.projectilePart.Size;
		this.projectilePart.AssemblyLinearVelocity = Vector3.zero;
		this.projectilePart.Anchored = true;
		this.projectilePart.CanCollide = false;
		this.projectilePart.CanTouch = false;
		this.disable();
		this.projectilePart.Position = this.projectilePart.CFrame.PointToWorldSpace(
			new Vector3(0, startedWithSize.Y / 2, 0),
		);
		//point === hit position (at least should be)

		task.spawn(() => {
			const time = 0.7;
			const startTime = os.clock() / time;
			while (startTime > os.clock() / time - 1) {
				const sz = Easing.ease(os.clock() / time - startTime, "Quint", "Out");
				const revSz = 1 - sz;
				this.projectilePart.Transparency = math.sqrt(sz);
				this.projectilePart.Size = new Vector3(
					sz * startedWithSize.Y,
					math.max(revSz * startedWithSize.Y, 0.1),
					sz * startedWithSize.Y,
				);
				task.wait();
			}

			super.onHit(part, point, true);
		});
	}

	onTick(dt: number, percentage: number, reversePercentage: number): void {
		super.onTick(dt, percentage, reversePercentage);
		//this.projectilePart.AssemblyLinearVelocity = this.baseVelocity;
		this.projectilePart.Transparency = percentage;
		this.updateLifetimeModifier(reversePercentage);
		this.projectilePart.Size = this.startSize.mul(new Vector3(1, 1 + this.baseVelocity.Magnitude / 100, 1));
		this.vectorForce.Force = new Vector3(0, this.projectilePart.Mass * Workspace.Gravity, 0);
	}
}

PlasmaProjectile.spawn.invoked.Connect((player, { startPosition, baseVelocity, baseDamage, modifier }) => {
	// print("Plasma ball spawned");
	new PlasmaProjectile(startPosition, baseVelocity, baseDamage, modifier);
});
