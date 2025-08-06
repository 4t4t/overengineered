const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

let projectRoot = process.cwd();
const argIndex = process.argv.indexOf("--project-root");
if (argIndex !== -1 && process.argv[argIndex + 1]) {
	projectRoot = path.resolve(process.argv[argIndex + 1]);
}

const invocationDir = process.cwd();
const outPath = path.join(projectRoot, "out");
const lunewatchPath = path.join(projectRoot, "scripts", "lunewatch.js");

const logMain = (...args) => console.log(chalk.green("[main]"), ...args);

logMain("Project root:   ", projectRoot);
logMain("Invocation dir: ", invocationDir);
logMain("Watching ./out in:", outPath);
logMain("lunewatch path:", lunewatchPath);

function printWithPrefix(data, prefix, colorFn) {
	const lines = data.toString().split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.trim() !== "") {
			console.log(colorFn(prefix) + " " + line);
		}
	}
}

function runCommand(label, command, argsArray, cwd) {
	const fullCommand = [command, ...argsArray].map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg)).join(" ");

	const proc = spawn(fullCommand, {
		cwd,
		stdio: "pipe",
		shell: true,
	});

	const prefix = `[${label}]`;
	const color = chalk.blue;
	const errorColor = chalk.red;
	const exitColor = chalk.gray;

	proc.stdout.on("data", (data) => {
		printWithPrefix(data, prefix, color);
	});

	proc.stderr.on("data", (data) => {
		printWithPrefix(data, prefix + " ERROR", errorColor);
	});

	proc.on("close", (code) => {
		console.log(exitColor(`${prefix} exited with code ${code}`));
	});

	return proc;
}

runCommand("compile", "npm", ["run", "watch"], invocationDir);

function waitForOutFolder() {
	if (fs.existsSync(outPath) && fs.statSync(outPath).isDirectory()) {
		runCommand("rojo", "npm", ["run", "rojo"], invocationDir);
		return;
	}

	logMain("Waiting for ./out folder...");
	const interval = setInterval(() => {
		if (fs.existsSync(outPath) && fs.statSync(outPath).isDirectory()) {
			clearInterval(interval);
			logMain("./out folder found. Starting rojo...");
			runCommand("rojo", "npm", ["run", "rojo"], invocationDir);
		}
	}, 500);
}

waitForOutFolder();

runCommand("assets", "node", [lunewatchPath], projectRoot);
