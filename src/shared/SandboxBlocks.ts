import { BlockListBuilder } from "shared/blocks/BlockListBuilder";
import { AltimeterBlock } from "shared/blocks/blocks/AltimeterBlock";
import { AngleSensorBlock } from "shared/blocks/blocks/AngleSensorBlock";
import { BackMountBlock } from "shared/blocks/blocks/BackMountBlock";
import { BallastBlock } from "shared/blocks/blocks/BallastBlock";
import { BeaconBlock } from "shared/blocks/blocks/BeaconBlock";
import { BearingShaftBlock } from "shared/blocks/blocks/BearingShaftBlock";
import { BracedShaftBlock } from "shared/blocks/blocks/BracedShaftBlock";
import { ButtonBlock } from "shared/blocks/blocks/ButtonBlock";
import { CameraBlock } from "shared/blocks/blocks/CameraBlock";
import { ControllerBlock } from "shared/blocks/blocks/ControllerBlock";
import { CounterBlock } from "shared/blocks/blocks/CounterBlock";
import { DelayBlock } from "shared/blocks/blocks/DelayBlock";
import { DisconnectBlock } from "shared/blocks/blocks/DisconnectBlock";
import { FallbackBlock } from "shared/blocks/blocks/FallbackBlock";
import { FireSensorBlock } from "shared/blocks/blocks/FireSensorBlock";
import { GPSSensorBlock } from "shared/blocks/blocks/GPSSensorBlock";
import { GravitySensorBlock } from "shared/blocks/blocks/GravitySensorBlock";
import { BasicLogicGateBlocks } from "shared/blocks/blocks/grouped/BasicLogicGateBlocks";
import { BasicOperationBlocks } from "shared/blocks/blocks/grouped/BasicOperationBlocks";
import { BuildingBlocks } from "shared/blocks/blocks/grouped/BuildingBlocks";
import { HingeBlocks } from "shared/blocks/blocks/grouped/HingeBlocks";
import { LampBlocks } from "shared/blocks/blocks/grouped/LampBlocks";
import { MechanicalBlocks } from "shared/blocks/blocks/grouped/MechanicalBlocks";
import { ServoMotorBlocks } from "shared/blocks/blocks/grouped/ServoMotorBlocks";
import { StringOperationBlocks } from "shared/blocks/blocks/grouped/StringOperationBlocks";
import { TNTBlocks } from "shared/blocks/blocks/grouped/TNTBlocks";
import { WheelBlocks } from "shared/blocks/blocks/grouped/WheelBlocks";
import { WingBlocks } from "shared/blocks/blocks/grouped/WingsBlocks";
import { HeliumBlock } from "shared/blocks/blocks/HeliumBlock";
import { ImpulseExtenderBlock } from "shared/blocks/blocks/ImpulseExtenderBlock";
import { ImpulseGeneratorBlock } from "shared/blocks/blocks/ImpulseGeneratorBlock";
import { KeySensorBlock } from "shared/blocks/blocks/KeySensorBlock";
import { LaserBlock } from "shared/blocks/blocks/LaserBlock";
import { LedDisplayBlock } from "shared/blocks/blocks/LedDisplayBlock";
import { LogicMemoryBlock } from "shared/blocks/blocks/LogicMemoryBlock";
import { LogicMemoryLegacyBlock } from "shared/blocks/blocks/LogicMemoryOldBlock";
import { LogicOverclockBlock } from "shared/blocks/blocks/LogicOverclockBlock";
import { MagnetBlock } from "shared/blocks/blocks/MagnetBlock";
import { MassSensorBlock } from "shared/blocks/blocks/MassSensorBlock";
import { MotorBlock } from "shared/blocks/blocks/MotorBlock";
import { MouseSensorBlock } from "shared/blocks/blocks/MouseSensorBlock";
import { NonVolatileMemoryBlock } from "shared/blocks/blocks/NonVolatileMemoryBlock";
import { OwnerCameraLocatorBlock } from "shared/blocks/blocks/OwnerCameraLocatorBlock";
import { OwnerLocatorBlock } from "shared/blocks/blocks/OwnerLocatorBlock";
import { PassengerSeatBlock } from "shared/blocks/blocks/PassengerSeatBlock";
import { PistonBlock } from "shared/blocks/blocks/PistonBlock";
import { RadarSectionBlock } from "shared/blocks/blocks/RadarSectionBlock";
import { RadioReceiverBlock } from "shared/blocks/blocks/RadioReceiverBlock";
import { RadioTransmitterBlock } from "shared/blocks/blocks/RadioTransmitterBlock";
import { RandomAccessMemoryBlock } from "shared/blocks/blocks/RandomAccessMemoryBlock";
import { RandomBlock } from "shared/blocks/blocks/RandomBlock";
import { RCSEngineBlock } from "shared/blocks/blocks/RCSEngineBlock";
import { ReadonlyMemoryBlock } from "shared/blocks/blocks/ReadonlyMemoryBlock";
import { RocketBlocks } from "shared/blocks/blocks/RocketEngineBlocks";
import { RopeBlock } from "shared/blocks/blocks/RopeBlock";
import { ScreenBlock } from "shared/blocks/blocks/ScreenBlock";
import { SevenSegmentDisplayBlock } from "shared/blocks/blocks/SevenSegmentDisplayBlock";
import { SingleImpulseBlock } from "shared/blocks/blocks/SingleImpulseBlock";
import { SoundEffectBlockCreator } from "shared/blocks/blocks/sound/SoundEffectBlockCreator";
import { SpeakerBlock } from "shared/blocks/blocks/sound/SpeakerBlock";
import { SpeedometerBlock } from "shared/blocks/blocks/SpeedometerBlock";
import { StackMemoryBlock } from "shared/blocks/blocks/StackMemoryBlock";
import { SuspensionBlock } from "shared/blocks/blocks/SuspensionBlock";
import { TpsCounterBlock } from "shared/blocks/blocks/TpsCounterBlock";
import { VehicleSeatBlock } from "shared/blocks/blocks/VehicleSeatBlock";
import { CannonBarrels } from "shared/blocks/blocks/Weaponary/Cannon/CannonBarrels";
import { CannonBases } from "shared/blocks/blocks/Weaponary/Cannon/CannonBases";
import { CannonBreech } from "shared/blocks/blocks/Weaponary/Cannon/CannonBreechBlock";
import { LaserEmitterBlock } from "shared/blocks/blocks/Weaponary/Laser/LaserEmitterBlock";
import { LaserLensBlock } from "shared/blocks/blocks/Weaponary/Laser/LaserLensBlock";
import { ArmoredMachineGunBarrels } from "shared/blocks/blocks/Weaponary/Machinegun/ArmoredMachineGunBarrels";
import { MachineGunAmmoBlocks } from "shared/blocks/blocks/Weaponary/Machinegun/MachineGunAmmoBlocks";
import { MachineGunBarrels } from "shared/blocks/blocks/Weaponary/Machinegun/MachineGunBarrels";
import { MachineGunLoader } from "shared/blocks/blocks/Weaponary/Machinegun/MachineGunLoaderBlock";
import { MachineGunMuzzleBreaks } from "shared/blocks/blocks/Weaponary/Machinegun/MachineGunMuzzleBreaks";
import { PlasmaGunBarrelBlock } from "shared/blocks/blocks/Weaponary/Plasma/PlasmaGunBarrelBlock";
import { PlasmaGunBlock } from "shared/blocks/blocks/Weaponary/Plasma/PlasmaGunBlock";
import { PlasmaSeparatorMuzzleBlock } from "shared/blocks/blocks/Weaponary/Plasma/PlasmaSeparatorMuzzleBlock";
import { PlasmaShotgunMuzzleBlock } from "shared/blocks/blocks/Weaponary/Plasma/PlasmaShotgunMuzzleBlock";
import { GameDefinitions } from "shared/data/GameDefinitions";
import type { BlockBuilder } from "shared/blocks/Block";

