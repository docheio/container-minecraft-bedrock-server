/* prettier-ignore */ import * as child			from "child_process";
/* prettier-ignore */ import * as readline		from "readline";
/* prettier-ignore */ import * as tslog			from "tslog";
/* prettier-ignore */ import axios				from "axios";
/* prettier-ignore */ import fs					from "fs/promises";
/* prettier-ignore */ import { sig_end_kit }	from "./handler/sig_handler";
/* prettier-ignore */ import { sleep }			from "./module/sleep";
/* prettier-ignore */ import { color }			from "./module/cli_color";

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

	proc.stdout.setEncoding("utf-8");

	reader.on("line", (line) => {
		proc.stdin.write(line);
	});

	let exited = false;
	sig_end_kit(async () => {
		proc.stdin.write("stop\n");
		let i = 0;
		while (!exited && i++ <= 40) await sleep(500);
		console.warn(`${color.red}[SIGEND]${color.default} Received`);
	});

	proc.stdout.on("data", async (data) => {
		let lines: string[];
		let i: number = 0;

		lines = data.split("\n");
		lines = lines.filter((line: string) => line !== "");
		while (i < lines.length) console.info(lines[i++]);
	});

	proc.addListener("close", () => {
		exited = true;
	});
}

async function backup() {}

async function main() {
	await update();
	exec();
	backup();
}

((_) => _())(main);
