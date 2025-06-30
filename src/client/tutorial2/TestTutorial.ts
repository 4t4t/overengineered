import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { PopupController } from "client/gui/PopupController";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ToolBase } from "client/tools/ToolBase";
import type { ToolController } from "client/tools/ToolController";
import type { TutorialDescription } from "client/tutorial2/TutorialDescription";
import type { TutorialStarter } from "client/tutorial2/TutorialStarter";
import type { TutorialStepComponent } from "client/tutorial2/TutorialStepController";

const start = (tutorial: TutorialStarter, firstTime: boolean) => {
	tutorial.$onInjectAuto(
		(
			mainScreen: MainScreenLayout,
			toolController: ToolController,
			buildingMode: BuildingMode,
			popupController: PopupController,
		) => {
			const tc = tutorial.controller;
			const plot = tutorial.plot;
			const step = tutorial.stepController;

			const gui = tc.gui;
			const tools = buildingMode.tools;

			const enableOnlyTools = (parent: TutorialStepComponent, ...tools: readonly ToolBase[]) => {
				parent.parentFunc(
					() => toolController.enabledTools.enableOnly(...tools),
					() => toolController.enabledTools.enableAll(),
				);
			};

			if (firstTime) {
				gui.progress.setStopAction((stop) => {
					const popup = popupController.showPopup(
						new ConfirmPopup("Are you sure you want to skip the tutorial?", "You DIE if you do that", stop),
					);

					// fix for tutorial fullscreen fade going over popups
					popup.instance.DisplayOrder = gui.instance.DisplayOrder + 1;
				});
			}

			gui.progress.setTitle("Basics tutorial");
			gui.progress.setText("Teaching about basics of the gaming");

			// intro
			step.step((parent, finish) => {
				parent.parent(tc.disableAllInput());
				parent.parentFunc(
					() => toolController.enabledTools.disableAll(),
					() => toolController.enabledTools.enableAll(),
				);
				parent.parent(gui.createFullScreenFade());
				parent.parent(
					gui
						.createText() //
						.withText("Hi engineer! I am play engineers and i'll teach you how to engineer")
						.withText("Click NEXT to CONTINUE")
						.withText("Or click big red STOP to SKIP the tutorial but then you will DIE")
						.withNext(finish),
				);
			});

			// select build tool
			step.sequence()
				.withOnStart(() => toolController.enabledTools.enableOnly(buildingMode.tools.buildTool))
				.withOnEnd(() => toolController.enabledTools.enableAll())

				.conditional({
					condition: () => toolController.selectedTool.get() === buildingMode.tools.buildTool,
					run: (parent) => {
						parent.parent(tc.disableAllInputExcept([Enum.KeyCode.One]));
						parent.parent(gui.createFullScreenFadeWithHoleAround(mainScreen.hotbar.instance, Vector2.zero));
						parent.parent(
							gui
								.createText()
								.withPositionAround(mainScreen.hotbar.instance, "up")
								.withText("This is your TOOLBAR")
								.withText("Your TOOLS are here")
								.withText("look CAREFOULY then press BUILD TOOL which is the first one")
								.withText("or key 1 on keyboard or whatevber idk on console"),
						);
					},
				})
				.conditional({
					condition: () =>
						tools.buildTool.gui.blockSelector.selectedCategory.get().sequenceEquals(["Blocks"]),
					run: (parent) => {
						parent.parent(tc.disableAllInput());
						parent.parent(
							gui.createFullScreenFadeWithHoleAround(tools.buildTool.gui.blockSelector.instance),
						);
						parent.parent(
							gui
								.createText()
								.withPositionAround(tools.buildTool.gui.blockSelector.instance, "right")
								.withText("to build you need blocks This is a block list it has blocks")
								.withText("select cateegory 'blocks'")
								.withText("there category bocks"),
						);
					},
				})
				.conditional({
					condition: () => tools.buildTool.selectedBlock.get()?.id === "block",
					run: (parent) => {
						parent.parent(tc.disableAllInput());
						parent.parent(
							gui.createFullScreenFadeWithHoleAround(tools.buildTool.gui.blockSelector.instance),
						);
						parent.parent(
							gui
								.createText()
								.withPositionAround(tools.buildTool.gui.blockSelector.instance, "right")
								.withText("good, NOW")
								.withText("select bock BLOCK"),
						);
					},
				});

			// place block
			step.step((parent, finish) => {
				parent.parentFunc(
					() => toolController.enabledTools.enableOnly(buildingMode.tools.buildTool),
					() => toolController.enabledTools.enableAll(),
				);
				parent.parent(
					gui
						.createText() //
						.withText("Now using your BUILD TOOL and your BLOCKS.BLOCK, place a BLOCK in the HIGHGLITH"),
				);

				parent.parent(
					plot.processDiff(
						{
							version: 32,
							added: [
								{ uuid: "0" as BlockUuid, id: "block", location: new CFrame(0, 1.5, 0) },
								{ uuid: "1" as BlockUuid, id: "block", location: new CFrame(2, 1.5, 0) },
							],
						},
						finish,
					),
				);
			});

			// select delete tool
			step.conditional({
				condition: () => toolController.selectedTool.get() === buildingMode.tools.deleteTool,
				run: (parent) => {
					parent.parentFunc(
						() =>
							toolController.enabledTools.enableOnly(
								buildingMode.tools.buildTool,
								buildingMode.tools.deleteTool,
							),
						() => toolController.enabledTools.enableAll(),
					);
					parent.parent(tc.disableAllInputExcept([Enum.KeyCode.One, Enum.KeyCode.Three]));
					parent.parent(gui.createFullScreenFadeWithHoleAround(mainScreen.hotbar.instance, Vector2.zero));
					parent.parent(
						gui
							.createText() //
							.withText("good. NO, WRONG. you are WRONG. you should NOT HAVE placed that BLOCK.")
							.withText("lets' DESTROY IT")
							.withText("SELECT delete TOOL")
							.withText("it deletes BLOCKS but not your debt"),
					);
				},
			});

			// delete block
			step.step((parent, finish) => {
				parent.parentFunc(
					() =>
						toolController.enabledTools.enableOnly(
							buildingMode.tools.buildTool,
							buildingMode.tools.deleteTool,
						),
					() => toolController.enabledTools.enableAll(),
				);
				parent.parent(
					gui
						.createText() //
						.withText("destroy the IMPOSTER")
						.withText("(hes highlighted red, you see)")
						.withText("(sus or something)")
						.withText("(delete him before he vents)"),
				);

				parent.parent(plot.processDiff({ version: 32, removed: ["0" as BlockUuid] }, finish));
			});

			tutorial.start();
		},
	);
};

export const TestTutorial = {
	name: "Basics",
	description: "Teaching basics of the game by building a simple plane",
	start,
} satisfies TutorialDescription;
