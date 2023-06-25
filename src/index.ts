/* prettier-ignore */ import * as child			from "child_process";
/* prettier-ignore */ import * as readline		from "readline";
/* prettier-ignore */ import * as tslog			from "tslog";
/* prettier-ignore */ import axios				from "axios";
/* prettier-ignore */ import cron				from "node-cron";
/* prettier-ignore */ import fs					from "fs/promises";
/* prettier-ignore */ import { existsSync }		from "fs";
/* prettier-ignore */ import { sig_end_kit }	from "./handler/sig_handler";
/* prettier-ignore */ import { sleep }			from "./module/sleep";
/* prettier-ignore */ import { mini_shell }		from "./module/mini_shell";

const console = new tslog.Logger();

async function update() {
	let url = "https://www.minecraft.net/en-us/download/server/bedrock";

	let res = await axios.get(url, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
			Accept:
				"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
		},
	});

	// prettier-ignore
	let reg_data = res.data.match(/https:\/\/minecraft\.azureedge\.net\/bin-linux\/bedrock-server-[0-9.]+\.zip/);
	if (reg_data && reg_data.length != 0) {
		url = reg_data[0];
		child.execSync("mkdir -p ./mount");
		child.execSync("touch ./version.txt", { cwd: "mount" });
		if (url != (await fs.readFile("./mount/version.txt", "utf-8"))) {
			await fs.writeFile("./mount/version.txt", url);
			child.execSync(`curl -sLo minecraft.zip ${url}`);
			child.execSync("unzip minecraft.zip -d ./cache");
			if (existsSync("./mount/minecraft")) {
				console.info("Updating");
				child.execSync("rm -rf allowlist.json", { cwd: "./cache" });
				child.execSync("rm -rf behavior_packs", { cwd: "./cache" });
				child.execSync("rm -rf permissions.json", { cwd: "./cache" });
				child.execSync("rm -rf resource_packs", { cwd: "./cache" });
				child.execSync("rm -rf server.properties", { cwd: "./cache" });
				child.execSync("rm -rf bedrock_server", { cwd: "./mount/minecraft" });
				child.execSync("rm -rf *.html", { cwd: "./mount/minecraft" });
				child.execSync("rm -rf *.debug", { cwd: "./mount/minecraft" });
				child.execSync("rm -rf *.txt", { cwd: "./mount/minecraft" });
				child.execSync("rm -rf config", { cwd: "./mount/minecraft" });
				child.execSync("rm -rf definitions", { cwd: "./mount/minecraft" });
			}
			child.execSync("mkdir -p ./mount/minecraft");
			child.execSync("cp -r ./cache/* ./mount/minecraft/");
			child.execSync("rm -rf ./cache minecraft.zip");
			// prettier-ignore
			if (!(await fs.readFile("./mount/minecraft/server.properties", "utf-8")).includes("emit-server-telemetry=true"))
				child.execSync("echo 'emit-server-telemetry=true' >> server.properties", { cwd: "./mount/minecraft" });
		}
	}
}

async function exec() {
	process.stdin.setEncoding("utf8");

	const reader = readline.createInterface({ input: process.stdin });
	// prettier-ignore
	const proc = child.spawn("./bedrock_server", [], { cwd: "./mount/minecraft" });

	reader.on("line", (line) => {
		proc.stdin.write(`${line}\n`);
	});

	proc.stdout.setEncoding("utf-8");
	proc.stdout.on("data", async (data) => {
		let lines: string[];
		let i: number = 0;

		lines = data.split("\n");
		lines = lines.filter((line: string) => line !== "");
		while (i < lines.length) console.info(lines[i++]);
		if (data == "Quit correctly\n") process.exit(0);
	});

	proc.addListener("close", () => {
		process.exit(0);
	});

	sig_end_kit(async (i = 0, exited = false) => {
		proc.stdin.write("stop\n");
		while (exited == false && ++i <= 40) await sleep(500);
	});

	mini_shell(proc);
}

async function backup() {
	cron.schedule("0 0 0,6,12,18 * * *", async () => {
		console.info("BACKUP");
		child.execSync(`mkdir -p ./mount/backup`);
		let files = await fs.readdir("./mount/backup");
		files.forEach((file) => {
			if (!file.endsWith(".tar.gz"))
				child.execSync(`rm -rf ${file}`, { cwd: "./mount/backup" });
		});
		files = await fs.readdir("./mount/backup");
		if (files.length >= 5) {
			files = files.sort().reverse();
			let i = files.length - 1;
			while (i >= 4)
				child.execSync(`rm -rf ${files[i--]}`, { cwd: "./mount/backup" });
		}
		child.execSync(
			`tar zcfp ../backup/${Date.now()}.tar.gz worlds allowlist.json behavior_packs permissions.json resource_packs server.properties`,
			{ cwd: "./mount/minecraft" }
		);
	});
}

async function main() {
	await update();
	exec();
	backup();
}

/* prettier-ignore */ (_=>_())(main);
