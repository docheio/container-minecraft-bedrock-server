/* prettier-ignore */ import * as child			from "child_process";
/* prettier-ignore */ import * as readline		from "readline";
/* prettier-ignore */ import * as tslog			from "tslog";
/* prettier-ignore */ import axios				from "axios";
/* prettier-ignore */ import cron				from "node-cron";
/* prettier-ignore */ import fs					from "fs/promises";
/* prettier-ignore */ import { sig_end_kit }	from "./handler/sig_handler";
/* prettier-ignore */ import { sleep }			from "./module/sleep";

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
		child.execSync("touch ./version.txt");
		// prettier-ignore
		if (url != (await fs.readFile("./version.txt", "utf-8"))) {
			await fs.writeFile("./version.txt", url);
			child.execSync(`curl -sLo minecraft.zip ${url}`);
			child.execSync("unzip minecraft.zip -d minecraft");
			child.execSync("rm -rf ./minecraft.zip");
			child.execSync("echo 'emit-server-telemetry=true' >> ./minecraft/server.properties");
		}
	}
}

async function exec() {
	process.stdin.setEncoding("utf8");

	const reader = readline.createInterface({ input: process.stdin });
	const proc = child.spawn("./bedrock_server", [], { cwd: "./minecraft" });

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

	sig_end_kit(async (i = 0, exited = false) => {
		proc.addListener("close", () => (exited = true));
		proc.stdin.write("stop\n");
		while (exited == false && ++i <= 40) await sleep(500);
	});
}

async function backup() {
	cron.schedule("0 0 0,6,12,18 * * *", async () => {
		console.warn("BACKUP");
		child.execSync(`mkdir -p backup`);
		let files = await fs.readdir("./backup");
		files.forEach((file) => {
			if (!file.endsWith(".tar.gz"))
				child.execSync(`rm -rf ${file}`, { cwd: "./backup" });
		});
		files = await fs.readdir("./backup");
		if (files.length >= 5) {
			files = files.sort().reverse();
			let i = files.length - 1;
			while (i >= 4)
				child.execSync(`rm -rf ./${files[i--]}`, { cwd: "./backup" });
		}
		// prettier-ignore
		child.execSync(`tar zcfp ../backup/${Date.now()}.tar.gz behavior_packs resource_packs worlds allowlist.json permissions.json server.properties`, { cwd: "./minecraft" });
	});
}

async function main() {
	await update();
	exec();
	backup();
}

/* prettier-ignore */ (_=>_())(main);
