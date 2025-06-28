import { IntegrityChecker } from "client/IntegrityChecker";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { Element } from "engine/shared/Element";

export type FloatingWindowDefinition = GuiObject & {
	//
};
export class FloatingWindow extends Control<FloatingWindowDefinition> {
	static newScreen(name?: string): ScreenGui {
		return Element.create("ScreenGui", {
			Name: `${name} Floating`,
			Enabled: false,
			ResetOnSpawn: false,
			Parent: Interface.getPlayerGui(),
		});
	}
	static create(gui: FloatingWindowDefinition): FloatingWindow {
		const guiInstance = this.newScreen(gui.Name);
		IntegrityChecker.whitelist.add(guiInstance);

		const control = new FloatingWindow(gui, guiInstance);
		control.add(control);

		return control;
	}

	constructor(gui: FloatingWindowDefinition, screen: ScreenGui) {
		super(gui);

		gui.Parent = screen;

		this.onEnable(() => (screen.Enabled = true));
		this.onDisable(() => (screen.Enabled = false));
		ComponentInstance.init(this, screen);
	}
}