export const CreateSandboxBlocks = (di: DIContainer): BlockList => {
	const weapons: BlockBuilder[] = [
		// PlasmaCoilAcceleratorUpgradeBlock, //todo: remove later

		//laser stuff
		LaserLensBlock,
		LaserEmitterBlock,

		//plasma stuff
		PlasmaShotgunMuzzleBlock,
		PlasmaSeparatorMuzzleBlock,
		PlasmaGunBarrelBlock,
		PlasmaGunBlock,

		//cannon stuff
		CannonBreech,
		...CannonBases,
		...CannonBarrels,

		// machinegun stuff
		MachineGunLoader,
		...MachineGunAmmoBlocks,
		...ArmoredMachineGunBarrels,
		...MachineGunBarrels,
		...MachineGunMuzzleBreaks,
	];

	const blocksArr: BlockBuilder[] = [
		...BuildingBlocks,
		...MechanicalBlocks,
		...BasicOperationBlocks,
		...BasicLogicGateBlocks,
		...WheelBlocks,
		...WingBlocks,
		...LampBlocks,
		...RocketBlocks,
		...ServoMotorBlocks,
		...TNTBlocks,
		...HingeBlocks,
		...StringOperationBlocks,

		PistonBlock,
		MotorBlock,
		RCSEngineBlock,
		DisconnectBlock,
		RopeBlock,
		SuspensionBlock,
		BallastBlock,
		HeliumBlock,
		MagnetBlock,
		BracedShaftBlock,
		BearingShaftBlock,

		ScreenBlock,
		LedDisplayBlock,
		SevenSegmentDisplayBlock,
		CameraBlock,
		BeaconBlock,

		VehicleSeatBlock,
		PassengerSeatBlock,
		BackMountBlock,

		DelayBlock,
		FallbackBlock,
		SingleImpulseBlock,
		ImpulseGeneratorBlock,
		ImpulseExtenderBlock,
		CounterBlock,
		TpsCounterBlock,
		LogicMemoryBlock,
		NonVolatileMemoryBlock,
		LogicMemoryLegacyBlock,
		RandomAccessMemoryBlock,
		StackMemoryBlock,
		ReadonlyMemoryBlock,
		RandomBlock,
		LogicOverclockBlock,

		AltimeterBlock,
		KeySensorBlock,
		ButtonBlock,
		ControllerBlock,
		AngleSensorBlock,
		GPSSensorBlock,
		FireSensorBlock,
		OwnerLocatorBlock,
		OwnerCameraLocatorBlock,
		GravitySensorBlock,
		MassSensorBlock,
		MouseSensorBlock,
		RadioReceiverBlock,
		RadioTransmitterBlock,
		RadarSectionBlock,
		SpeedometerBlock,
		LaserBlock,

		SpeakerBlock,
		...SoundEffectBlockCreator.all,
	];

	if (GameDefinitions.isTesting) {
		const testBlocks: readonly BlockBuilder[] = [
			//
			...weapons,
		];

		for (const block of testBlocks) {
			blocksArr.push(block);
		}
	}

	return BlockListBuilder.buildBlockList(blocksArr, di);
};
