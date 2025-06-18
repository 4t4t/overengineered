import { Players, RunService, ServerStorage, TeleportService } from "@rbxts/services";
import { ComponentKeyedChildren } from "engine/shared/component/ComponentKeyedChildren";
import { HostedService } from "engine/shared/di/HostedService";
import { Lock } from "engine/shared/fixes/Lock";
import { PlayerWatcher } from "engine/shared/PlayerWatcher";
import { t } from "engine/shared/t";
import { isNotAdmin_AutoBanned } from "server/BanAdminExploiter";
import { ServerSlotRequestController } from "server/building/ServerSlotRequestController";
import { PlayerBanned } from "server/database/PlayerDatabase";
import { asPlayerId } from "server/PlayerId";
import { ServerPlayerController } from "server/ServerPlayerController";
import { ServerPlayerDataRemotesController } from "server/ServerPlayerDataRemotesController";
import { CustomRemotes } from "shared/Remotes";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { SlotDatabase } from "server/database/SlotDatabase";
import type { SharedPlots } from "shared/building/SharedPlots";
import type { PlayerInitResponse } from "shared/Remotes";

@injectable
export class ServerPlayersController extends HostedService {
	readonly controllers;

	constructor(@inject players: PlayerDatabase, @inject sharedPlots: SharedPlots, @inject di: DIContainer) {
		super();

		const controllers = this.parent(new ComponentKeyedChildren<number, ServerPlayerController>(true));
		this.controllers = controllers.children;

		const initPlayerLock = new Lock();
		this.event.subscribeRegistration(() =>
			CustomRemotes.initPlayer.subscribe((player): Response<PlayerInitResponse> => {
				const shadowBan = () => {
					ServerStorage.FindFirstChild("ShadowBan")!.Clone().Parent = (
						player as unknown as { PlayerGui: PlayerGui }
					).PlayerGui;
				};
				if (
					player.Name.lower().contains("st0rm") ||
					player.Name.lower().contains("5t0rm") ||
					player.Name.lower().contains("st0rm") ||
					player.Name.lower().contains("5torm")
				) {
					shadowBan();
					return { success: false, message: "no" };
				}

				const cresult = initPlayerLock.execute((): Response<{ controller: ServerPlayerController }> => {
					if (controllers.getAll().has(player.UserId)) {
						task.spawn(() => player.Kick("hi  i like your hair"));
						controllers.remove(player.UserId);

						return { success: false, message: "no" };
					}

					const plot = sharedPlots.plots.find((p) => p.ownerId.get() === undefined);
					if (!plot) {
						return { success: false, message: "No free plot found, try again later." };
					}

					const scope = di.beginScope((builder) => {
						builder.registerSingletonValue(player);
						builder.registerSingletonValue(plot);
						builder.registerSingletonClass(ServerPlayerController);
					});

					const controller = scope.resolveForeignClass(ServerPlayerController, [player, plot]);
					controllers.add(player.UserId, controller);

					return { success: true, controller };
				});

				if (!cresult.success) return cresult;
				const controller = cresult.controller;

				let data;
				try {
					data = players.get(player.UserId) ?? {};

					if (
						!RunService.IsStudio() &&
						game.PlaceId !== 88843175246235 &&
						(data as { placeId?: number }).placeId !== game.PlaceId
					) {
						const placeId = (data! as { placeId: number }).placeId;
						task.spawn(() => {
							TeleportService.TeleportAsync(placeId, [player]);
						});
					}

					return {
						success: true,
						remotes: controller.remotesFolder,
						data: {
							purchasedSlots: data.purchasedSlots,
							settings: data.settings,
							slots: data.slots,
							data: data.data,
						},
					};
				} catch (err) {
					if (t.typeCheck(err, PlayerBanned)) {
						const secondsToText = (msuntil: number): string => {
							const intervals = [
								{ label: "year", seconds: 31536000 },
								{ label: "month", seconds: 2592000 },
								{ label: "day", seconds: 86400 },
								{ label: "hour", seconds: 3600 },
								{ label: "minute", seconds: 60 },
								{ label: "second", seconds: 1 },
							];

							const seconds = (msuntil - DateTime.now().UnixTimestampMillis) / 1000;
							for (const interval of intervals) {
								const count = math.floor(seconds / interval.seconds);
								if (count >= 1) {
									return `${count} ${interval.label}${count !== 1 ? "s" : ""} left`;
								}
							}

							return "ඞ";
						};

						const data = err;
						if (!data.reason.contains("bye bye")) {
							player.Kick(
								`You are ${data.until ? "" : "permanently "}banned!\n${data.reason}${data.until && `\n${secondsToText(data.until)}`}`,
							);
							return { success: false, message: "ban haha" };
						}

						shadowBan();
						return { success: false, message: "no" };
					}

					player.Kick("The server is currently unavailable, try again later.");
					return { success: false, message: tostring(err) };
				}
			}),
		);
		this.event.subscribeRegistration(() =>
			CustomRemotes.adminDataFor.subscribe((sender, playerId): Response<PlayerInitResponse> => {
				if (isNotAdmin_AutoBanned(sender, "adminDataFor")) {
					return { success: false, message: "no" };
				}

				const controller = this.controllers.get(sender.UserId);
				if (!controller) {
					return { success: false, message: "you are LITERALLY offline" };
				}

				const scope = di.beginScope((builder) => {
					builder.registerSingletonValue(asPlayerId(playerId));
				});

				const spdrc = ServerPlayerDataRemotesController.create(scope, playerId, sender);
				spdrc.enable();

				spdrc.parent(
					new ServerSlotRequestController(
						asPlayerId(playerId),
						spdrc.slotRemotes,
						controller.plotController.blocks,
						scope.resolve<BlockList>(),
						scope.resolve<PlayerDatabase>(),
						scope.resolve<SlotDatabase>(),
					),
				);

				const data = players.get(playerId) ?? {};

				return {
					success: true,
					remotes: spdrc.remotesFolder,
					data: {
						purchasedSlots: data.purchasedSlots,
						settings: data.settings,
						slots: data.slots,
						data: data.data,
					},
				};
			}),
		);

		this.event.subscribeRegistration(() =>
			PlayerWatcher.onQuit((player) => {
				controllers.remove(player.UserId);
			}),
		);

		game.BindToClose(() => {
			$log("Game quit, destroying controllers...");

			for (const [playerId, controller] of controllers.getAll()) {
				$log(`Destroying controller of ${playerId}`);
				controller.destroy();
			}
		});
	}

	getPlayers(): readonly Player[] {
		return this.controllers
			.getAll()
			.keys()
			.mapFiltered((id) => Players.GetPlayerByUserId(id));
	}
}
