import { ServerScriptService, Workspace } from "@rbxts/services";
// import { BadgeController } from "server/BadgeController";

import { InMemoryDatabaseBackend } from "engine/server/backend/InMemoryDatabaseBackend";
import { Logger } from "engine/shared/Logger";
import { BaseGame } from "server/BaseGame";
import { ServerBlockLogicController } from "server/blocks/ServerBlockLogicController";
import { PlayerDatabase } from "server/database/PlayerDatabase";
import { SlotDatabase } from "server/database/SlotDatabase";
import { PlayModeController as PlayModeController } from "server/modes/PlayModeController";
import { UnreliableRemoteController } from "server/network/event/UnreliableRemoteHandler";
import { ServerPlots } from "server/plots/ServerPlots";
import { RagdollController } from "server/RagdollController";
import { ServerEffectCreator } from "server/ServerEffectCreator";
import { ServerPlayersController } from "server/ServerPlayersController";
import { SpreadingFireController } from "server/SpreadingFireController";
import { UsernameGuiController } from "server/UsernameGuiController";
import { SharedPlots } from "shared/building/SharedPlots";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { RemoteEvents } from "shared/RemoteEvents";
import { CreateSandboxBlocks } from "shared/SandboxBlocks";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";
import type { EffectCreator } from "shared/effects/EffectBase";

export namespace SandboxGame {
	export function initialize(builder: GameHostBuilder) {
		if (game.PrivateServerOwnerId !== 0) {
			Workspace.AddTag("PrivateServer");
		}

		BaseGame.initialize(builder);

		// private anywaymachines services
		const awm = ServerScriptService.FindFirstChild("anywaymachines")?.FindFirstChild("SandboxGame") as
			| ModuleScript
			| undefined;
		if (awm) {
			(require(awm) as { SandboxGame: { init: (builder: GameHostBuilder) => void } }).SandboxGame.init(builder);
		} else {
			builder.services
				.registerSingletonClass(PlayerDatabase) //
				.withArgs([new InMemoryDatabaseBackend()]);
			builder.services
				.registerSingletonClass(SlotDatabase) //
				.withArgs([new InMemoryDatabaseBackend()]);

			// builder.services
			// 	.registerSingletonClass(PlayerDatabase) //
			// 	.withArgs([new DataStoreDatabaseBackend(DataStoreService.GetDataStore("players"))]);
			// builder.services
			// 	.registerSingletonClass(SlotDatabase) //
			// 	.withArgs([new DataStoreDatabaseBackend(DataStoreService.GetDataStore("slots"))]);
		}

		for (const line of GameDefinitions.getEnvironmentInfo()) {
			Logger.info(line);
		}

		builder.services.registerService(ServerPlayersController);

		builder.services.registerSingletonClass(SpreadingFireController);

		builder.services
			.registerSingletonClass(ServerEffectCreator) //
			.as<EffectCreator>();
		RemoteEvents.initializeVisualEffects(builder);

		builder.services.registerSingletonFunc(() => SharedPlots.initialize());
		builder.services.registerSingletonFunc(CreateSandboxBlocks);

		builder.services.registerService(ServerPlots);
		builder.services.registerService(UsernameGuiController);
		PlayModeController.initialize(builder);
		builder.services.registerService(ServerBlockLogicController);
		builder.services.registerService(UnreliableRemoteController);
		builder.services.registerService(RagdollController);

		// BadgeController.initializeIfProd(builder);
	}
}
