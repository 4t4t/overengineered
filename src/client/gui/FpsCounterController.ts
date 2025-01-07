import { RunService } from "@rbxts/services";
import { Interface } from "client/gui/Interface";
import { HostedService } from "engine/shared/di/HostedService";

export class FpsCounterController extends HostedService {
	constructor() {
		super();

		const gui = Interface.getGameUI<{ Fps: TextLabel }>().Fps;
		gui.Visible = true;

		let fps = 0;
		this.event.subscribe(RunService.RenderStepped, (dt) => {
			if (fps === math.huge) fps = 0;
			fps = (fps + 1 / dt) / 2;
		});

		this.event.loop(0.5, () => (gui.Text = math.round(fps) + " FPS"));
	}
}
